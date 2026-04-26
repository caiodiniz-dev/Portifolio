# Finix Auth Testing Playbook

## Step 1: MongoDB Verification
```
mongosh
use finix
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, unique index on `users.email`.

## Step 2: API Testing (Bearer token based)
```
# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finix.com","password":"Admin@123"}'

# Get current user
TOKEN="<access_token from login>"
curl http://localhost:8001/api/auth/me -H "Authorization: Bearer $TOKEN"
```
