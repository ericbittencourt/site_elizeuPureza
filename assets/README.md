# Assets locais

Adicione aqui seus arquivos de mídia para os vídeos de fundo das seções.

Arquivos esperados (nomes podem ser ajustados conforme desejar):

- hero.mp4 e hero.jpg
- servicos.mp4 e servicos.jpg
- depoimentos.mp4 e depoimentos.jpg
- contato.mp4 e contato.jpg

Após colocar os arquivos, não é necessário alterar o código: o site detecta
automaticamente os arquivos locais e passa a utilizá-los como fonte principal.

## Suporte a WebM

Para melhor desempenho em navegadores modernos, você pode fornecer versões em WebM:

- hero.webm
- servicos.webm
- depoimentos.webm
- contato.webm

Se desejar especificar caminhos diferentes dos padrões acima, adicione o atributo `data-local-webm` no `<video>` correspondente em `index.html`. O script prioriza `video/webm`, depois `video/mp4`, e mantém a fonte remota como fallback automaticamente.