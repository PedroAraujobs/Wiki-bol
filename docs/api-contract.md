# Contrato de API

Base local:

```text
http://localhost:8080
```

## Autenticacao

```http
GET /api/users/me
POST /api/auth/logout
```

`GET /api/users/me` retorna `401` quando nao ha sessao ativa.

Resposta autenticada:

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

## Paginas

Publicos:

```http
GET /api/pages
GET /api/pages/search?q={termo}&limit={limite}
GET /api/pages/{slug}
GET /api/pages/{id}/history
GET /api/pages/{id}/history/{version}
```

Autenticados:

```http
POST /api/pages
PUT /api/pages/{id}
DELETE /api/pages/{id}
POST /api/pages/{id}/history/{version}/restore
```

Permissoes:

- Criar: usuario autenticado.
- Editar: qualquer usuario autenticado.
- Deletar: autor original ou `ADMIN`.
- Restaurar: autor original ou `ADMIN`.

Body de criacao/edicao:

```json
{
  "title": "Minha pagina",
  "content": "# Conteudo em Markdown",
  "keywords": ["wiki", "bol"],
  "changeSummary": "Resumo da alteracao"
}
```

Keywords:

- `keywords` e opcional.
- A API remove espacos nas pontas, converte para lowercase, remove acentos para comparacao/canonicalizacao, colapsa espacos internos repetidos, ignora valores vazios e remove duplicatas apos normalizacao.
- Cada pagina aceita ate 20 keywords, com no maximo 50 caracteres cada.
- Variacoes digitadas pelo usuario como `manga`, `mangá` e `mangás` sao tratadas como equivalentes para salvar e buscar.
- A busca por `manga` e `mangá` deve retornar o mesmo conjunto relevante de paginas, inclusive quando os dados existentes tiverem keywords com acento.
- Aliases editoriais iniciais incluem `clubes`/`equipes` -> `time`, `jogos` -> `partida`, `mangaka`/`roteirista`/`ilustrador` -> `autor` e `sagas` -> `arco`.

## Upload de imagens

```http
POST /api/uploads/images
Content-Type: multipart/form-data
```

Campos:

```text
file = imagem obrigatoria
pageId = UUID opcional
alt = texto alternativo opcional
```

Resposta:

```json
{
  "url": "https://...",
  "markdown": "![Imagem](https://...)",
  "path": "pages/{pageId}/{arquivo}.png",
  "contentType": "image/png",
  "size": 123456
}
```
