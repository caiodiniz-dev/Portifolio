"""
Finix FastAPI proxy on port 8001.
- Spawns TypeScript backend subprocess (port 8000) on startup
- Proxies /api/* requests to TS backend (transparent pass-through)
- Handles Stripe payment endpoints directly using emergentintegrations
"""
import asyncio
import json
import logging
import os
import signal
import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

load_dotenv()

# Load TS backend env for JWT secret (shared with internal routes)
ts_env_path = Path("/app/backend-ts/.env")
if ts_env_path.exists():
    load_dotenv(ts_env_path)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("finix-proxy")

# Config
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
TS_BACKEND_URL = os.environ.get("TS_BACKEND_URL", "http://localhost:8000")
INTERNAL_SECRET = os.environ.get("JWT_SECRET", "finix-dev-secret")
TS_BACKEND_DIR = "/app/backend-ts"

# Fixed plans (SECURITY: amounts never come from frontend)
PLANS = {
    "BASIC": {"id": "BASIC", "name": "Básico", "price": 10.0, "currency": "brl"},
    "PRO":   {"id": "PRO",   "name": "Pro",    "price": 35.0, "currency": "brl"},
}

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest,
)

ts_process: Optional[subprocess.Popen] = None
http_client: Optional[httpx.AsyncClient] = None


async def wait_for_ts_backend(url: str, timeout: int = 60) -> bool:
    """Poll TS backend until it responds."""
    async with httpx.AsyncClient() as client:
        for _ in range(timeout * 2):
            try:
                r = await client.get(f"{url}/api/health", timeout=2)
                if r.status_code == 200:
                    return True
            except Exception:
                pass
            await asyncio.sleep(0.5)
    return False


def start_ts_backend():
    global ts_process
    if ts_process and ts_process.poll() is None:
        return
    log.info("Iniciando TypeScript backend...")
    env = os.environ.copy()
    env["PORT"] = "8000"
    ts_process = subprocess.Popen(
        ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/server.ts"],
        cwd=TS_BACKEND_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        preexec_fn=os.setsid if os.name != "nt" else None,
    )
    log.info(f"TS backend PID: {ts_process.pid}")

    # Stream TS logs in background
    def stream_logs():
        if ts_process and ts_process.stdout:
            for line in ts_process.stdout:
                print(f"[TS] {line.decode(errors='ignore').rstrip()}", flush=True)
    import threading
    threading.Thread(target=stream_logs, daemon=True).start()


def stop_ts_backend():
    global ts_process
    if ts_process and ts_process.poll() is None:
        try:
            os.killpg(os.getpgid(ts_process.pid), signal.SIGTERM)
        except Exception:
            ts_process.terminate()
        try:
            ts_process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            ts_process.kill()
    ts_process = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    start_ts_backend()
    ok = await wait_for_ts_backend(TS_BACKEND_URL, timeout=90)
    if not ok:
        log.error("TS backend não respondeu dentro do timeout")
    else:
        log.info("TS backend pronto!")
    http_client = httpx.AsyncClient(timeout=60.0)
    yield
    if http_client:
        await http_client.aclose()
    stop_ts_backend()


app = FastAPI(title="Finix API Gateway", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HELPERS - Internal API calls to TS backend
# ============================================================================
async def get_user_from_token(authorization: Optional[str]) -> Optional[dict]:
    """Validate JWT via TS /api/auth/me."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        r = await http_client.get(
            f"{TS_BACKEND_URL}/api/auth/me",
            headers={"Authorization": authorization},
        )
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        log.error(f"auth/me error: {e}")
    return None


async def ts_internal(method: str, path: str, **kwargs):
    headers = kwargs.pop("headers", {})
    headers["x-internal-secret"] = INTERNAL_SECRET
    r = await http_client.request(method, f"{TS_BACKEND_URL}{path}", headers=headers, **kwargs)
    return r


# ============================================================================
# STRIPE - Create Checkout Session
# ============================================================================
class CreateCheckoutBody(BaseModel):
    plan_id: str  # "BASIC" | "PRO"
    origin_url: str


@app.post("/api/checkout/session")
async def create_checkout_session(body: CreateCheckoutBody, request: Request):
    # Auth
    user = await get_user_from_token(request.headers.get("authorization"))
    if not user:
        raise HTTPException(401, "Não autenticado")

    # Validate plan (SECURITY)
    plan_id = body.plan_id.upper()
    if plan_id not in PLANS:
        raise HTTPException(400, "Plano inválido")
    plan = PLANS[plan_id]

    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe não configurado")

    # Build URLs from frontend origin
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/app/plans?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/app/plans?canceled=1"

    # Webhook URL for Stripe
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "user_id": user["id"],
        "user_email": user["email"],
        "plan_id": plan_id,
        "source": "finix_web",
    }

    try:
        checkout_req = CheckoutSessionRequest(
            amount=plan["price"],
            currency=plan["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )
        session = await stripe_checkout.create_checkout_session(checkout_req)
    except Exception as e:
        log.exception("create_checkout_session failed")
        raise HTTPException(500, f"Erro ao criar sessão: {e}")

    # Create pending payment transaction record
    await ts_internal("POST", "/internal/create-payment-tx", json={
        "userId": user["id"],
        "userEmail": user["email"],
        "sessionId": session.session_id,
        "amount": plan["price"],
        "currency": plan["currency"],
        "plan": plan_id,
        "metadata": metadata,
    })

    return {"url": session.url, "session_id": session.session_id}


# ============================================================================
# STRIPE - Get Checkout Status (polled by frontend)
# ============================================================================
@app.get("/api/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    user = await get_user_from_token(request.headers.get("authorization"))
    if not user:
        raise HTTPException(401, "Não autenticado")

    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe não configurado")

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    try:
        status = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        log.exception("get_checkout_status failed")
        raise HTTPException(500, f"Erro ao verificar pagamento: {e}")

    # Fetch local payment tx
    r = await ts_internal("GET", f"/internal/payment-tx/{session_id}")
    if r.status_code != 200:
        raise HTTPException(404, "Transação não encontrada")
    local_tx = r.json()

    # Idempotent update
    new_payment_status = status.payment_status
    new_status = status.status

    if local_tx["paymentStatus"] != "paid" and new_payment_status == "paid":
        # First time seeing paid -> update user plan
        plan_id = local_tx["plan"]
        try:
            from datetime import datetime, timedelta, timezone
            expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            await ts_internal("POST", "/internal/update-user-plan", json={
                "userId": local_tx["userId"],
                "plan": plan_id,
                "planExpiresAt": expires,
            })
        except Exception as e:
            log.error(f"Erro ao atualizar plano: {e}")

    # Update payment tx
    if local_tx["paymentStatus"] != new_payment_status or local_tx["status"] != new_status:
        await ts_internal("POST", "/internal/update-payment-tx", json={
            "sessionId": session_id,
            "paymentStatus": new_payment_status,
            "status": new_status,
        })

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "metadata": status.metadata,
        "plan": local_tx["plan"],
    }


# ============================================================================
# STRIPE - Webhook
# ============================================================================
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe não configurado")

    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    try:
        event = await stripe_checkout.handle_webhook(body, signature)
    except Exception as e:
        log.error(f"webhook verify failed: {e}")
        raise HTTPException(400, f"Webhook inválido: {e}")

    log.info(f"Webhook: {event.event_type} session={event.session_id} status={event.payment_status}")

    if event.session_id and event.event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        # Fetch local tx
        r = await ts_internal("GET", f"/internal/payment-tx/{event.session_id}")
        if r.status_code == 200:
            local_tx = r.json()
            # Idempotent: only update plan if not already paid
            if local_tx["paymentStatus"] != "paid" and event.payment_status == "paid":
                from datetime import datetime, timedelta, timezone
                expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                plan_id = local_tx["plan"]
                await ts_internal("POST", "/internal/update-user-plan", json={
                    "userId": local_tx["userId"],
                    "plan": plan_id,
                    "planExpiresAt": expires,
                })
                await ts_internal("POST", "/internal/update-payment-tx", json={
                    "sessionId": event.session_id,
                    "paymentStatus": "paid",
                    "status": "complete",
                })

    return {"received": True}


# ============================================================================
# PROXY - All other /api/* routes pass through to TS backend
# ============================================================================
EXCLUDED_PATHS = {"/api/checkout/session", "/api/webhook/stripe"}

@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_api(full_path: str, request: Request):
    # Skip if this is one of our native handlers
    path = f"/api/{full_path}"
    if path.startswith("/api/checkout/status/"):
        # Let FastAPI route it normally via the specific handler above
        # (this won't actually reach here because specific route matches first)
        pass

    body = await request.body()
    # Forward headers except host
    fwd_headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host", "content-length"}}
    url = f"{TS_BACKEND_URL}{path}"
    query = request.url.query
    if query:
        url = f"{url}?{query}"
    try:
        r = await http_client.request(
            request.method, url, content=body, headers=fwd_headers,
        )
    except httpx.ConnectError:
        return JSONResponse({"error": "Backend TS indisponível"}, status_code=503)

    # Filter hop-by-hop headers
    excluded = {"transfer-encoding", "content-encoding", "connection"}
    resp_headers = {k: v for k, v in r.headers.items() if k.lower() not in excluded}
    return Response(content=r.content, status_code=r.status_code, headers=resp_headers)


@app.get("/")
async def root():
    return {"app": "Finix Gateway", "status": "ok"}
