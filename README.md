# Finix - Gestão Financeira Pessoal

## Descrição
Aplicativo de gestão financeira pessoal com frontend em React/TypeScript e backend em Node.js/TypeScript com Prisma (SQLite).

## Como Rodar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Passos para Executar

1. **Instalar dependências do backend:**
   ```
   cd backend-ts
   npm install
   ```

2. **Configurar o banco de dados (Prisma):**
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   (O banco é SQLite, criado automaticamente em `backend-ts/dev.db`)

3. **Iniciar o backend:**
   ```
   npm run dev
   ```
   O backend rodará em `http://localhost:8000` e também abrirá o Prisma Studio.
   Se a porta `8000` estiver ocupada no Windows, use:
   ```
   set PORT=8001 && npm run dev
   ```

4. **Instalar dependências do frontend (se necessário):**
   ```
   cd ../frontend
   npm install
   ```

5. **Iniciar o frontend:**
   ```
   npm run dev
   ```
   O frontend rodará em `http://localhost:3000`.

### Acesse o Aplicativo
- Abra `http://localhost:3000` no navegador.
- Faça login com uma das contas abaixo.

## Contas de Teste

### Administrador
- **Email:** admin@finix.com
- **Senha:** Admin@123
- **Permissões:** Acesso total, gerenciamento de usuários.

### Usuário Demo
- **Email:** demo@finix.com
- **Senha:** Demo@123
- **Permissões:** Usuário comum, com dados de exemplo pré-carregados.

## Funcionalidades
- Autenticação JWT
- Dashboard com gráficos e insights
- CRUD de transações, metas e orçamentos
- Exportação de relatórios (Excel/PDF)
- Perfil com upload de foto
- Painel admin para gerenciar usuários

## Notas
- O banco de dados é SQLite (arquivo local), não requer servidor separado.
- Se houver problemas com `npm install` no frontend, tente limpar o cache: `npm cache clean --force` e reinstalar.