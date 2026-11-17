// A moldura de todas as páginas: <head>, cabeçalho, rodapé.
import { esc, marca, icone, jsonLd, whatsappHref } from './util.mjs';
import { livroReclamacoes, telefoneHtml } from '../../legal-comum/index.mjs';

export function pagina(ctx, p) {
  const { site, servicos, assets, opcoes } = ctx;
  const titulo = p.titulo === site.marca ? site.titulo : `${p.titulo} | ${site.marca}`;
  const canonical = ctx.abs(ctx.href(p.caminho).replace(ctx.base, ''));
  const indexar = !opcoes.preview && p.indexar !== false;
  const og = p.ogImagem || ctx.partilhaMarca;
  const atual = (c) => p.seccao === c ? ' aria-current="page"' : '';
  const temaCor = opcoes.proposta === 'b' ? '#1C201F' : '#F6F2EB';
  const precarregar = (p.precarregar || []).map((pr) =>
    `<link rel="preload" as="image" type="image/${pr.fmt}" imagesrcset="${pr.srcset}" imagesizes="${esc(pr.sizes)}" fetchpriority="high">`).join('\n');
  const wa = whatsappHref(site.whatsapp, 'Olá! Gostava de pedir um orçamento.');

  const nav = [
    ['servicos', '/servicos/', 'Serviços'],
    ['trabalhos', '/trabalhos/', 'Trabalhos'],
    ['sobre', '/sobre/', 'Sobre'],
    ['contactos', '/contactos/', 'Contactos'],
  ];

  return `<!doctype html>
<html lang="pt-PT" data-proposta="${opcoes.proposta}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>@media (prefers-reduced-motion: no-preference){@view-transition{navigation:auto}}</style>
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(p.descricao || site.descricao)}">
${indexar ? '' : '<meta name="robots" content="noindex">\n'}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_PT">
<meta property="og:site_name" content="${esc(site.marca)}">
<meta property="og:title" content="${esc(p.ogTitulo || p.titulo)}">
<meta property="og:description" content="${esc(p.descricao || site.descricao)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${temaCor}">
<link rel="icon" href="${ctx.href('/favicon.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${ctx.href('/apple-touch-icon.png')}">
<link rel="manifest" href="${ctx.href('/site.webmanifest')}">
<link rel="preload" href="${ctx.href('/assets/fontes/' + assets.fonteTitulos)}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.href('/assets/fontes/' + assets.fonteTexto)}" as="font" type="font/woff2" crossorigin>
${precarregar}
<link rel="stylesheet" href="${ctx.href('/assets/' + assets.css)}">
<script src="${ctx.href('/assets/' + assets.js)}" defer></script>
${(p.jsonLd || []).map(jsonLd).join('\n')}
</head>
<body class="pagina-${p.seccao || 'outra'}${p.classe ? ' ' + p.classe : ''}">
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
<header class="topo" data-topo>
  <div class="topo__barra contentor">
    <button class="topo__menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-abrir>
      ${icone.menu}<span class="sr">Menu</span>
    </button>
    <nav class="topo__nav" aria-label="Principal">
      <ul>${nav.slice(0, 3).map(([c, h, t]) => `<li><a href="${ctx.href(h)}"${atual(c)}>${t}</a></li>`).join('')}</ul>
    </nav>
    <a class="topo__marca" href="${ctx.href('/')}" aria-label="${esc(site.marca)}, página inicial">
      ${marca(ctx, 'emblema', 56, { classe: 'topo__emblema' })}
    </a>
    <div class="topo__acoes">
      <a class="topo__ligacao" href="${ctx.href('/contactos/')}"${atual('contactos')}>Contactos</a>
      <a class="botao botao--pequeno topo__orcamento" href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a>
      ${wa ? `<a class="topo__wa" href="${wa}" target="_blank" rel="noopener">${icone.whatsapp}<span class="sr">WhatsApp</span></a>` : `<a class="topo__wa" href="tel:+351${site.telefone.replace(/\s/g, '')}">${icone.telefone}<span class="sr">Telefonar</span></a>`}
    </div>
  </div>
</header>
<dialog class="menu" id="menu" aria-label="Menu" data-menu>
  <div class="menu__corpo">
    <div class="menu__topo">
      ${marca(ctx, 'emblema', 48, { classe: 'menu__emblema' })}
      <button class="menu__fechar" type="button" data-menu-fechar>${icone.fechar}<span class="sr">Fechar o menu</span></button>
    </div>
    <nav class="menu__nav" aria-label="Menu">
      <ul>
        <li><a href="${ctx.href('/')}"${p.seccao === 'inicio' ? ' aria-current="page"' : ''}>Início</a></li>
        ${nav.map(([c, h, t]) => `<li><a href="${ctx.href(h)}"${atual(c)}>${t}</a></li>`).join('')}
      </ul>
      <ul class="menu__servicos">
        ${servicos.map((s) => `<li><a href="${ctx.href('/' + s.slug + '/')}">${esc(s.nome)}</a></li>`).join('')}
      </ul>
    </nav>
    <div class="menu__pe">
      <a class="botao" href="${ctx.href('/contactos/')}#pedido">Pedir orçamento grátis</a>
      <p class="menu__contacto">${telefoneHtml(site.telefone, { frase: 'com-a', classe: 'menu__telefone' })}</p>
    </div>
  </div>
</dialog>
<main id="conteudo">
${p.corpo}
</main>
${rodape(ctx, p)}
</body>
</html>
`;
}

function rodape(ctx, p) {
  const { site, servicos } = ctx;
  const ano = new Date().getFullYear();
  const wa = whatsappHref(site.whatsapp, 'Olá! Gostava de pedir um orçamento.');
  return `<footer class="rodape">
  <div class="contentor rodape__grelha">
    <div class="rodape__marca">
      <a href="${ctx.href('/')}" class="rodape__logo" aria-label="${esc(site.marca)}, página inicial">${marca(ctx, 'emblema', 96)}</a>
      <p class="rodape__frase">${esc(site.frase)}</p>
      <p class="rodape__redes"><a href="https://www.instagram.com/${site.instagram}/" target="_blank" rel="noopener" class="redonda">${icone.instagram}<span class="sr">Instagram</span></a>${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="redonda">${icone.whatsapp}<span class="sr">WhatsApp</span></a>` : ''}</p>
    </div>
    <nav class="rodape__coluna" aria-label="Serviços">
      <h2 class="rodape__titulo">Serviços</h2>
      <ul>${servicos.map((s) => `<li><a href="${ctx.href('/' + s.slug + '/')}">${esc(s.nome)}</a></li>`).join('')}</ul>
    </nav>
    <nav class="rodape__coluna" aria-label="A MD">
      <h2 class="rodape__titulo">A MD</h2>
      <ul>
        <li><a href="${ctx.href('/trabalhos/')}">Trabalhos</a></li>
        <li><a href="${ctx.href('/sobre/')}">Sobre</a></li>
        <li><a href="${ctx.href('/contactos/')}">Contactos</a></li>
        <li><a href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a></li>
      </ul>
    </nav>
    <div class="rodape__coluna">
      <h2 class="rodape__titulo">Fale connosco</h2>
      <ul class="rodape__contactos">
        ${wa ? `<li><a href="${wa}" target="_blank" rel="noopener"><span class="rodape__icone">${icone.whatsapp}</span>WhatsApp</a></li>` : ''}
        <li><span class="rodape__icone">${icone.telefone}</span>${telefoneHtml(site.telefone, { frase: 'com-a', comIndicativo: false })}</li>
        <li><a href="mailto:${site.email}"><span class="rodape__icone">${icone.email}</span>${esc(site.email)}</a></li>
        <li><span class="rodape__icone">${icone.local}</span>${esc(site.zonaResumo)}</li>
      </ul>
    </div>
  </div>
  <div class="contentor rodape__legal">
    <p>© ${ano} ${esc(site.marca)}</p>
    <ul>
      <li><a href="${ctx.href('/privacidade/')}">Privacidade</a></li>
      <li><a href="${ctx.href('/litigios/')}">Resolução de litígios</a></li>
      <li>${livroReclamacoes()}</li>
    </ul>
  </div>
</footer>`;
}
