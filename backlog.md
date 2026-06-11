# Backlog do Produto Wiki Bol

Backlog das telas e funcionalidades do frontend do monorepo `Wiki-bol`. O backend fica em `backend/`; este arquivo organiza a experiencia do usuario final da wiki.

## Concluido

- Estrutura inicial do monorepo com `backend/`, `frontend/` e `docs/`.
- Frontend React + Vite + TypeScript criado.
- Tela inicial tecnica consumindo API para listar, buscar e carregar paginas.
- Integracao inicial com login Google via redirecionamento para o backend.

## Alta prioridade

- Tela base da aplicacao autenticada e publica:
  - layout principal com navegacao lateral ou superior;
  - area de status de login;
  - acao "Entrar com Google";
  - tratamento visual para usuario visitante, `USER` e `ADMIN`.
- Tela de listagem e busca de paginas:
  - busca por campo unico;
  - listagem de resultados;
  - estados de carregamento, vazio e erro;
  - exibicao de titulo, keywords, autor e ultima atualizacao.
- Tela de leitura de pagina:
  - renderizacao de Markdown;
  - exibicao de titulo, keywords, autor, versao e data de atualizacao;
  - acoes contextuais para editar, ver historico e deletar conforme permissao.
- Tela/formulario de criacao de pagina:
  - campos `title`, `content`, `keywords` e `changeSummary`;
  - editor Markdown;
  - preview do Markdown;
  - validacoes basicas antes de enviar.
- Tela/formulario de edicao de pagina:
  - carregar pagina existente;
  - editar `title`, `content`, `keywords` e `changeSummary`;
  - preservar slug imutavel;
  - mostrar feedback de sucesso/erro.
- Fluxo de upload de imagens no editor:
  - selecionar arquivo;
  - enviar para `POST /api/uploads/images`;
  - inserir o Markdown retornado no conteudo;
  - tratar erros de formato, tamanho e sessao.

## Media prioridade

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
