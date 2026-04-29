# Plano de Refatoração: Firebase para PostgreSQL (Local/Custom Auth)

## Objetivos
1. Remover completamente o Firebase (Auth e Firestore) do projeto.
2. Implementar Autenticação local (JWT + PostgreSQL) via nossa própria API.
3. Migrar a persistência de dados das estações/projetos (atualmente Firestore) para o PostgreSQL usando Drizzle ORM.
4. Manter o DuckDB exclusivamente para análises no lado do cliente (WASM).

## Fases da Implementação

### Fase 1: Atualização do Schema e Banco de Dados (PostgreSQL)
- [ ] Atualizar `shared/schema.ts` adicionando a tabela de `users` (id, email, password_hash, role, created_at).
- [ ] Garantir que todas as tabelas (users, stations, pollution_records) estejam configuradas para o Drizzle.
- [ ] Instalar dependências necessárias de backend e autenticação (ex: `bcryptjs`, `express-session` ou `jsonwebtoken`). 

### Fase 2: Construção da API de Autenticação e Dados
- [ ] Criar rotas no servidor (Node.js/Express) para autenticação (`/api/auth/...`).
- [ ] Criar middleware para proteger rotas da API.
- [ ] Implementar as rotas de persistência (`/api/stations`, etc.) usando Drizzle ORM.

### Fase 3: Refatoração do Frontend (Remoção do Firebase)
- [ ] Remover importações e configurações do `firebase.ts`.
- [ ] Atualizar o `AuthContext` (ou equivalente) para usar a nova API.
- [ ] Atualizar componentes de Login/Registro e as chamadas de banco de dados (Firestore -> API Fetch).

### Fase 4: Limpeza e Revisão Final
- [ ] Desinstalar dependências do `firebase`.
- [ ] Remover arquivos do Firebase (`.firebaserc`, `firebase.json`, `firestore.*`).
- [ ] Rodar checagens de tipos e lint.
