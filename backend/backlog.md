# Backlog do Backend AP6 Wiki

Lista de sugestoes para evolucao do backend. Os itens abaixo nao sao obrigatorios imediatamente; servem como direcao para melhorar robustez, experiencia de uso e apresentacao do projeto.

## Concluido

- Endpoint de logout documentado para facilitar testes no navegador e no Postman.
- Tratamento de erro para upload multipart ausente, retornando JSON limpo em vez de stack trace.
- Testes de controller e service para paginas, historico e upload.
- Busca publica de paginas por campo unico, usando titulo, slug, keywords e conteudo.
- Validacao de historico apenas para paginas ativas.
- Validacao de `pageId` ativo no upload de imagens.
- Validacao de assinatura real de imagens por magic bytes.
- Limites de tamanho e quantidade de resultados na busca publica.
- Logs SQL desativados por padrao, com variaveis para ativar em desenvolvimento.
- Restauracao de pagina a partir de uma versao anterior do historico.
- Resposta `401` em JSON para chamadas protegidas de `/api/**` sem sessao ativa.
- Redirecionamento configuravel para o frontend apos login Google.
- Suporte a roles `USER` e `ADMIN`, com promocao manual no banco para usuario de teste.
- Permissao de delete e restauracao restrita ao autor original da pagina ou admin.

## Alta prioridade

Nenhum item pendente no momento.

## Media prioridade

- Adicionar navegacao/listagem por tags, categorias ou keywords.
- Adicionar status de rascunho/publicado.
- Adicionar auditoria simples de alteracoes alem do historico de conteudo.
- Criar paginacao para listagem de paginas e historico.

## Baixa prioridade

- Adicionar limpeza de imagens orfas no Supabase Storage.
- Adicionar OpenAPI/Swagger para documentacao interativa.
- Adicionar endpoint de health check.
