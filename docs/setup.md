# Setup Local

## 1. Backend

Configure as variaveis de ambiente:

```powershell
setx SUPABASE_DATABASE_PASSWORD "senha-do-banco"
setx SUPABASE_SERVICE_ROLE_KEY "service-role-key-do-supabase"
setx GOOGLE_CLIENT_ID "client-id-do-google"
setx GOOGLE_CLIENT_SECRET "client-secret-do-google"
setx APP_FRONTEND_URL "http://localhost:5173"
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
