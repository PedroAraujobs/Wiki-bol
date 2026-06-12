# Plano de Telas e Direcao Visual do Frontend

Este documento registra a direcao visual da Wiki Bol, o estado das telas principais ja implementadas e os proximos fluxos prioritarios para evoluir a wiki.

## Contexto analisado

- O monorepo `Wiki-bol` ja possui `backend/`, `frontend/` e `docs/`.
- O frontend atual ja possui React + Vite + TypeScript, roteamento, shell persistente, leitura com Markdown, listagem/busca, criacao, edicao, upload de imagem, delete com modal e estado de sessao.
- O backend expoe paginas publicas, historico publico, criacao/edicao autenticadas, delete/restore restritos a autor original ou `ADMIN`, upload de imagens e sessao via cookie `JSESSIONID`.
- O frontend deve usar `credentials: "include"` e iniciar login via `http://localhost:8080/oauth2/authorization/google`.

## Assumptions

- A primeira versao do frontend sera uma aplicacao wiki funcional, nao uma landing page.
- O conteudo sera publico para leitura; criacao, edicao, upload, delete e restore dependem de sessao.
- O tema "mangas de futebol" deve aparecer por taxonomia, microdetalhes visuais, conteudo e nomes de categorias, nao por decoracao pesada.
- O backend continua generico, mas ja aplica normalizacao de keywords e busca acento-insensivel para reduzir categorias soltas por variacao de escrita.
- Como o `AGENTS.md` exige testes antes de mudancas comportamentais, cada tela de alta prioridade deve ter testes focados antes da implementacao. A suite ampla de frontend pode continuar evoluindo depois.

## Direcao visual

### Identidade visual

A interface deve parecer uma wiki editorial moderna: limpa, organizada, densa o bastante para consulta recorrente e calma o suficiente para leitura longa. A estetica deve ficar mais proxima de uma base de conhecimento confiavel do que de um portal promocional.

Nivel de simplicidade recomendado:

- Estrutura clara, com navegacao previsivel e poucos niveis visuais.
- Tipografia legivel, bastante espaco entre blocos de leitura e componentes compactos para metadados.
- Superficies brancas ou quase brancas, bordas discretas e sombras ausentes ou muito leves.
- Hierarquia visual sustentada por tamanho, peso, alinhamento e contraste, nao por cores fortes.

Como transmitir "mangas de futebol" sem carregar o visual:

- Usar categorias como `Manga`, `Personagem`, `Time`, `Partida`, `Autor` e `Arco`.
- Usar tags discretas para keywords e tipos de pagina.
- Permitir imagens reais das paginas/artigos quando houver conteudo, mas sem molduras chamativas.
- Usar uma cor secundaria verde bem controlada para sinalizar campo/futebol e uma cor grafite/preto para remeter a tinta/editorial.

Evitar:

- Visual gamer, neon, cards promocionais, mascotes, fundos ilustrados, bolas/campos como padrao decorativo.
- Gradientes dominantes, sombras fortes, roxos/azuis saturados como tema principal.
- Layout de landing page com hero grande.
- Excesso de icones ou elementos de anime/futebol em areas de leitura.

### Paleta de cores

Tema claro recomendado:

| Uso | Cor | HEX |
| --- | --- | --- |
| Fundo da aplicacao | Cinza frio quase branco | `#F7F8FA` |
| Superficie principal | Branco editorial | `#FFFFFF` |
| Superficie secundaria | Cinza claro | `#F1F3F6` |
| Texto principal | Grafite | `#20242C` |
| Texto secundario | Cinza azulado | `#5E6878` |
| Texto discreto | Cinza medio | `#7A8494` |
| Bordas | Cinza frio | `#D8DEE8` |
| Borda forte/foco | Azul acinzentado | `#58708F` |
| Acao primaria | Azul editorial | `#245C9E` |
| Acao primaria hover | Azul profundo | `#1D4C83` |
| Acento futebol | Verde campo contido | `#3F7D4E` |
| Acento manga/editorial | Tinta suave | `#30323A` |
| Aviso | Ambar contido | `#9A6A1E` |
| Erro | Vermelho contido | `#B42318` |

Tema escuro opcional, nao necessario para a primeira entrega:

| Uso | Cor | HEX |
| --- | --- | --- |
| Fundo | `#111318` |
| Superficie | `#181B22` |
| Superficie secundaria | `#20242C` |
| Texto principal | `#EEF1F5` |
| Texto secundario | `#B8C0CC` |
| Bordas | `#333A46` |
| Acao primaria | `#7BA7D9` |
| Acento futebol | `#80B58B` |

Recomendacao: implementar primeiro apenas o modo claro. O modo escuro pode entrar depois se houver tempo para revisar contraste e leitura de Markdown.

### Tipografia

Fontes recomendadas:

- Interface, menus e metadados: `Inter`, `system-ui`, `Segoe UI`, `Arial`, sans-serif.
- Leitura longa: manter a mesma familia para consistencia, com largura de linha controlada.
- Codigo/trechos tecnicos em Markdown: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace.

Hierarquia sugerida:

| Elemento | Tamanho | Peso | Linha |
| --- | ---: | ---: | ---: |
| Titulo de artigo | 36px desktop / 30px mobile | 700 | 1.15 |
| Titulo de tela | 28px | 700 | 1.2 |
| Secao de artigo `h2` | 24px | 650 | 1.25 |
| Secao de artigo `h3` | 20px | 650 | 1.3 |
| Corpo de artigo | 16px a 17px | 400 | 1.7 |
| UI principal | 14px a 15px | 400/600 | 1.45 |
| Metadados/tags | 12px a 13px | 500/600 | 1.35 |

Regras:

- Largura ideal de leitura: 68 a 76 caracteres por linha.
- Nao usar letter spacing negativo.
- Usar caixa alta apenas em labels curtos, com tamanho pequeno e contraste moderado.
- Evitar titulos gigantes em paineis compactos.

## Arquitetura de telas

### 1. Tela base da aplicacao

Status: implementada.

Objetivo:

Fornecer a estrutura persistente da wiki: cabecalho, navegacao, busca global, estado de sessao e area de conteudo.

Usuarios e estados:

- Visitante: pode ler, buscar e iniciar login.
- `USER`: pode criar, editar e fazer upload.
- `ADMIN`: pode fazer tudo que `USER` faz e tambem ver acoes administrativas expostas pelo backend atual, como delete/restore quando aplicavel.

Layout atual/recomendado:

- Desktop: coluna lateral de navegacao com largura entre 260px e 300px + area principal fluida + sessao do usuario no canto superior direito da area principal.
- Mobile: cabecalho fixo no topo, busca acessivel, navegacao em menu recolhivel ou lista abaixo do topo.
- A estrutura nao deve parecer dashboard corporativo; deve parecer wiki navegavel.

Componentes:

- Logo textual `Wiki Bol`, sem simbolo pesado.
- Busca global.
- Links: `Inicio`, `Todas as paginas`, `Criar pagina`, `Categorias`.
- Bloco de sessao: visitante, nome do usuario, role e acao de login/logout quando disponivel.
- Barra de status discreta para loading e erro global.

Comportamento:

- Ao carregar, chamar `GET /api/users/me` e `GET /api/pages`.
- `401` em `/me` define usuario como visitante, sem quebrar a tela.
- Acoes de criacao/edicao/upload ficam ocultas ou desabilitadas para visitante.
- A seguranca continua no backend; o frontend so melhora a experiencia.

Plano de testes antes da implementacao:

- Renderiza estado visitante quando `/api/users/me` retorna `401`.
- Renderiza usuario e role quando `/api/users/me` retorna `USER` ou `ADMIN`.
- Botao "Entrar com Google" navega para `/oauth2/authorization/google`.
- Links principais aparecem em desktop e mobile.
- Erro na lista de paginas nao impede a area de sessao de renderizar.

Riscos:

- Sem roteamento, a aplicacao tende a virar um componente unico dificil de manter. A primeira implementacao real deve introduzir separacao por componentes e, se necessario, roteamento simples.

### 2. Tela de listagem e busca de paginas

Status: implementada; proximo incremento e transformar keywords em filtros clicaveis.

Objetivo:

Permitir que o usuario encontre paginas por titulo, slug, keyword ou conteudo, usando o contrato publico do backend.

Layout recomendado:

- Campo de busca no topo da area principal ou logo abaixo do cabecalho.
- Lista em linhas densas, nao cards grandes.
- Cada resultado deve mostrar titulo, resumo curto quando houver, keywords, autor, versao e data de atualizacao.
- Filtros por tipo de conteudo podem ser preparados visualmente, mas sem prometer backend inexistente.

Estados:

- Inicial: lista recente de paginas.
- Loading: skeleton ou linha de progresso discreta.
- Vazio: mensagem curta e acao para criar pagina se autenticado.
- Erro: mensagem com tentativa de recarregar.
- Busca sem termo: volta para `GET /api/pages`.

Componentes:

- `SearchInput`.
- `PageResultList`.
- `PageResultItem`.
- `KeywordChip`.
- `EmptyState`.
- `InlineError`.

Contrato:

- `GET /api/pages`.
- `GET /api/pages/search?q={termo}&limit=20`.
- Usar `PageSummary`: `id`, `title`, `slug`, `keywords`, `currentVersion`, `authorName`, `updatedAt`.
- A busca do backend normaliza acentos e aliases de keywords. Buscar `manga` ou `mangá` deve retornar resultados equivalentes, incluindo keywords digitadas pelo usuario com acento.

Plano de testes antes da implementacao:

- Busca vazia chama listagem.
- Busca com termo chama endpoint de search com `limit=20`.
- Exibe resultados com titulo, keywords, autor e data formatada.
- Mostra estado vazio quando o array vem vazio.
- Mostra erro quando a API falha.

Decisao tecnica:

- Manter a busca simples por campo unico. A proxima evolucao de navegacao deve fazer os chips de keyword acionarem uma busca filtrada pelo termo canonicalizado.

### 3. Tela de leitura de pagina

Status: implementada.

Objetivo:

Oferecer leitura confortavel de artigos em Markdown com metadados e acoes contextuais.

Layout atual/recomendado:

- Conteudo central com largura maxima de leitura.
- Breadcrumb acima do titulo, seguido de titulo, tags e acoes principais.
- Metadados editoriais ficam no rodape do artigo, nao no header: autor original, ultima atualizacao, ultima pessoa a editar quando disponivel, resumo da ultima alteracao, versao atual e slug permanente.
- Imagem principal so deve aparecer quando o artigo tiver imagem ou metadado futuro; nao criar placeholder decorativo.

Organizacao por tipo de pagina:

- Manga: titulo, autor, periodo/publicacao, times/personagens relacionados, arcos.
- Personagem: manga, time, posicao, tecnicas, aparicoes, relacoes.
- Time: manga, jogadores, partidas relevantes, arcos.
- Partida: times, placar/contexto, arco, capitulos/episodios.
- Autor: obras, periodo, notas editoriais.
- Arco: manga, capitulos, personagens, partidas e resumo.

Como fazer isso sem backend especifico agora:

- Usar keywords e convencoes de conteudo inicialmente.
- Planejar tipos visuais no frontend, mas nao bloquear a leitura quando a pagina for generica.
- Evitar campos falsos que nao existem na API.

Componentes:

- `ArticleHeader`.
- `ArticleMetadata`.
- `MarkdownContent`.
- `ArticleActions`.
- `KeywordChip`.
- `RelatedLinks` futuro.

Acoes:

- Visitante: ler, buscar, abrir login.
- Usuario autenticado: editar.
- Autor ou admin: deletar.
- Historico: aparece como acao futura/desabilitada; a tela completa e a proxima prioridade funcional.

Plano de testes antes da implementacao:

- Renderiza Markdown basico: titulo, paragrafo, lista, link e imagem.
- Mostra metadados de versao, autor e data.
- Visitante nao ve acoes autenticadas.
- Usuario autenticado ve editar.
- Autor ou admin ve delete; usuario comum nao autor nao ve delete.
- Erro `404` mostra pagina nao encontrada.

Decisao tecnica:

- A leitura usa `react-markdown` com `remark-gfm`. O rodape editorial substitui infobox tecnica lateral para manter leitura limpa.

### 4. Tela/formulario de criacao de pagina

Status: implementada.

Objetivo:

Permitir criar artigos com Markdown, keywords e resumo de alteracao.

Layout recomendado:

- Formulario dividido em coluna principal de editor e painel lateral de metadados.
- Desktop: editor e preview lado a lado ou alternavel por tabs.
- Mobile: tabs `Editar` e `Preview`, nunca duas colunas apertadas.
- O campo `changeSummary` nao aparece na criacao. A primeira versao envia resumo padrao `Criacao da pagina`.

Campos:

- `title`: obrigatorio, claro e curto.
- `content`: obrigatorio, Markdown.
- `keywords`: entrada por chips ou campo separado por virgula.
- `changeSummary`: preenchido automaticamente na criacao.

Estados:

- Visitante: tela bloqueada com convite para login.
- Autenticado: formulario editavel.
- Enviando: botao bloqueado, feedback discreto.
- Sucesso: redirecionar para a pagina criada.
- Erro `400`: mostrar mensagens da API junto aos campos quando possivel.
- Erro `401`: orientar login novamente.

Contrato:

- `POST /api/pages`.
- Body: `title`, `content`, `keywords`, `changeSummary`.

Plano de testes antes da implementacao:

- Visitante nao acessa formulario editavel.
- Validacao local impede envio sem titulo/conteudo.
- Keywords sao normalizadas visualmente antes do envio, sem duplicatas obvias.
- Envio bem-sucedido chama `POST /api/pages` e abre a pagina criada.
- Erros `400` e `401` aparecem de forma compreensivel.

Trade-off:

- Editor Markdown simples primeiro. Toolbar avancada fica para depois, exceto botao de imagem se o fluxo de upload entrar junto.

### 5. Tela/formulario de edicao de pagina

Status: implementada.

Objetivo:

Editar uma pagina existente preservando o slug e criando nova versao no historico.

Layout recomendado:

- Reutilizar a estrutura de criacao.
- Header deve mostrar que o slug e permanente.
- Mostrar versao atual e ultima atualizacao.
- Mostrar link para voltar ao artigo sem perder contexto.

Campos:

- `title`, `content`, `keywords`, `changeSummary`.
- `changeSummary` deve ser mais destacado que na criacao, porque edicoes colaborativas precisam de rastreabilidade.

Estados:

- Loading da pagina existente.
- Visitante: bloqueado para login.
- Usuario autenticado: pode editar qualquer pagina ativa.
- Sucesso: retornar para leitura da pagina.
- `404`: pagina inexistente/removida.
- `401`: sessao expirada.

Contrato:

- `GET /api/pages/{slug}` para carregar.
- `PUT /api/pages/{id}` para salvar.

Plano de testes antes da implementacao:

- Carrega dados existentes no formulario.
- Salvar envia `PUT` com o `id`, nao com o slug.
- Slug e exibido como permanente e nao editavel.
- Usuario autenticado comum consegue ver botao de editar.
- Erros `404`, `401` e `400` sao tratados.

Risco:

- Edicao concorrente ainda nao tem controle otimista no backend. A UI deve pelo menos mostrar versao atual para reduzir surpresa.

### 6. Fluxo de upload de imagens no editor

Status: implementado.

Objetivo:

Permitir que o usuario autenticado envie imagem pelo backend e insira o Markdown retornado no conteudo.

Onde vive:

- Dentro dos formularios de criacao e edicao.
- Pode aparecer como botao discreto no editor, nao como tela independente.

Layout recomendado:

- Botao com icone de imagem e label curto.
- Input de arquivo oculto acionado pelo botao.
- Campo opcional de texto alternativo antes do envio ou prompt simples no proprio painel.
- Feedback inline: enviando, sucesso, erro.

Contrato:

- `POST /api/uploads/images`.
- `multipart/form-data` com `file`, `pageId` opcional e `alt` opcional.
- Inserir `response.markdown` no ponto atual do editor ou no fim do conteudo se nao houver cursor.

Estados:

- Visitante: acao indisponivel com orientacao para login.
- Arquivo invalido: mostrar formatos aceitos.
- Arquivo grande: explicar limite de 5MB.
- Sessao expirada: orientar login.
- Sucesso: inserir Markdown e manter foco no editor.

Plano de testes antes da implementacao:

- Botao de upload nao aparece para visitante.
- Selecionar arquivo chama endpoint com `FormData`.
- Sucesso insere o Markdown retornado no conteudo.
- Erro `400` mostra mensagem da API.
- Erro `401` orienta login.

Trade-off:

- A primeira versao nao precisa de galeria, recorte ou gerenciamento de arquivos. O backend ja retorna URL publica e Markdown pronto.

## Componentes visuais padrao

Cards:

- Usar apenas para itens repetidos, empty states, dialogos e paineis realmente delimitados.
- Raio maximo de 8px.
- Preferir borda sobre sombra.

Tabelas:

- Cabecalho com fundo `#F1F3F6`.
- Linhas com borda inferior discreta.
- Usar para historico e listas estruturadas futuras, nao para artigos longos.

Tags/chips:

- Fundo `#EEF1F5`, texto `#3E4858`, borda opcional `#D8DEE8`.
- Tags de categoria podem usar verde muito suave: fundo `#EAF4ED`, texto `#2F6B3F`.

Breadcrumbs:

- Pequenos, acima do titulo.
- Separador simples `/`.
- Evitar icones quando texto resolver.

Busca:

- Campo claro, com botao ou icone de lupa.
- O estado de foco deve ter borda visivel e contraste adequado.

Infobox:

- Usar como painel lateral informativo, nao como card promocional.
- Labels curtos, valores objetivos.
- No mobile, vira bloco abaixo do header do artigo.

Icones:

- Usar apenas para acoes reconheciveis: buscar, editar, imagem, voltar, deletar, salvar.
- Sempre com label visivel ou tooltip quando o significado nao for obvio.

## Navegacao e crescimento da wiki

Recomendacoes:

- Comecar com busca global e lista recente.
- Transformar keywords em chips clicaveis no proximo ciclo de navegacao.
- Manter categorias/tipos de pagina como convencao editorial ate existir suporte de dados mais forte.
- Cada artigo deve sugerir caminhos: keywords, paginas relacionadas futuras e historico.
- Evitar menus profundos. Wikis crescem melhor com busca, categorias claras e links internos consistentes.

Estrutura inicial sugerida:

```text
Inicio
Todas as paginas
Categorias
  Mangas
  Personagens
  Times
  Partidas
  Autores
  Arcos
Criar pagina
```

## Acessibilidade e legibilidade

Contraste:

- Texto normal: minimo WCAG AA 4.5:1.
- Texto grande: minimo 3:1.
- Estados de foco devem ser visiveis sem depender apenas de cor.

Leitura longa:

- Largura maxima de artigo entre 720px e 820px.
- Linha de corpo entre 1.65 e 1.75.
- Espaco claro entre secoes.
- Imagens responsivas com legenda quando o Markdown oferecer.

Mobile:

- Alvos de toque com pelo menos 40px de altura.
- Navegacao recolhivel.
- Editor com tabs, nao colunas.
- Tabelas com overflow horizontal controlado.

Modo escuro:

- Nao implementar automaticamente sem revisao de contraste.
- Se entrar depois, criar tokens de tema e testar Markdown, tags, tabelas e estados de erro.

## Sequencia recomendada de implementacao

Sequencia inicial concluida:

- Base de componentes, tratamento de API e testes minimos do frontend.
- Shell da aplicacao e sessao.
- Listagem e busca.
- Leitura com Markdown.
- Criacao.
- Edicao.
- Upload de imagens.
- Logout, delete com modal, rodape editorial e normalizacao de keywords.

Proximos ciclos recomendados:

1. Implementar tela/painel de historico de versoes, incluindo restore para autor ou `ADMIN`.
2. Transformar chips de keyword em navegacao/filtro.
3. Melhorar editor Markdown com toolbar simples e insercao no cursor.
4. Persistir preferencias leves como ultima busca e modo editor/preview.

Essa ordem reduz risco porque primeiro estabiliza navegacao, sessao e contrato publico antes de entrar nos formularios autenticados.

## Criterios de pronto para as telas de alta prioridade

- Cada tela possui teste focado criado antes da implementacao.
- Estados de loading, vazio, erro e permissao foram cobertos.
- O build do frontend passa.
- O fluxo manual contra backend local foi validado quando depender de sessao.
- A interface segue a paleta e hierarquia deste documento.
- Nenhuma chave sensivel e exposta ao frontend.

## Exemplo de pagina tipica

```text
Wiki Bol / Ao Ashi

Ao Ashi

[manga] [futebol escolar] [j-league] [estrategia]

Ao Ashi acompanha Ashito Aoi, um atacante de Ehime que entra em contato
com um treinador ligado a uma academia de base em Toquio.

Conteudo
## Sinopse
...

## Personagens principais
...

## Times relacionados
...

Acoes
Editar pagina
Historico em breve
Deletar pagina (apenas autor/admin)

Informacoes editoriais
Autor original: Pedro Araujo
Ultima atualizacao: 11/06/2026 18:30
Ultima edicao: Editor Final
Resumo da ultima alteracao: Ajuste editorial
Versao atual: v4
Slug permanente: ao-ashi
```
