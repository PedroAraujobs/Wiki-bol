# Setup Local

## 1. Backend

Configure as variaveis de ambiente:

```powershell
setx SUPABASE_DATABASE_PASSWORD "senha-do-banco"
setx SUPABASE_SERVICE_ROLE_KEY "service-role-key-do-supabase"
setx GOOGLE_CLIENT_ID "client-id-do-google"
setx GOOGLE_CLIENT_SECRET "client-secret-do-google"
setx APP_FRONTEND_URL "http://localhost:5173"
setx SESSION_COOKIE_SECURE "false"
```

Feche e reabra o terminal apos usar `setx`.

Suba a API:

```powershell
cd backend
.\gradlew.bat bootRun
```

## 2. Frontend

Crie `frontend/.env` se quiser sobrescrever a URL da API:

```text
VITE_API_BASE_URL=http://localhost:8080
```

Em producao, defina `VITE_API_BASE_URL` com a URL publica real da API. Se o frontend estiver em Cloudflare Pages e o backend em outro host, o frontend precisa apontar para o backend publicado, nao para `localhost`.

Para deploy em Cloudflare Pages:

```text
Root directory: frontend
Build command: npm ci && npm run build
Build output directory: dist
```

Se o projeto estiver configurado no painel como Cloudflare Workers com static assets, use:

```text
Root directory: frontend
Build command: npm ci && npm run build
Deploy command: npx wrangler deploy
```

Use `npx wrangler deploy` no campo `Deploy command`. O comando `npx wrangler versions upload` apenas cria uma versao/preview e nao aplica a versao no trafego de producao.

Nesse fluxo, o arquivo `frontend/wrangler.jsonc` publica `./dist` e usa `not_found_handling: "single-page-application"` para rotas do React. Nao adicione `_redirects` nesse modo, porque o Wrangler valida esse arquivo e pode bloquear o deploy por loop de redirect.

Instale dependencias e suba o Vite:

```powershell
cd frontend
npm install
npm run dev
```

## 3. Login

Abra:

```text
http://localhost:5173
```

Use o botao de login ou acesse diretamente:

```text
http://localhost:8080/oauth2/authorization/google
```

## 4. Backend no Render Free

O backend pode ser criado no Render a partir do `render.yaml` na raiz do repositorio.

Configuracao esperada:

```text
Service name: wiki-bol-api
Runtime: Docker
Root directory: backend
Plan: Free
Health check path: /api/health
```

Variaveis obrigatorias no Render:

```text
APP_FRONTEND_URL=https://wiki-bol.testpedrobot.workers.dev
SESSION_COOKIE_SECURE=true
GOOGLE_CLIENT_ID=client-id-do-google
GOOGLE_CLIENT_SECRET=client-secret-do-google
SUPABASE_DATABASE_PASSWORD=senha-do-banco
SUPABASE_SERVICE_ROLE_KEY=service-role-key-do-supabase
```

Variaveis ja descritas no `render.yaml`, mas que podem ser ajustadas se o Supabase mudar:

```text
SUPABASE_DATABASE_URL=jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_DATABASE_USERNAME=postgres.ekmpdqbrldlfpzgnkndi
SUPABASE_URL=https://ekmpdqbrldlfpzgnkndi.supabase.co
SUPABASE_STORAGE_BUCKET=wiki-images
```

Depois que o Render gerar a URL do backend, cadastre no Google OAuth:

```text
https://<render-service>.onrender.com/login/oauth2/code/google
```

Atualize tambem o frontend no Cloudflare:

```text
VITE_API_BASE_URL=https://<render-service>.onrender.com
```
