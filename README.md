# Wiki Bol

Monorepo do prototipo completo da Wiki Bol.

Este repositorio combina:

- `backend/`: API Spring Boot para wiki colaborativa, baseada no projeto reutilizavel [Wiki-backend](https://github.com/PedroAraujobs/Wiki-backend).
- `frontend/`: aplicacao React + Vite + TypeScript voltada para a experiencia especifica da Wiki Bol.
- `docs/`: contrato de API e instrucoes de setup do projeto completo.

## Estrutura

```text
Wiki-bol/
  backend/
  frontend/
  docs/
```

O backend deste monorepo e uma copia inicial do backend generico. Melhorias que forem genericamente uteis podem ser replicadas manualmente para `Wiki-backend`.

## Requisitos

- Java 26
- Node.js 20 ou superior
- Variaveis de ambiente do backend configuradas
- Projeto Supabase configurado
- OAuth Google configurado

## Backend

```powershell
cd backend
.\gradlew.bat bootRun
```

O backend sobe em:

```text
http://localhost:8080
```

Testes:

```powershell
cd backend
.\gradlew.bat test
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

O frontend sobe em:

```text
http://localhost:5173
```

Build:

```powershell
cd frontend
npm run build
```

## Autenticacao

O frontend deve chamar a API com cookies:

```ts
fetch("http://localhost:8080/api/users/me", {
  credentials: "include",
});
```

Para iniciar login Google:

```text
http://localhost:8080/oauth2/authorization/google
```

Depois do login, o backend redireciona para `APP_FRONTEND_URL`. Em desenvolvimento, use:

```powershell
setx APP_FRONTEND_URL "http://localhost:5173"
```

## Seguranca

Nao versionar senhas, tokens, service role key do Supabase ou secrets do Google. O frontend nunca deve receber `SUPABASE_SERVICE_ROLE_KEY`.
