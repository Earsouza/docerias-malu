# Docerias Malu — central de links

Site estático (HTML, CSS e JS puros), pronto para GitHub Pages.

## Como editar
- **Links, contatos e produtos:** `config.js` (campos com `SEU_` ou vazios aparecem como "pendentes").
- **Foto de destaque:** substitua `destaque.svg` por uma foto (ex.: `destaque.jpg`, 800x1000, até 150 KB, formato JPG/WebP) e ajuste o `src` e o `og:image` em `index.html`.
- **Fotos dos produtos:** coloque os arquivos na pasta `img/` e informe o caminho (ex.: `img/bolo-de-pote.jpg`) em `imagem` no `config.js`.
- **SEO:** troque `SEU_USUARIO` pela URL real em `canonical` e atualize `og:image` no `index.html` (padrão: `img/logo.png`).
- **Cores:** variáveis no início de `style.css`.

## Publicar no GitHub Pages
1. Envie a pasta para um repositório no GitHub.
2. Em *Settings → Pages*, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. O site ficará em `https://SEU_USUARIO.github.io/NOME-DO-REPOSITORIO/`. Todos os caminhos são relativos.
