# Backlog do Produto Wiki Bol

Backlog das telas e funcionalidades do frontend do monorepo `Wiki-bol`. O backend fica em `backend/`; este arquivo organiza a experiencia do usuario final da wiki.

Plano detalhado das telas de alta prioridade e direcao visual: [`docs/frontend-screen-plan.md`](docs/frontend-screen-plan.md).

## Concluido

- Estrutura inicial do monorepo com `backend/`, `frontend/` e `docs/`.
- Frontend React + Vite + TypeScript criado.
- Shell editorial com navegacao lateral, area de sessao no topo, login Google e logout.
- Listagem e busca de paginas com estados de loading, vazio e erro.
- Leitura de artigo com Markdown, breadcrumbs, tags, acoes contextuais e rodape editorial.
- Criacao e edicao de paginas com preview Markdown, upload de imagem e slug imutavel na edicao.
- Delete com modal customizado e visibilidade restrita a autor original ou `ADMIN`.
- Normalizacao/canonicalizacao de keywords no frontend e backend:
  - busca por `manga` e `mangá` retorna resultados equivalentes;
  - aliases editoriais como `clubes` -> `time` e `jogos` -> `partida` sao considerados na busca;
  - keywords digitadas pelo usuario continuam podendo ter acento na origem, mas a API protege consistencia ao salvar e buscar.
- Testes automatizados de frontend para shell, busca, leitura, criacao, edicao, upload, logout e delete.
- Testes de backend para OAuth redirect, normalizacao de keywords e busca acento-insensivel no endpoint real.

## Alta prioridade atual

- Tela ou painel de historico de versoes:
  - listar versoes;
  - visualizar snapshot de uma versao;
  - restaurar versao quando usuario for autor ou `ADMIN`;
  - destacar que restaurar cria uma nova versao.
- Confirmacoes para acoes destrutivas:
  - modal ou dialogo antes de deletar pagina;
  - explicar que delete e remocao logica;
  - tratar `403` quando usuario nao tem permissao.
- Navegacao por keywords:
  - chips clicaveis em paginas e resultados;
  - filtrar/buscar por keyword selecionada.
- Tratamento centralizado de erros de API:
  - `401`: orientar login;
  - `403`: mostrar falta de permissao;
  - `404`: pagina nao encontrada;
  - `400`: mostrar mensagens retornadas pela API.

## Media prioridade

- Persistencia local de preferencias simples:
  - ultima busca;
  - modo editor/preview;
  - pagina recentemente aberta.

## Baixa prioridade

- Dashboard administrativo simples para `ADMIN`:
  - listar paginas recentes;
  - destacar paginas removidas apenas se o backend futuramente expuser isso;
  - atalhos para moderacao.
- Melhorias de editor Markdown:
  - botoes de negrito, italico, titulo, lista, link e imagem;
  - atalhos de teclado;
  - contador de caracteres.
- Pagina de perfil do usuario:
  - nome, email, avatar e role;
  - informacoes de sessao;
  - acao de logout.
- Tema visual especifico do nicho:
  - identidade visual da Wiki Bol;
  - componentes reutilizaveis;
  - refinamento responsivo.
- Testes automatizados do frontend:
  - testes unitarios de componentes principais;
  - testes de integracao com API mockada;
  - smoke test do fluxo de leitura/busca.
