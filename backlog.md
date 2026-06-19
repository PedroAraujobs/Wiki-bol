# Backlog do Produto Wiki Bol

Backlog das telas e funcionalidades do frontend do monorepo `Wiki-bol`. O backend fica em `backend/`; este arquivo organiza a experiencia do usuario final da wiki.

Plano detalhado das telas de alta prioridade e direcao visual: [`docs/frontend-screen-plan.md`](docs/frontend-screen-plan.md).

## Concluido

- Estrutura inicial do monorepo com `backend/`, `frontend/` e `docs/`.
- Frontend React + Vite + TypeScript criado.
- Shell editorial com navegacao lateral, area de sessao no topo, login Google e logout.
- Secao `Visto recentemente` na sidebar, persistida localmente e separada entre visitante e usuario autenticado.
- Listagem e busca de paginas com estados de loading, vazio e erro.
- Catalogo responsivo com cards ilustrados no desktop, lista compacta no mobile e capas derivadas do Markdown.
- Leitura de artigo com Markdown, breadcrumbs, tags, acoes contextuais e rodape editorial.
- Criacao e edicao de paginas com preview Markdown, upload de imagem e slug imutavel na edicao.
- Editor Markdown com toolbar assistida, insercao no cursor e abas editor/preview em mobile.
- Delete com modal customizado e visibilidade restrita a autor original ou `ADMIN`.
- Normalizacao/canonicalizacao de keywords no frontend e backend:
  - busca por `manga` e `mangá` retorna resultados equivalentes;
  - aliases editoriais como `clubes` -> `time` e `jogos` -> `partida` sao considerados na busca;
  - keywords digitadas pelo usuario continuam podendo ter acento na origem, mas a API protege consistencia ao salvar e buscar.
- Navegacao por keywords:
  - chips clicaveis em paginas, resultados e historico;
  - filtro por keyword usando a busca publica existente.
- Testes automatizados de frontend para shell, busca, leitura, criacao, edicao, upload, logout e delete.
- Testes de backend para OAuth redirect, normalizacao de keywords e busca acento-insensivel no endpoint real.
- Tratamento centralizado de erros da API, preservando mensagens de `400`, `401`, `403` e `404`.
- Tela ou painel de historico de versoes:
  - listar versoes;
  - visualizar snapshot de uma versao;
  - restaurar versao quando usuario for autor ou `ADMIN`;
  - destacar que restaurar cria uma nova versao.

## Alta prioridade atual

Nenhum item pendente no momento.

## Media prioridade

- Persistencia local de preferencias simples:
  - ultima busca;
  - modo editor/preview;

## Baixa prioridade

- Dashboard administrativo simples para `ADMIN`:
  - listar paginas recentes;
  - destacar paginas removidas apenas se o backend futuramente expuser isso;
  - atalhos para moderacao.
- Editor estruturado proprio como alternativa futura:
  - usuario edita texto/blocos e o frontend converte para Markdown ao salvar;
  - exigiria modelo de blocos, parser Markdown de ida/volta ou compatibilidade com paginas antigas;
  - avaliar biblioteca dedicada antes de tentar uma implementacao propria.
- Pagina de perfil do usuario:
  - nome, email, avatar e role;
  - informacoes de sessao;
  - acao de logout.
