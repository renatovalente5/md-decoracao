// As páginas do site. Cada função devolve { caminho, titulo, descricao, seccao, corpo, ... } para a moldura (layout.mjs).
import { esc, foto, video, marca, icone, mesAno, whatsappHref, urlVariante, partilhaFoto, posterUrl } from './util.mjs';
import { telefoneHtml, ralHtml, direitosHtml, destinatariosHtml, textoSemCookies } from '../../legal-comum/index.mjs';

const servicoPor = (ctx, slug) => ctx.servicos.find((s) => s.slug === slug);
// «no Porto», «na Maia», «em Gaia»: a preposição certa para o nome do sítio
export const emLocal = (local) => (/^Porto\b/.test(local) ? 'no ' : /^Maia\b/.test(local) ? 'na ' : 'em ') + local;
const nomesServicos = (ctx, slugs) => slugs.map((s) => servicoPor(ctx, s)?.nome).filter(Boolean);
const legenda = (ctx, t) => [t.local, nomesServicos(ctx, t.servicos)[0]].filter(Boolean).join(' · ');
const ordenados = (ctx) => [...ctx.trabalhos].sort((a, b) => a.destaque - b.destaque);

// Pré-carregar a imagem principal (LCP): o mesmo srcset/sizes do <picture>.
function precarregar(ctx, nome, sizes) {
  const m = ctx.manifesto.fotos[nome];
  const fmt = m.formatos[0];
  const srcset = m.larguras.map((w) => `${urlVariante(ctx, nome, w, fmt)} ${w}w`).join(', ');
  return [{ fmt, srcset, sizes }];
}
function precarregarPoster(ctx, nomeVideo) {
  return [{ href: posterUrl(ctx, nomeVideo), fmt: 'webp' }];
}

// ---------- peças ----------

export function cartaoTrabalho(ctx, t, { sizes = '(min-width: 1100px) 340px, (min-width: 700px) 45vw, 88vw', classe = '' } = {}) {
  return `<article class="cartao-trabalho ${classe}" data-servicos="${t.servicos.join(' ')}">
  <a class="cartao-trabalho__ligacao" href="${ctx.href('/trabalhos/' + t.slug + '/')}">
    <div class="cartao-trabalho__foto moldura">${foto(ctx, t.fotos[0], { sizes })}</div>
    <h3 class="cartao-trabalho__titulo">${esc(t.titulo)}</h3>
    <p class="cartao-trabalho__legenda">${esc(legenda(ctx, t))}</p>
  </a>
</article>`;
}

function cartaoServico(ctx, s, { sizes } = {}) {
  return `<li class="cartao-servico">
  <a href="${ctx.href('/' + s.slug + '/')}">
    <div class="cartao-servico__foto moldura">${foto(ctx, s.capa, { sizes: sizes || '(min-width: 1100px) 340px, (min-width: 700px) 30vw, 70vw' })}</div>
    <span class="cartao-servico__nome">${esc(s.nome)}<span class="seta-redonda" aria-hidden="true">${icone.seta}</span></span>
  </a>
</li>`;
}

// Antes e depois: com as duas fotografias no mesmo enquadramento, uma régua que se arrasta (input range);
// senão, lado a lado.
const ALINHADOS = new Set(['papel-sala-antes', 'papel-quarto-antes']);
export function antesDepois(ctx, [antes, depois], { sizes = '(min-width: 900px) 760px, 92vw', titulo = '' } = {}) {
  if (ALINHADOS.has(antes)) {
    return `<figure class="antes-depois antes-depois--regua" data-antes-depois>
  <div class="antes-depois__palco moldura" style="--pos:50%">
    ${foto(ctx, depois, { sizes, classe: 'antes-depois__depois' })}
    <div class="antes-depois__antes">${foto(ctx, antes, { sizes })}</div>
    <span class="antes-depois__etiqueta antes-depois__etiqueta--antes" aria-hidden="true">Antes</span>
    <span class="antes-depois__etiqueta antes-depois__etiqueta--depois" aria-hidden="true">Depois</span>
    <span class="antes-depois__pega" aria-hidden="true"><span>${icone.anterior}${icone.seguinte}</span></span>
    <input class="antes-depois__regua" type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois${titulo ? ': ' + esc(titulo) : ''}">
  </div>
</figure>`;
  }
  const meia = sizes.replace(/760px/, '380px').replace(/92vw/, '46vw');
  return `<figure class="antes-depois antes-depois--lado">
  <div class="antes-depois__par">
    <div class="antes-depois__lado moldura">${foto(ctx, antes, { sizes: meia })}<span class="antes-depois__etiqueta">Antes</span></div>
    <div class="antes-depois__lado moldura">${foto(ctx, depois, { sizes: meia })}<span class="antes-depois__etiqueta antes-depois__etiqueta--escura">Depois</span></div>
  </div>
</figure>`;
}

function galeria(ctx, nomes, { grupo = 'galeria', sizes = '(min-width: 1100px) 360px, (min-width: 700px) 45vw, 92vw' } = {}) {
  return `<ul class="galeria" data-galeria="${grupo}">
${nomes.map((n, i) => `  <li class="galeria__item"><button class="galeria__botao moldura" type="button" data-ampliar="${i}" aria-label="Ampliar: ${esc(ctx.fotos[n].alt)}">${foto(ctx, n, { sizes })}<span class="galeria__ampliar" aria-hidden="true">${icone.ampliar}</span></button></li>`).join('\n')}
</ul>`;
}

function lightbox() {
  return `<dialog class="lightbox" data-lightbox aria-label="Fotografias">
  <div class="lightbox__palco" data-lightbox-palco></div>
  <p class="lightbox__legenda" data-lightbox-legenda></p>
  <button class="lightbox__fechar redonda" type="button" data-lightbox-fechar>${icone.fechar}<span class="sr">Fechar</span></button>
  <button class="lightbox__ant redonda" type="button" data-lightbox-ant>${icone.anterior}<span class="sr">Anterior</span></button>
  <button class="lightbox__seg redonda" type="button" data-lightbox-seg>${icone.seguinte}<span class="sr">Seguinte</span></button>
</dialog>`;
}

function perguntas(lista) {
  return `<div class="perguntas">
${lista.map((q) => `  <details class="pergunta"><summary class="pergunta__titulo">${esc(q.p)}<span class="pergunta__sinal" aria-hidden="true">${icone.mais}</span></summary><p>${esc(q.r)}</p></details>`).join('\n')}
</div>`;
}

const cabecalhoSeccao = (titulo, { lead = '', ligacao = '', id = '' } = {}) => `<div class="seccao__cabeca">
  <h2 class="seccao__titulo"${id ? ` id="${id}"` : ''}>${titulo}</h2>
  ${lead ? `<p class="seccao__lead">${lead}</p>` : ''}
  ${ligacao}
</div>`;

const ligacaoSeta = (href, texto) => `<a class="ligacao-seta" href="${href}">${texto}<span aria-hidden="true">${icone.seta}</span></a>`;

// ---------- Início ----------
// Curta (o Renato, 17 nov 2026: «ficou muito grande»): capa em mosaico que cabe no primeiro ecrã do telemóvel, os seis
// serviços numa fila, os trabalhos numa fila que desliza, o antes e depois e o «Sobre» curto. Sem passos nem fecho.

export function inicio(ctx) {
  const { site } = ctx;
  const capaVideo = 'capa-sanca-led';
  const mosaico = [
    { nome: 'divisoria-sala-sol', legenda: 'Divisória de vidro' },
    { nome: 'curva-cortina', legenda: 'Janela curva' },
  ];

  const capa = `<section class="capa" aria-labelledby="capa-titulo">
  <div class="contentor capa__grelha">
    <div class="capa__texto">
      <p class="sobretitulo"><span class="estrela" aria-hidden="true">${icone.estrela}</span>Decoração de interiores · Grande Porto</p>
      <h1 class="capa__titulo" id="capa-titulo">Cortinas por medida, <em>do teto ao chão.</em></h1>
      <p class="capa__lead">Cortinas, estores, papel de parede e estofos, medidos e instalados por nós.</p>
      <div class="capa__botoes">
        <a class="botao" href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a>
        <a class="botao botao--linha" href="${ctx.href('/trabalhos/')}">Ver trabalhos</a>
      </div>
      <ul class="confianca" aria-label="Porque escolher a MD">
        <li>${icone.orcamento}Orçamento grátis</li>
        <li>${icone.medida}Medição em casa</li>
        <li>${icone.local}Grande Porto</li>
      </ul>
    </div>
    <div class="capa__mosaico">
      <figure class="ladrilho ladrilho--video">
        ${video(ctx, capaVideo, { classe: 'moldura', rotulo: 'Sala com sanca de LED e cortinas de onda', prioridade: true, sizes: '(min-width: 1000px) 31vw, 46vw' })}
        <figcaption class="ladrilho__legenda">Sanca com LED</figcaption>
      </figure>
      ${mosaico.map((m) => `<figure class="ladrilho">
        <div class="moldura">${foto(ctx, m.nome, { sizes: '(min-width: 1000px) 22vw, 46vw', cedo: true })}</div>
        <figcaption class="ladrilho__legenda">${esc(m.legenda)}</figcaption>
      </figure>`).join('\n      ')}
    </div>
  </div>
</section>`;

  const servicos = `<section class="seccao seccao--servicos" aria-labelledby="t-servicos">
  <div class="contentor">
    ${cabecalhoSeccao('Serviços', { id: 't-servicos', ligacao: ligacaoSeta(ctx.href('/servicos/'), 'Todos os serviços') })}
  </div>
  <div class="contentor contentor--fila">
    <ul class="fila-servicos">
      ${ctx.servicos.map((s) => cartaoServico(ctx, s, { sizes: '(min-width: 1100px) 200px, (min-width: 700px) 16vw, 40vw' })).join('\n')}
    </ul>
  </div>
</section>`;

  const destaques = ordenados(ctx).slice(0, 8);
  const trabalhos = `<section class="seccao seccao--trabalhos" aria-labelledby="t-trabalhos">
  <div class="contentor">
    <div class="seccao__cabeca">
      <h2 class="seccao__titulo" id="t-trabalhos">Trabalhos</h2>
      <div class="seccao__acoes">
        <button class="redonda fila__seta" type="button" data-fila-ant="fila-trabalhos" aria-label="Trabalhos anteriores">${icone.anterior}</button>
        <button class="redonda fila__seta" type="button" data-fila-seg="fila-trabalhos" aria-label="Mais trabalhos">${icone.seguinte}</button>
        ${ligacaoSeta(ctx.href('/trabalhos/'), 'Ver todos')}
      </div>
    </div>
  </div>
  <div class="contentor contentor--fila">
    <div class="fila-trabalhos" id="fila-trabalhos" data-fila>
      ${destaques.map((t) => cartaoTrabalho(ctx, t, { sizes: '(min-width: 1100px) 290px, (min-width: 700px) 34vw, 66vw' })).join('\n')}
    </div>
  </div>
</section>`;

  const pares = [
    { rotulo: 'Cortinas', par: ['porto-sala-antes', 'porto-sala-depois'] },
    { rotulo: 'Papel de parede', par: ['papel-sala-antes', 'papel-sala-depois'] },
    { rotulo: 'Estofos', par: ['estofo-sofa-antes', 'estofo-sofa-depois'] },
  ];
  const antesDepoisSec = `<section class="seccao seccao--antes" aria-labelledby="t-antes">
  <div class="contentor antes-inicio" data-separadores>
    <div class="antes-inicio__texto">
      <h2 class="seccao__titulo" id="t-antes">Antes e depois</h2>
      <p class="seccao__lead">O mesmo canto da casa, antes e depois do nosso trabalho.</p>
      <div class="pilulas" role="tablist" aria-label="Escolher o trabalho">
        ${pares.map((x, i) => `<button class="pilula" type="button" role="tab" id="sep-${i}" aria-controls="painel-${i}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${x.rotulo}</button>`).join('')}
      </div>
    </div>
    <div class="antes-inicio__media">
      ${pares.map((x, i) => `<div class="separadores__painel" role="tabpanel" id="painel-${i}" aria-labelledby="sep-${i}"${i ? ' hidden' : ''}>${antesDepois(ctx, x.par, { titulo: x.rotulo, sizes: '(min-width: 900px) 52vw, 92vw' })}</div>`).join('\n')}
    </div>
  </div>
</section>`;

  const sobre = `<section class="seccao seccao--sobre" aria-labelledby="t-sobre">
  <div class="contentor">
    <div class="sobre-curto">
      <div class="sobre-curto__foto moldura">${foto(ctx, 'gaia-ripado-aplicar', { sizes: '(min-width: 900px) 220px, 120px', alt: 'O Manuel Dias a aplicar papel de parede numa sala' })}</div>
      <div class="sobre-curto__texto">
        <h2 class="seccao__titulo" id="t-sobre">Quem mede é quem instala</h2>
        <p>A MD Decoração de Interiores é o trabalho do Manuel Dias: vai à sua casa, ajuda a escolher, mede e instala, com o mesmo cuidado do primeiro ao último pormenor.</p>
        ${ligacaoSeta(ctx.href('/sobre/'), 'Conhecer a MD')}
      </div>
    </div>
  </div>
</section>`;

  return {
    caminho: '/', titulo: site.marca, seccao: 'inicio', descricao: site.descricao,
    precarregar: precarregarPoster(ctx, capaVideo),
    jsonLd: [ldNegocio(ctx), { '@context': 'https://schema.org', '@type': 'WebSite', name: site.marca, alternateName: site.marcaCurta, url: ctx.abs('/') }],
    corpo: [capa, servicos, trabalhos, antesDepoisSec, sobre].join('\n'),
  };
}

function ldNegocio(ctx) {
  const { site } = ctx;
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': ctx.abs('/#negocio'),
    name: site.marca,
    url: ctx.abs('/'),
    logo: ctx.abs(ctx.href('/apple-touch-icon.png').replace(ctx.base, '')),
    image: ctx.partilhaMarca,
    telephone: '+351' + site.telefone.replace(/\s/g, ''),
    email: site.email,
    founder: { '@type': 'Person', name: site.dono },
    areaServed: site.zonas.map((z) => ({ '@type': 'City', name: z })),
    sameAs: [`https://www.instagram.com/${site.instagram}/`],
    makesOffer: ctx.servicos.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.nomeLongo, url: ctx.abs(ctx.href('/' + s.slug + '/').replace(ctx.base, '')) } })),
  };
}

const migalhas = (ctx, itens) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: itens.map(([nome, caminho], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: ctx.abs(caminho) })),
});

// ---------- Serviços ----------

export function servicosLista(ctx) {
  const corpo = `<section class="cabeca-pagina">
  <div class="contentor">
    <h1 class="cabeca-pagina__titulo">Serviços</h1>
    <p class="cabeca-pagina__lead">Cortinas, estores, papel de parede, estofos, carpetes e remodelações, por medida e com orçamento grátis em todo o ${esc(ctx.site.zonaResumo)}.</p>
  </div>
</section>
<section class="seccao seccao--primeira">
  <div class="contentor">
    <ul class="lista-servicos">
${ctx.servicos.map((s, i) => `      <li class="linha-servico">
        <a href="${ctx.href('/' + s.slug + '/')}" class="linha-servico__ligacao">
          <div class="linha-servico__foto moldura">${foto(ctx, s.capa, { sizes: '(min-width: 900px) 40vw, 92vw', prioridade: i === 0 })}</div>
          <div class="linha-servico__texto">
            <h2 class="linha-servico__nome">${esc(s.nomeLongo)}</h2>
            <p>${esc(s.resumo)}</p>
            <span class="ligacao-seta" aria-hidden="true">Ver ${esc(s.nome.toLowerCase())}<span>${icone.seta}</span></span>
          </div>
        </a>
      </li>`).join('\n')}
    </ul>
  </div>
</section>`;
  return {
    caminho: '/servicos/', titulo: 'Serviços', seccao: 'servicos', corpo,
    descricao: `Cortinas e cortinados por medida, estores, papel de parede, estofos, carpetes e remodelações no ${ctx.site.zonaResumo}. Orçamento grátis.`,
    precarregar: precarregar(ctx, ctx.servicos[0].capa, '(min-width: 900px) 40vw, 92vw'),
    jsonLd: [migalhas(ctx, [['Início', '/'], ['Serviços', '/servicos/']])],
  };
}

export function servico(ctx, s) {
  const trabalhos = ordenados(ctx).filter((t) => t.servicos.includes(s.slug));
  const pedido = ctx.href('/contactos/') + '?servico=' + s.slug + '#pedido';
  const fotosGaleria = s.fotos.filter((f) => f !== s.capa);
  const corpo = `<section class="cabeca-servico">
  <div class="contentor cabeca-servico__grelha">
    <div class="cabeca-servico__texto">
      <p class="sobretitulo"><a href="${ctx.href('/servicos/')}">Serviços</a></p>
      <h1 class="cabeca-pagina__titulo">${esc(s.nomeLongo)}</h1>
      <p class="cabeca-pagina__lead">${esc(s.intro)}</p>
      <div class="capa__botoes">
        <a class="botao" href="${pedido}">Pedir orçamento</a>
        ${trabalhos.length ? `<a class="botao botao--linha" href="#trabalhos">Ver trabalhos</a>` : ''}
      </div>
    </div>
    <div class="cabeca-servico__media">${s.video ? video(ctx, s.video, { classe: 'moldura', rotulo: s.nomeLongo, prioridade: true, sizes: '(min-width: 900px) 38vw, 92vw' }) : `<div class="moldura">${foto(ctx, s.capa, { sizes: '(min-width: 900px) 38vw, 92vw', prioridade: true })}</div>`}</div>
  </div>
</section>
<section class="seccao seccao--primeira" aria-labelledby="t-inclui">
  <div class="contentor">
    <h2 class="sr" id="t-inclui">O que inclui</h2>
    <ul class="itens">
      ${s.itens.map((it) => `<li class="item"><span class="item__estrela" aria-hidden="true">${icone.estrela}</span><h3 class="item__titulo">${esc(it.titulo)}</h3><p>${esc(it.texto)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>
${fotosGaleria.length ? `<section class="seccao" aria-labelledby="t-fotos">
  <div class="contentor">
    ${cabecalhoSeccao('Fotografias', { id: 't-fotos' })}
    ${galeria(ctx, fotosGaleria)}
  </div>
</section>` : ''}
${s.antesDepois ? `<section class="seccao" aria-labelledby="t-antes">
  <div class="contentor contentor--estreito">
    ${cabecalhoSeccao('Antes e depois', { id: 't-antes' })}
    <div class="lista-antes">${s.antesDepois.map((par) => antesDepois(ctx, par, { titulo: s.nome })).join('\n')}</div>
  </div>
</section>` : ''}
${trabalhos.length ? `<section class="seccao" aria-labelledby="trabalhos">
  <div class="contentor">
    ${cabecalhoSeccao('Trabalhos', { id: 'trabalhos', ligacao: ligacaoSeta(ctx.href('/trabalhos/') + '?servico=' + s.slug, 'Todos os trabalhos de ' + s.nome.toLowerCase()) })}
    <div class="grelha-trabalhos">${trabalhos.slice(0, 6).map((t) => cartaoTrabalho(ctx, t)).join('\n')}</div>
  </div>
</section>` : ''}
<section class="seccao" aria-labelledby="t-perguntas">
  <div class="contentor contentor--estreito">
    ${cabecalhoSeccao('Perguntas frequentes', { id: 't-perguntas' })}
    ${perguntas(s.perguntas)}
    <p class="fecho-simples"><a class="botao" href="${pedido}">Pedir orçamento de ${esc(s.nome.toLowerCase())}</a></p>
  </div>
</section>
${lightbox()}`;
  return {
    caminho: `/${s.slug}/`, titulo: s.titulo, seccao: 'servicos', corpo, descricao: s.descricao,
    ogImagem: partilhaFoto(ctx, s.capa),
    precarregar: s.video ? precarregarPoster(ctx, s.video) : precarregar(ctx, s.capa, '(min-width: 900px) 38vw, 92vw'),
    jsonLd: [
      migalhas(ctx, [['Início', '/'], ['Serviços', '/servicos/'], [s.nomeLongo, `/${s.slug}/`]]),
      { '@context': 'https://schema.org', '@type': 'Service', name: s.nomeLongo, description: s.descricao, provider: { '@id': ctx.abs('/#negocio') }, areaServed: ctx.site.zonas.map((z) => ({ '@type': 'City', name: z })) },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.perguntas.map((q) => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r } })) },
    ],
  };
}

// ---------- Trabalhos ----------

export function trabalhosLista(ctx) {
  const lista = ordenados(ctx);
  const usados = ctx.servicos.filter((s) => lista.some((t) => t.servicos.includes(s.slug)));
  const corpo = `<section class="cabeca-pagina">
  <div class="contentor">
    <h1 class="cabeca-pagina__titulo">Trabalhos</h1>
    <p class="cabeca-pagina__lead">Casas, apartamentos e espaços de trabalho no ${esc(ctx.site.zonaResumo)}, com cortinas, estores, papel de parede e estofos feitos à medida.</p>
  </div>
</section>
<section class="seccao seccao--primeira" data-filtro>
  <div class="contentor">
    <div class="pilulas pilulas--filtro" role="group" aria-label="Filtrar por serviço">
      <button class="pilula" type="button" aria-pressed="true" data-filtro-servico="">Todos</button>
      ${usados.map((s) => `<button class="pilula" type="button" aria-pressed="false" data-filtro-servico="${s.slug}">${esc(s.nome)}</button>`).join('\n      ')}
    </div>
    <p class="sr" aria-live="polite" data-filtro-contagem></p>
    <div class="grelha-trabalhos grelha-trabalhos--toda">
      ${lista.map((t, i) => cartaoTrabalho(ctx, t, { sizes: '(min-width: 1100px) 340px, (min-width: 700px) 45vw, 92vw' })).join('\n')}
    </div>
  </div>
</section>`;
  return {
    caminho: '/trabalhos/', titulo: 'Trabalhos', seccao: 'trabalhos', corpo,
    descricao: `Trabalhos de cortinas por medida, estores, papel de parede e estofos no ${ctx.site.zonaResumo}: Porto, Gaia, Matosinhos, Maia, Valongo, Aveiro e mais.`,
    precarregar: precarregar(ctx, lista[0].fotos[0], '(min-width: 1100px) 340px, (min-width: 700px) 45vw, 92vw'),
    jsonLd: [migalhas(ctx, [['Início', '/'], ['Trabalhos', '/trabalhos/']])],
  };
}

export function trabalho(ctx, t, i, lista) {
  const seg = lista[(i + 1) % lista.length];
  const ant = lista[(i - 1 + lista.length) % lista.length];
  const servs = t.servicos.map((sl) => servicoPor(ctx, sl));
  const pedidoTexto = `Olá! Vi o trabalho «${t.titulo}» no site e gostava de pedir um orçamento.`;
  const pedido = ctx.href('/contactos/') + '?servico=' + t.servicos[0] + '&ref=' + encodeURIComponent(t.titulo) + '#pedido';
  const [primeira, ...resto] = t.fotos;
  const corpo = `<article class="trabalho">
  <header class="cabeca-trabalho">
    <div class="contentor">
      <p class="sobretitulo"><a href="${ctx.href('/trabalhos/')}">Trabalhos</a></p>
      <h1 class="cabeca-pagina__titulo">${esc(t.titulo)}</h1>
      <p class="cabeca-trabalho__meta">${[t.local ? `<span>${icone.local}${esc(t.local)}</span>` : '', `<span>${esc(mesAno(t.data))}</span>`, ...servs.map((s) => `<a href="${ctx.href('/' + s.slug + '/')}">${esc(s.nome)}</a>`)].filter(Boolean).join('')}</p>
      <p class="cabeca-pagina__lead">${esc(t.resumo)}</p>
    </div>
  </header>
  <section class="seccao seccao--primeira" aria-label="Fotografias">
    <div class="contentor">
      <div class="trabalho__abertura${t.video ? ' trabalho__abertura--video' : ''}">
        <div class="trabalho__principal moldura">${foto(ctx, primeira, { sizes: '(min-width: 1000px) 56vw, 92vw', prioridade: true })}</div>
        ${t.video ? `<div class="trabalho__video">${video(ctx, t.video, { classe: 'moldura', rotulo: t.titulo, sizes: '(min-width: 1000px) 30vw, 92vw' })}</div>` : ''}
      </div>
      ${resto.length ? galeria(ctx, resto) : ''}
    </div>
  </section>
  ${t.antesDepois ? `<section class="seccao" aria-labelledby="t-antes">
    <div class="contentor contentor--estreito">
      ${cabecalhoSeccao('Antes e depois', { id: 't-antes' })}
      <div class="lista-antes">${t.antesDepois.map((par) => antesDepois(ctx, par, { titulo: t.titulo })).join('\n')}</div>
    </div>
  </section>` : ''}
  <section class="seccao seccao--fecho-trabalho">
    <div class="contentor fecho-trabalho">
      <a class="botao" href="${pedido}">Pedir orçamento</a>
      ${t.instagram ? `<a class="ligacao-seta" href="https://www.instagram.com/p/${t.instagram}/" target="_blank" rel="noopener">Ver no Instagram<span aria-hidden="true">${icone.seta}</span></a>` : ''}
    </div>
  </section>
  <nav class="seccao vizinhos" aria-label="Outros trabalhos">
    <div class="contentor vizinhos__grelha">
      <a class="vizinho" href="${ctx.href('/trabalhos/' + ant.slug + '/')}" rel="prev"><span class="vizinho__dir">${icone.anterior} Anterior</span><span class="vizinho__titulo">${esc(ant.titulo)}</span></a>
      <a class="vizinho vizinho--seg" href="${ctx.href('/trabalhos/' + seg.slug + '/')}" rel="next"><span class="vizinho__dir">Seguinte ${icone.seguinte}</span><span class="vizinho__titulo">${esc(seg.titulo)}</span></a>
    </div>
  </nav>
</article>
${lightbox()}`;
  return {
    caminho: `/trabalhos/${t.slug}/`, titulo: t.local ? `${t.titulo} ${emLocal(t.local)}` : t.titulo, seccao: 'trabalhos', corpo,
    descricao: `${t.resumo} ${servs.map((s) => s.nome).join(', ')}${t.local ? ' ' + emLocal(t.local) : ''}, pela ${ctx.site.marca}.`,
    ogImagem: partilhaFoto(ctx, primeira),
    precarregar: precarregar(ctx, primeira, '(min-width: 1000px) 56vw, 92vw'),
    jsonLd: [migalhas(ctx, [['Início', '/'], ['Trabalhos', '/trabalhos/'], [t.titulo, `/trabalhos/${t.slug}/`]])],
    pedidoTexto,
  };
}

// ---------- Sobre ----------

export function sobre(ctx) {
  const { site } = ctx;
  const corpo = `<section class="cabeca-servico">
  <div class="contentor cabeca-servico__grelha">
    <div class="cabeca-servico__texto">
      <h1 class="cabeca-pagina__titulo">Sobre a MD</h1>
      <p class="cabeca-pagina__lead">A MD Decoração de Interiores é o trabalho do Manuel Dias: cortinas, estores, papel de parede e estofos por medida, para casas e espaços de trabalho no ${esc(site.zonaResumo)}.</p>
      <p>Começou em 2025 com um objetivo: cuidar de cada pormenor como o cliente o imaginou e levar mais conforto e vida a cada casa. O Manuel vai à sua casa, ajuda a escolher o tecido, o papel ou a calha, mede e instala, até a cortina cair direita.</p>
      <ul class="factos">
        <li><strong>Orçamento grátis</strong>e sem compromisso</li>
        <li><strong>Medição em casa</strong>e instalação por nós</li>
        <li><strong>${esc(site.zonas.length)} concelhos</strong>do Porto a Aveiro</li>
      </ul>
    </div>
    <div class="cabeca-servico__media"><div class="moldura">${video(ctx, 'aplicar-papel', { rotulo: 'O Manuel a aplicar papel de parede', prioridade: true, sizes: '(min-width: 900px) 38vw, 92vw' })}</div></div>
  </div>
</section>
<section class="seccao" aria-labelledby="t-zonas">
  <div class="contentor contentor--estreito">
    ${cabecalhoSeccao('Onde trabalhamos', { id: 't-zonas', lead: 'Vamos à sua casa medir e instalar em todo o Grande Porto e arredores:' })}
    <ul class="zonas">${site.zonas.map((z) => `<li>${esc(z)}</li>`).join('')}</ul>
    <p class="fecho-simples"><a class="botao" href="${ctx.href('/contactos/')}#pedido">Pedir orçamento</a></p>
  </div>
</section>`;
  return {
    caminho: '/sobre/', titulo: 'Sobre', seccao: 'sobre', corpo,
    descricao: `A ${site.marca} é o trabalho do Manuel Dias: cortinas, estores, papel de parede e estofos por medida no ${site.zonaResumo}.`,
    precarregar: precarregarPoster(ctx, 'aplicar-papel'),
    jsonLd: [migalhas(ctx, [['Início', '/'], ['Sobre', '/sobre/']])],
  };
}

// ---------- Contactos e pedido de orçamento ----------

export function contactos(ctx) {
  const { site } = ctx;
  const wa = whatsappHref(site.whatsapp);
  const corpo = `<section class="cabeca-pagina">
  <div class="contentor">
    <h1 class="cabeca-pagina__titulo">Contactos</h1>
    <p class="cabeca-pagina__lead">Diga-nos de que precisa e onde: respondemos com a marcação da visita e o orçamento, sem compromisso.</p>
  </div>
</section>
<section class="seccao seccao--primeira">
  <div class="contentor contactos">
    <form class="pedido" id="pedido" data-pedido data-whatsapp="${esc(site.whatsapp)}" data-email="${esc(site.email)}" novalidate>
      <h2 class="pedido__titulo">Pedir orçamento grátis</h2>
      <fieldset class="campo">
        <legend class="campo__rotulo">De que precisa?</legend>
        <div class="escolhas">
          ${ctx.servicos.map((s) => `<label class="escolha"><input type="checkbox" name="servico" value="${esc(s.nome)}" data-slug="${s.slug}"><span>${esc(s.nome)}</span></label>`).join('\n          ')}
        </div>
      </fieldset>
      <div class="campo">
        <label class="campo__rotulo" for="p-concelho">Onde?</label>
        <select id="p-concelho" name="concelho">
          <option value="">Escolher o concelho</option>
          ${site.zonas.map((z) => `<option>${esc(z)}</option>`).join('')}
          <option>Outro</option>
        </select>
      </div>
      <div class="campo">
        <label class="campo__rotulo" for="p-mensagem">Conte-nos mais <span class="campo__opcional">(opcional)</span></label>
        <textarea id="p-mensagem" name="mensagem" rows="4" placeholder="Divisões, medidas aproximadas, ideias…"></textarea>
      </div>
      <div class="campo">
        <label class="campo__rotulo" for="p-nome">O seu nome</label>
        <input id="p-nome" name="nome" autocomplete="name" required>
        <p class="campo__erro" id="p-nome-erro" hidden>Escreva o seu nome, para sabermos a quem responder.</p>
      </div>
      <div class="pedido__envio">
        ${wa ? `<button class="botao botao--wa" type="submit" name="canal" value="whatsapp">${icone.whatsapp}Enviar pelo WhatsApp</button>` : ''}
        <button class="botao ${wa ? 'botao--linha' : ''}" type="submit" name="canal" value="email">${icone.email}Enviar por email</button>
      </div>
      <p class="pedido__nota">A mensagem abre no ${wa ? 'WhatsApp ou no ' : ''}email, já escrita: só tem de a enviar.</p>
    </form>
    <aside class="contactos__diretos" aria-labelledby="t-diretos">
      <h2 class="contactos__titulo" id="t-diretos">Ou fale diretamente</h2>
      <ul class="contactos__lista">
        ${wa ? `<li><span class="redonda">${icone.whatsapp}</span><div><strong>WhatsApp</strong><a href="${wa}" target="_blank" rel="noopener">Enviar uma mensagem</a></div></li>` : ''}
        <li><span class="redonda">${icone.telefone}</span><div><strong>Telefone</strong>${telefoneHtml(site.telefone, { frase: 'com-a', comIndicativo: false })}</div></li>
        <li><span class="redonda">${icone.email}</span><div><strong>Email</strong><a href="mailto:${site.email}">${esc(site.email)}</a></div></li>
        <li><span class="redonda">${icone.instagram}</span><div><strong>Instagram</strong><a href="https://www.instagram.com/${site.instagram}/" target="_blank" rel="noopener">@${esc(site.instagram)}</a></div></li>
        <li><span class="redonda">${icone.local}</span><div><strong>Zona</strong>${esc(site.zonaResumo)}: ${esc(site.zonas.join(', '))}</div></li>
      </ul>
      ${site.empresa.nome ? `<p class="contactos__empresa">${esc(site.empresa.nome)} · NIF ${esc(site.empresa.nif)}${site.empresa.morada ? ' · ' + esc(site.empresa.morada) : ''}</p>` : ''}
    </aside>
  </div>
</section>`;
  return {
    caminho: '/contactos/', titulo: 'Contactos e orçamento', seccao: 'contactos', corpo,
    descricao: `Peça um orçamento grátis para cortinas, estores, papel de parede ou estofos no ${site.zonaResumo}. Telefone ${site.telefone}, email e Instagram.`,
    jsonLd: [migalhas(ctx, [['Início', '/'], ['Contactos', '/contactos/']])],
  };
}

// ---------- Legais (fora do Google: noindex e fora do sitemap) ----------

export function privacidade(ctx) {
  const { site } = ctx;
  const responsavel = site.empresa.nome ? `${esc(site.empresa.nome)} (NIF ${esc(site.empresa.nif)})` : `${esc(site.dono)} (${esc(site.marca)})`;
  const corpo = `<section class="cabeca-pagina"><div class="contentor contentor--estreito">
  <h1 class="cabeca-pagina__titulo">Política de privacidade</h1>
  <p class="cabeca-pagina__lead">Este site não tem formulários que guardem dados, contas, cookies nem estatísticas.</p>
</div></section>
<section class="seccao seccao--primeira"><div class="contentor contentor--estreito texto">
  <h2>Quem é o responsável</h2>
  <p>${responsavel}. Contacto: <a href="mailto:${site.email}">${esc(site.email)}</a>, ${telefoneHtml(site.telefone, { frase: 'com-a', comIndicativo: false })}.</p>
  <h2>Que dados tratamos e para quê</h2>
  <p>O pedido de orçamento do site não envia nada para nenhum servidor: abre a sua aplicação de email${site.whatsapp ? ' ou o WhatsApp' : ''} com a mensagem já escrita, e é o próprio que a envia. Tratamos o nome, o contacto e o que nos contar (morada da visita, medidas, fotografias) só para responder ao pedido, marcar a medição, fazer o orçamento e, se avançar, o trabalho.</p>
  <p>Guardamos os pedidos de contacto até 12 meses depois da última conversa; as faturas, 10 anos, como manda a lei fiscal.</p>
  <h2>Quem mais os vê</h2>
  ${destinatariosHtml({ alojamento: 'github-pages', email: 'google', whatsapp: Boolean(site.whatsapp), instagram: true }, { formato: 'lista' })}
  <h2>Os seus direitos</h2>
  ${direitosHtml({ email: site.email })}
  <h2>Cookies</h2>
  <p>${esc(textoSemCookies({ comMapa: false }))}</p>
</div></section>`;
  return { caminho: '/privacidade/', titulo: 'Política de privacidade', seccao: 'legal', corpo, indexar: false, legal: true,
    descricao: `Como a ${site.marca} trata os dados de quem pede um orçamento.` };
}

export function litigios(ctx) {
  const corpo = `<section class="cabeca-pagina"><div class="contentor contentor--estreito">
  <h1 class="cabeca-pagina__titulo">Resolução de litígios</h1>
</div></section>
<section class="seccao seccao--primeira"><div class="contentor contentor--estreito texto">
  ${ralHtml({ ambito: 'local', concelhos: ['Valongo', 'Porto', 'Vila Nova de Gaia', 'Matosinhos', 'Maia', 'Gondomar', 'Vila do Conde', 'Santa Maria da Feira', 'Aveiro'] })}
</div></section>`;
  return { caminho: '/litigios/', titulo: 'Resolução de litígios', seccao: 'legal', corpo, indexar: false, legal: true,
    descricao: 'Entidades de resolução alternativa de litígios de consumo.' };
}

export function naoEncontrada(ctx) {
  const corpo = `<section class="cabeca-pagina cabeca-pagina--404"><div class="contentor contentor--estreito">
  <p class="sobretitulo">Erro 404</p>
  <h1 class="cabeca-pagina__titulo">Esta página não existe</h1>
  <p class="cabeca-pagina__lead">O endereço pode estar errado ou a página mudou de sítio.</p>
  <div class="capa__botoes"><a class="botao" href="${ctx.href('/')}">Ir para o início</a><a class="botao botao--linha" href="${ctx.href('/trabalhos/')}">Ver trabalhos</a></div>
</div></section>`;
  return { caminho: '/404.html', titulo: 'Página não encontrada', seccao: 'outra', corpo, indexar: false, legal: true };
}
