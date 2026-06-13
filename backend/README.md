# AP6 Wiki Backend

API backend de uma wiki academica desenvolvida com Java Spring Boot. O projeto permite autenticar usuarios com Google OAuth, criar e editar paginas em Markdown, manter historico de versoes, remover paginas de forma logica e enviar imagens para o Supabase Storage.

## Principais funcionalidades

- Login com Google OAuth via Spring Security.
- Criacao, consulta, edicao e remocao logica de paginas.
- Roles simples `USER` e `ADMIN`.
- Permissoes de delete e restauracao restritas ao autor original ou admin.
- Conteudo das paginas salvo em Markdown no campo `content`.
- Keywords por pagina para melhorar busca e organizacao.
- Historico de alteracoes por versao.
- Upload de imagens para o bucket `wiki-images` no Supabase Storage.
- Banco PostgreSQL hospedado no Supabase.
- Testes locais com H2, sem depender do banco remoto.

## Stack

- Java 26
- Spring Boot 4
- Spring Web MVC
- Spring Security OAuth2 Client
- Spring Data JPA
- PostgreSQL/Supabase
- Supabase Storage
- H2 para testes
- Gradle

## Arquitetura e padroes

O projeto segue uma organizacao em camadas:

- `controller`: recebe requisicoes HTTP.
- `service`: aplica regras de negocio.
- `repository`: acessa o banco de dados.
- `model`: entidades JPA.
- `dto`: objetos de entrada e saida da API.
- `exception`: tratamento centralizado de erros.

Padroes usados:

- DAO: representado pelos repositories do Spring Data JPA.
- Observer: eventos de alteracao de pagina disparam o salvamento de historico.
- Strategy: a geracao de slug usa uma estrategia dedicada.

## Configuracao

Configure as variaveis de ambiente antes de rodar a aplicacao:

```powershell
setx SUPABASE_DATABASE_PASSWORD "senha-do-banco"
setx SUPABASE_SERVICE_ROLE_KEY "service-role-key-do-supabase"
setx GOOGLE_CLIENT_ID "client-id-do-google"
setx GOOGLE_CLIENT_SECRET "client-secret-do-google"
```

Depois de usar `setx`, feche e reabra o terminal.

Variaveis opcionais:

```powershell
setx APP_FRONTEND_URL "http://localhost:5173"
setx SUPABASE_DATABASE_URL "jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
setx SUPABASE_DATABASE_USERNAME "postgres.ekmpdqbrldlfpzgnkndi"
setx SUPABASE_URL "https://ekmpdqbrldlfpzgnkndi.supabase.co"
setx SUPABASE_STORAGE_BUCKET "wiki-images"
setx SESSION_COOKIE_SECURE "false"
setx SPRING_JPA_SHOW_SQL "true"
setx SPRING_JPA_FORMAT_SQL "true"
```

Importante: `SUPABASE_SERVICE_ROLE_KEY` e senhas nunca devem ser colocadas no frontend, no Git ou em arquivos versionados.

## Como rodar

```powershell
cd C:\Users\testp\OneDrive\Documentos\AP6_POA\AP6
.\gradlew.bat bootRun
```

A aplicacao sobe em:

```text
http://localhost:8080
```

Para iniciar o login Google:

```text
http://localhost:8080/oauth2/authorization/google
```

Depois do login Google, o backend redireciona para `APP_FRONTEND_URL`. Em desenvolvimento, o valor padrao e:

```text
http://localhost:5173
```

Em producao, use a URL publica do frontend, por exemplo:

```powershell
setx APP_FRONTEND_URL "https://wiki-bol.testpedrobot.workers.dev"
```

Se o frontend estiver em Cloudflare Pages, configure a publicacao com:

```text
Root directory: frontend
Build command: npm ci && npm run build
Build output directory: dist
```

Se o painel estiver usando Cloudflare Workers com static assets, configure:

```text
Root directory: frontend
Build command: npm ci && npm run build
Deploy command: npx wrangler deploy
```

Use `npx wrangler deploy` no campo `Deploy command`. O comando `npx wrangler versions upload` apenas cria uma versao/preview e nao aplica a versao no trafego de producao.

O arquivo `frontend/wrangler.jsonc` aponta o deploy para `./dist`, cria o binding `ASSETS` e usa `frontend/src/worker.ts` para encaminhar `/api/*`, `/oauth2/*` e `/login/oauth2/*` ao backend no Render.

O frontend tambem precisa de `VITE_API_BASE_URL`. No Cloudflare Workers, use `same-origin` para que o navegador enxergue API e UI no mesmo dominio. O Worker recebe `API_ORIGIN` e encaminha as rotas protegidas ao backend no Render:

```text
VITE_API_BASE_URL=same-origin
API_ORIGIN=https://wiki-bol-api.onrender.com
```

## Deploy no Render Free

O backend pode ser criado no Render a partir do `render.yaml` da raiz do monorepo.

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

Depois que o Render gerar a URL do backend, cadastre no Google OAuth a URL publica do Worker:

```text
https://wiki-bol.testpedrobot.workers.dev/login/oauth2/code/google
```

Mantenha tambem, se quiser depurar diretamente no Render:

```text
https://<render-service>.onrender.com/login/oauth2/code/google
```

Atualize tambem o frontend no Cloudflare:

```text
VITE_API_BASE_URL=same-origin
API_ORIGIN=https://wiki-bol-api.onrender.com
```

## Como testar

```powershell
.\gradlew.bat test
```

Os testes usam H2 em memoria e nao dependem do Supabase.

Para testes manuais no Postman, use o cookie `JSESSIONID` gerado apos login Google. O endpoint `POST /api/auth/logout` invalida essa sessao; portanto, deixe o request de logout desativado enquanto estiver repetindo fluxos autenticados.

## Endpoints principais

### Usuario

```http
GET /api/users/me
POST /api/auth/logout
```

`GET /api/users/me` retorna o usuario autenticado.

`POST /api/auth/logout` encerra a sessao local do backend e limpa o cookie `JSESSIONID`. Ele nao desloga a conta Google globalmente; apenas remove a autenticacao desta aplicacao.

Exemplo de resposta:

```json
{
  "message": "Logout realizado com sucesso."
}
```

`GET /api/users/me` tambem retorna a role do usuario autenticado:

```json
{
  "id": "uuid",
  "name": "Pedro Araujo",
  "email": "testpedrobot@gmail.com",
  "provider": "GOOGLE",
  "role": "ADMIN",
  "avatarUrl": "https://...",
  "createdAt": "2026-06-09T19:08:25"
}
```

Novos usuarios entram como `USER`. Usuarios administradores usam o mesmo login Google, mas sao promovidos manualmente no banco:

```sql
update users
set role = 'ADMIN'
where email = 'testpedrobot@gmail.com';
```

No Postman, envie o cookie da sessao quando quiser encerrar uma sessao especifica:

```http
Cookie: JSESSIONID=valor-do-cookie
```

Chamadas protegidas para `/api/**` sem sessao ativa retornam `401` em JSON, em vez de redirecionar automaticamente para o Google:

```json
{
  "timestamp": "2026-06-11T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "messages": ["Autenticacao obrigatoria."]
}
```

No frontend, o fluxo recomendado e chamar `GET /api/users/me` ao carregar a aplicacao. Se a resposta for `401`, redirecione o usuario para uma tela de login no React. O botao "Entrar com Google" deve navegar para:

```text
http://localhost:8080/oauth2/authorization/google
```

### Paginas

```http
GET /api/pages
GET /api/pages/search?q={termo}&limit={limite}
GET /api/pages/{slug}
POST /api/pages
PUT /api/pages/{id}
DELETE /api/pages/{id}
GET /api/pages/{id}/history
GET /api/pages/{id}/history/{version}
POST /api/pages/{id}/history/{version}/restore
```

Exemplo de criacao de pagina:

```json
{
  "title": "Minha primeira pagina",
  "content": "# Minha primeira pagina\n\nTexto com **negrito**, *italico* e uma imagem:\n\n![Minha imagem](https://exemplo.com/imagem.png)",
  "keywords": ["wiki", "markdown", "primeira pagina"],
  "changeSummary": "Criacao da pagina"
}
```

`keywords` e opcional. Quando enviada, a API normaliza os valores para lowercase, remove espacos nas pontas, remove acentos para comparacao/canonicalizacao, colapsa espacos internos repetidos, ignora valores vazios e remove duplicatas apos normalizacao. Cada pagina aceita ate 20 keywords, com no maximo 50 caracteres cada.

Variacoes digitadas pelo usuario como `manga`, `mangá` e `mangás` sao tratadas como equivalentes para salvar e buscar. A busca por `manga` e `mangá` deve retornar o mesmo conjunto relevante de paginas, inclusive quando dados existentes tiverem keywords com acento. Aliases editoriais iniciais incluem `clubes`/`equipes` -> `time`, `jogos` -> `partida`, `mangaka`/`roteirista`/`ilustrador` -> `autor` e `sagas` -> `arco`.

Exemplo de busca publica:

```http
GET /api/pages/search?q=supabase&limit=20
```

A busca usa um campo unico `q` e procura em titulo, slug, keywords e conteudo da pagina. A comparacao remove acentos de titulo, slug e conteudo; para keywords, compara tambem contra o termo canonicalizado por aliases. Os resultados sao ordenados por relevancia e, em caso de empate, por atualizacao mais recente. O parametro `limit` e opcional, usa `20` por padrao e aceita valores de `1` a `50`. O termo `q` aceita ate `100` caracteres.

O historico so e retornado para paginas ativas. Se a pagina nao existir ou tiver sido removida logicamente, a API retorna `404`.

Permissoes:

- Criar pagina: usuario autenticado.
- Editar pagina ativa: qualquer usuario autenticado, pois a wiki e colaborativa.
- Deletar pagina ativa: apenas autor original da pagina ou `ADMIN`.
- Restaurar versao anterior: apenas autor original da pagina ou `ADMIN`.

Quando um usuario autenticado tenta deletar ou restaurar uma pagina sem permissao, a API retorna:

```json
{
  "timestamp": "2026-06-11T10:00:00",
  "status": 403,
  "error": "Forbidden",
  "messages": ["Voce nao tem permissao para executar esta acao."]
}
```

Para restaurar uma versao anterior, use o endpoint autenticado:

```http
POST /api/pages/{id}/history/{version}/restore
```

A restauracao copia `title`, `content` e `keywords` da versao escolhida para a pagina atual, incrementa `currentVersion` e cria um novo registro no historico. O `slug` nao e alterado, para preservar a URL existente da pagina.

### Upload de imagens

```http
POST /api/uploads/images
Content-Type: multipart/form-data
```

Campos:

```text
file = imagem obrigatoria
alt = texto alternativo opcional
pageId = UUID opcional
```

No Postman, use `Body > form-data` e configure a key `file` como tipo `File`, nao como `Text`. Nao defina manualmente o header `Content-Type`; deixe o Postman gerar `multipart/form-data` com o boundary correto.

Formatos aceitos:

```text
PNG, JPG/JPEG, WEBP e GIF
```

O backend valida tanto o MIME type enviado quanto a assinatura real do arquivo. Arquivos que fingem ser imagem, mas nao possuem bytes validos de PNG, JPG/JPEG, WEBP ou GIF, sao rejeitados.

Limite maximo:

```text
5MB
```

Resposta esperada:

```json
{
  "url": "https://ekmpdqbrldlfpzgnkndi.supabase.co/storage/v1/object/public/wiki-images/pages/{pageId}/{arquivo}.png",
  "markdown": "![Minha imagem](https://...)",
  "path": "pages/{pageId}/{arquivo}.png",
  "contentType": "image/png",
  "size": 123456
}
```

O campo `markdown` pode ser inserido diretamente no `content` da pagina.

## Observacoes para o frontend

Nesta fase, o React deve consumir a API Spring Boot. O frontend nao deve acessar diretamente o Supabase com chaves sensiveis.

Fluxo recomendado para paginas:

1. O usuario escreve ou edita Markdown no React.
2. O React envia `title`, `content`, `keywords` e `changeSummary` para o backend.
3. O backend salva o Markdown no PostgreSQL.
4. O React renderiza o `content` usando uma biblioteca Markdown.

Fluxo recomendado para imagens:

1. O React envia a imagem para `POST /api/uploads/images`.
2. O backend envia o arquivo para o Supabase Storage.
3. O backend retorna a URL publica e o Markdown pronto.
4. O React insere o Markdown no editor da pagina.

## Banco e storage

O banco usa as tabelas:

- `users`
- `pages`
- `page_keywords`
- `page_history`
- `page_history_keywords`

A tabela `users` possui o campo `role`, com valores `USER` ou `ADMIN`.

O Supabase Storage usa o bucket publico:

- `wiki-images`

Como o bucket e publico, qualquer pessoa com a URL consegue visualizar a imagem. Isso e adequado para paginas wiki publicas ou semiabertas.
