# 🎬 Passo a Passo - Como Rodar o Finix Melhorado

## ⚡ Rápido (2 minutos)

### Já tem tudo instalado?

#### Terminal 1 - Backend
```bash
cd backend-ts
npm run dev
```

#### Terminal 2 - Frontend (novo terminal)
```bash
cd frontend
npm run dev
```

#### Abra no navegador
```
http://localhost:3000
```

✅ **Pronto! Está rodando.**

---

## 📦 Completo (5 minutos - primeira vez)

### 1️⃣ Navegue para o projeto
```bash
cd c:\Users\Caio\Desktop\Finix\Finix
```

### 2️⃣ Configure o Backend
```bash
# Entre na pasta
cd backend-ts

# Instale dependências
npm install

# Verifique .env
# Deve ter: PORT=8000 e ANTHROPIC_API_KEY=""

# Rode o backend
npm run dev
```

**Resultado esperado:**
```
Finix TS backend running on port 8000
```

### 3️⃣ Configure o Frontend (novo terminal)
```bash
# Entre na pasta frontend
cd frontend

# Instale dependências
npm install

# Rode o frontend
npm run dev
```

**Resultado esperado:**
```
webpack compiled successfully
```

### 4️⃣ Acesse
Abra seu navegador em:
```
http://localhost:3000
```

---

## 🔐 Login

Use uma das contas de teste:

### Opção 1: Admin
```
Email: admin@finix.com
Senha: Admin@123
```
✨ Acesso ao painel admin

### Opção 2: Demo User (com dados)
```
Email: demo@finix.com
Senha: Demo@123
```
✨ Já tem transações de exemplo

### Opção 3: Criar novo usuário
```
Clique em "Registrar"
Preencha nome, email, senha
Pronto! Já logged in
```

---

## ✅ Verificar se Tudo Funciona

### Feature 1: Dashboard com Saudação
- [ ] Você vê "Olá, [seu nome]! 👋"?
- [ ] Aparecem as 4 cards (saldo, receitas, etc)?
- [ ] Botões "PDF", "Excel", "IA" aparecem?

### Feature 2: Foto na Sidebar
- [ ] Vê sua foto redonda no topo esquerdo?
- [ ] Ou vê as iniciais do seu nome (fallback)?

### Feature 3: Enviar Foto
- [ ] Vá para Perfil
- [ ] Clique "Selecionar foto"
- [ ] Escolha uma imagem
- [ ] Vê preview antes de enviar?
- [ ] Clique "Enviar foto"
- [ ] Recarrega e mostra a foto?

### Feature 4: IA
- [ ] No Dashboard, clique "Análise com IA"
- [ ] Aparece loading spinner?
- [ ] Mostra "Análise da IA pronta!"?
- [ ] Aparecem cards com insights?

### Feature 5: Exportar
- [ ] Clique "PDF" → Baixa arquivo
- [ ] Clique "Excel" → Baixa arquivo CSV

---

## 🐛 Troubleshooting

### ❌ "Erro de conexão" / "Cannot reach localhost:8000"
```bash
# Certifique que o backend está rodando
# Verifique se não está em outra porta

# Opção 1: Confirme no terminal do backend
# Deve dizer: "running on port 8000"

# Opção 2: Tente outra porta
cd backend-ts
PORT=9000 npm run dev

# Opção 3: Atualize .env do frontend
# REACT_APP_BACKEND_URL=http://localhost:9000
```

### ❌ "Porta 3000/8000 em uso"
```bash
# Mude de porta no .env

# Backend:
# backend-ts/.env
PORT=9000  # ou 8001, 8002, etc

# Frontend:
# frontend/.env (crie se não existir)
# PORT=3001  # ou 3002, 3003, etc
REACT_APP_BACKEND_URL=http://localhost:9000
```

### ❌ "npm: comando não encontrado"
```bash
# Instale Node.js em: https://nodejs.org
# Reinicie o terminal depois
node --version  # Deve mostrar versão
npm --version   # Deve mostrar versão
```

### ❌ "Foto não aparece após enviar"
```bash
# 1. Recarregue a página (Ctrl+R ou Cmd+R)
# 2. Verifique console (F12 → Console)
# 3. Abra DevTools → Network
# 4. Verifique se PUT /api/profile retornou 200
```

### ❌ "IA não funciona / diz 'análise indisponível'"
```bash
# 1. É normal! ANTHROPIC_API_KEY está vazia
# 2. Para ativar, obtenha uma chave em:
#    https://console.anthropic.com
# 3. Adicione a .env do backend:
#    ANTHROPIC_API_KEY=sk-ant-xxx...
# 4. Reinicie o backend
# 5. Tente novamente
```

---

## 📊 Status esperado

### Backend Console
```
✅ Finix TS backend running on port 8000
✅ Listening on http://localhost:8000
```

### Frontend Console
```
✅ webpack compiled successfully
✅ Compiled successfully
```

### Navegador
```
✅ Página carrega
✅ Vê o logo do Finix
✅ Ou redireciona para /login
```

---

## 🎮 Testar Interações

### 1. Login
1. Email: `demo@finix.com`
2. Senha: `Demo@123`
3. Clique "Entrar"
4. ✅ Redireciona para Dashboard

### 2. Saudação
1. Veja "Olá, Usuário Demo! 👋"
2. ✅ Dinâmico com seu nome

### 3. Foto
1. Clique "Perfil" (sidebar)
2. Clique "Selecionar foto"
3. Escolha foto do seu PC
4. Veja preview
5. Clique "Enviar foto"
6. ✅ Foto aparece na sidebar

### 4. IA
1. Volta para Dashboard
2. Clique "Análise com IA"
3. Aguarde (spinning)
4. ✅ Vê insights / análises

### 5. Exportar
1. Clique "PDF"
2. ✅ Arquivo baixa
3. Clique "Excel"
4. ✅ Arquivo baixa

---

## 🎨 Bonus: Modo Escuro

1. Vá para Perfil
2. Clique ícone de lua 🌙
3. ✅ Dashboard fica escuro
4. Clique sol ☀️ para voltar

---

## 📱 Mobile / Responsivo

### Teste em diferentes tamanhos
```bash
# No Chrome/Firefox:
# F12 → Toggle Device Toolbar (Ctrl+Shift+M)

# Teste em:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
```

### Mobile deve ter:
✅ Menu hambúrguer (≡)  
✅ Foto aparece na barra  
✅ Tudo acessível sem scroll excessivo  

---

## 🚀 Próximas Melhorias (Opcional)

```
- [ ] Instalação de pdfkit para PDF real
- [ ] Instalação de xlsx para Excel real
- [ ] Temas personalizáveis
- [ ] Dark mode automático por horário
- [ ] Notificações push
- [ ] Gráficos mais interativos
```

---

## 📞 Resumo Rápido

| Feature | Status | Como Usar |
|---------|--------|-----------|
| Backend | ✅ Port 8000 | `npm run dev` |
| Frontend | ✅ Connected | `npm run dev` |
| Dashboard | ✅ Com saudação | Login → Dashboard |
| Foto | ✅ Preview + Sync | Perfil → Upload |
| Sidebar | ✅ Com foto | Foto salva auto |
| IA | ✅ Claude ready | Botão "IA" |
| Export | ✅ PDF/CSV | Botões export |

---

**Tudo pronto! Happy coding! 🎉**

Qualquer erro, consulte `SETUP_INSTRUCTIONS.md` ou `TESTING_GUIDE.md`.
