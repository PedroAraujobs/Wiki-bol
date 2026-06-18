# Identidade Visual da Wiki-bol

## 1. Diagnostico do estado atual

### Pontos preservados

- Arquitetura de wiki com navegacao lateral, busca visivel e area de leitura separada.
- Uso contido de bordas, raios de ate 8px e ausencia de sombras decorativas.
- Conteudo de artigo com largura controlada e metadados editoriais no rodape.
- Componentes reutilizados entre criacao, edicao, historico e estados de erro.

### Problemas corrigidos

- A marca era apenas texto e nao utilizava os assets oficiais.
- Cores estavam repetidas diretamente no CSS, sem semantica ou tema escuro completo.
- A area principal ficava excessivamente larga em monitores grandes.
- Resultados pareciam cards isolados e repetitivos, reduzindo a densidade editorial.
- A navegacao mobile era apenas empilhada, sem drawer ou cabecalho compacto.
- `Inter` era declarada, mas nao era distribuida com a aplicacao.

## 2. Conceito visual recomendado

**Editorial esportivo contemporaneo** combina uma base neutra de conhecimento com a energia concentrada da logo. A proporcao de uso e aproximadamente 70% neutros, 20% azul-marinho e textos estruturais, e 10% cores interativas ou semanticas.

A interface nao replica a inclinacao, os raios ou o movimento da logo. A expressividade aparece na marca, nos estados ativos e em pequenos detalhes azuis. Leitura, comparacao e manutencao do conteudo permanecem prioritarias.

## 3. Fundamentacao em teoria das cores

- **Matiz:** azuis frios comunicam confianca e conectam a interface a marca.
- **Saturacao:** o azul vivo fica restrito a acoes, links, foco e selecao.
- **Luminosidade:** fundos claros e escuros usam diferencas de luminosidade para separar planos sem sombras.
- **Temperatura:** neutros frios sustentam a harmonia monocromatica sem tornar a pagina inteiramente azul.
- **Peso visual:** azul-marinho ancora marca e navegacao; azul vivo chama para a acao; semanticas aparecem apenas quando necessarias.
- **Contraste:** pares principais atendem WCAG AA; texto comum mantem pelo menos 4.5:1.

## 4. Paleta final e funcao

| Token | Claro | Escuro | Funcao |
| --- | --- | --- | --- |
| `page-bg` | `#F6F8FB` | `#10141C` | Fundo geral |
| `surface` | `#FFFFFF` | `#171E29` | Sidebar, paineis e campos |
| `surface-subtle` | `#EEF2F6` | `#202938` | Hover, codigo e agrupamentos |
| `text-primary` | `#172033` | `#E8EDF5` | Titulos e corpo |
| `text-secondary` | `#667085` | `#AAB4C3` | Metadados e apoio |
| `border` | `#DCE3EC` | `#344052` | Divisores e campos |
| `brand` | `#08275F` | `#B9DEFA` | Marca textual e navegacao ativa |
| `interactive` | `#126FD1` | `#4EA6E6` | Acoes primarias e foco |
| `success` | `#287A52` | `#55B884` | Sucesso e versao atual |
| `warning` | `#A66512` | `#E0A44C` | Avisos |
| `danger` | `#B63A3A` | `#E57373` | Erros e acoes destrutivas |

## 5. Escalas tonais

### Azul

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#F0F7FF` | `#DDEEFF` | `#B9DEFA` | `#8BC7F2` | `#4EA6E6` | `#1F86DB` | `#126FD1` | `#0E58A8` | `#0B417D` | `#08275F` |

### Neutros

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#F8FAFC` | `#F1F4F8` | `#E4E9F0` | `#D1D8E2` | `#98A2B3` | `#667085` | `#475467` | `#344054` | `#1F2937` | `#172033` |

## 6. Tokens dos modos claro e escuro

Os componentes usam tokens semanticos, nunca valores cromaticos arbitrarios. A preferencia aceita `system`, `light` e `dark`, fica salva em `wiki-bol-theme` e e aplicada em `data-theme` no elemento `html`.

| Estado | Claro | Escuro |
| --- | --- | --- |
| Hover primario | `#0E58A8` | `#75BDF0` |
| Pressionado | `#0B417D` | `#8BC7F2` |
| Selecao | `#DDEEFF` / `#08275F` | `#234E75` / `#F4F8FD` |
| Foco | `#4EA6E6` | `#8BC7F2` |
| Desabilitado | `#EEF2F6` / `#8A95A5` | `#252E3B` / `#7F8A9A` |
| Sucesso suave | `#E7F5ED` | `#173B2C` |
| Aviso suave | `#FFF4DF` | `#483618` |
| Erro suave | `#FFF0EF` | `#4A2428` |

## 7. Combinacoes permitidas e proibidas

Permitidas:

- `#172033` sobre `#F6F8FB` ou `#FFFFFF`.
- Branco sobre `#126FD1` em botoes primarios.
- `#AAB4C3` ou `#E8EDF5` sobre superficies escuras.
- Azul interativo acompanhado de sublinhado, foco, borda ou icone conforme o estado.

Proibidas:

- Azul-claro como texto comum sobre branco.
- Cinza discreto em informacao necessaria para concluir uma tarefa.
- Verde usado apenas para decorar referencias a futebol.
- Grandes superficies em azul saturado.
- Estado comunicado somente por cor.

## 8. Tipografia e hierarquia

Familia principal: `Inter Variable`, distribuida junto ao frontend. Fallback: `Inter`, `system-ui`, `Segoe UI`, sans-serif. Codigo e diff usam `ui-monospace`, `SFMono-Regular`, `Consolas`.

| Elemento | Desktop | Mobile | Peso | Linha |
| --- | --- | --- | --- | --- |
| Titulo de tela/artigo | 32px | 28px | 740 | 1.18 |
| Secao de artigo | 23px | 22px | 700 | 1.28 |
| Subsecao | 19px | 18px | 650 | 1.3 |
| Corpo de artigo | 16.5px | 16px | 400 | 1.72 |
| Interface | 14–15px | 14px | 400/650 | 1.45 |
| Metadados/tags | 12–13px | 12–13px | 500/650 | 1.35 |

Artigos ficam limitados a 820px, equivalentes a aproximadamente 68–76 caracteres por linha.

## 9. Aplicacao da logo e do favicon

- Grafia oficial textual: **Wiki-bol**.
- Desktop: logo horizontal de aproximadamente 184px na sidebar.
- Area de protecao: minimo de 12px ao redor da arte.
- Mobile: simbolo isolado de 38px na barra superior.
- Tema escuro: logo horizontal permanece transparente e sem contêiner; nao aplicar filtros ou recoloracao.
- Favicon: versoes transparentes em 32px e 64px; `apple-touch-icon` em 180px.
- Os arquivos finais removem apenas o fundo conectado as bordas e preservam o branco interno.

## 10. Estrutura de layout

- Desktop: sidebar sticky de 248px com navegacao e ate cinco paginas vistas recentemente, barra de sessao e conteudo central de ate 1180px.
- Artigo: breadcrumb, titulo, tags, acoes, corpo de ate 820px e informacoes editoriais ao final.
- Catalogo: cabecalho, busca compacta e lista editorial unica com divisores.
- Manga, personagem, time, partida, autor e arco continuam usando Markdown e keywords. Infoboxes futuras devem ser paineis informativos, nao cards promocionais.
- Historico: lista de versoes lateral e comparacao principal; em telas estreitas, fluxo unico.
- Editor: formulario principal, metadados laterais e preview; no mobile, tabs Editor/Preview.

## 11. Especificacao dos componentes

| Componente | Aparencia e estados |
| --- | --- |
| Sidebar | Superficie neutra, 248px, navegacao ativa com marcador lateral e cards compactos para paginas vistas recentemente |
| Cabecalho | 68px, superficie com divisor inferior, sessao a direita |
| Busca | Painel de ferramenta com borda, campo flexivel e botao de 42px |
| Resultados | Uma superficie com linhas separadas; hover altera fundo, nao eleva card |
| Tags | Pills compactas neutras; hover adiciona borda e fundo interativo |
| Botoes | 42px, raio 6px; primario azul, secundario neutro, destrutivo vermelho sobrio |
| Breadcrumb | 13–14px, links azuis com sublinhado no hover |
| Tabelas | Cabecalho em superficie secundaria, bordas discretas, overflow horizontal |
| Modais | Maximo 460px, backdrop escuro, unica sombra funcional |
| Loading | Texto curto e discreto; sem animacao obrigatoria |
| Vazio/erro | Painel compacto com marcador lateral; erro combina cor, texto e estrutura |

## 12. Comportamento responsivo

- A partir de 1024px: sidebar sticky e metadados laterais.
- Abaixo de 1024px: sidebar vira drawer, acionado por botao com `aria-expanded`.
- Drawer fecha por backdrop, botao, `Escape` e navegacao; foco retorna ao acionador.
- Abaixo de 700px: resultados passam a uma coluna, busca empilha e modais usam a largura disponivel.
- Alvos interativos mantem pelo menos 40–44px.
- Tabelas, codigo e diffs usam overflow horizontal controlado.

## 13. Acessibilidade

- Contraste minimo de 4.5:1 para texto comum e 3:1 para texto grande ou elementos graficos.
- Foco visivel com outline de 3px e offset de 2px.
- Tema nao remove significado de bordas, textos ou icones.
- Navegacao e modais mantem nomes acessiveis.
- `prefers-reduced-motion` reduz animacoes e transicoes.
- Imagens da marca possuem nome acessivel; simbolo decorativo mobile evita leitura duplicada.

## 14. Pagina de catalogo

A barra superior mostra o simbolo apenas em telas compactas e a sessao no lado direito. O cabecalho `Catalogo / Todas as paginas` ocupa uma largura controlada. A busca aparece como ferramenta unica. Resultados formam uma lista branca continua: titulo a esquerda, metadados a direita e keywords abaixo. Hover usa fundo neutro e links recebem sublinhado, sem deslocamento de layout.

## 15. Pagina de artigo

O breadcrumb `Wiki-bol / Titulo` aparece acima do titulo. Keywords e acoes ficam proximas ao contexto, sem disputar atencao com a leitura. O Markdown usa largura de 820px, linha 1.72, titulos com divisores discretos e imagens responsivas. Ao final, informacoes editoriais aparecem apos uma borda superior, com menor peso visual que o artigo.

## 16. Mudancas priorizadas

### Essenciais

- Assets transparentes e grafia oficial.
- Tokens semanticos e temas claro/escuro.
- Contraste, foco e largura editorial.
- Sidebar desktop e drawer mobile.
- Lista de resultados compacta.

### Importantes

- Tipografia empacotada.
- Estilos completos para Markdown, tabelas, diff, editor e modais.
- Persistencia de preferencia de tema.
- Documentacao do sistema visual.

### Opcionais

- Infoboxes estruturadas quando houver modelo de dados.
- Sumario automatico de artigos longos.
- Testes visuais de regressao em CI.
