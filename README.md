# MD Decoração de Interiores — site

Protótipo do site da MD Decoração de Interiores (cortinas, estores, papel de parede, estofos e carpetes por medida no
Grande Porto). Pré-visualização: https://renatovalente5.github.io/md-decoracao/ (noindex). As três propostas da
página inicial estão em `/propostas/a/`, `/propostas/b/` e `/propostas/c/`.

    python3 scripts/imagens.py          # versões AVIF/WebP das fotografias, ícones e cartão de partilha (.cache/imagens)
    node scripts/build.mjs              # o site em _site/ (--base, --url, --proposta=a|b|c, --producao)
    node scripts/testar.mjs             # provas do site construído
    python3 -m http.server 5180 --directory _site

Conteúdo em `content/` (site.json, servicos.json, trabalhos.json, fotos.json), fotografias e vídeos em `media/`,
desenho em `src/` (letras Source Serif 4 e Albert Sans, SIL OFL). As peças legais vêm de `legal-comum/`.
