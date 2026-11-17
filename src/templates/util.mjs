// Funções comuns do gerador: escapar, imagens responsivas, vídeo, datas, dados estruturados.

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const mesAno = (aaaaMm) => {
  const [a, m] = String(aaaaMm).split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
};

// O contexto da construção: base (/md-decoracao no GitHub Pages), manifesto das imagens e o registo dos ficheiros usados.
export function criarContexto({ base, url, manifesto, fotos }) {
  const usados = new Set();
  const ctx = { base, url, manifesto, fotos, usados };
  ctx.href = (caminho = '/') => (base + caminho).replace(/\/{2,}/g, '/');
  ctx.abs = (caminho = '/') => url.replace(/\/$/, '') + caminho;
  return ctx;
}

// <picture> com AVIF e WebP nas larguras que existem, e um JPEG de recurso.
// sizes: o que a imagem ocupa no ecrã; prioridade: só na imagem principal do primeiro ecrã (LCP).
export function foto(ctx, nome, { sizes = '100vw', classe = '', prioridade = false, alt, foco, largura } = {}) {
  const m = ctx.manifesto.fotos[nome];
  const info = ctx.fotos[nome];
  if (!m || !info) throw new Error(`Fotografia desconhecida: ${nome}`);
  return imagem(ctx, `${nome}-${m.resumo}`, m, {
    sizes, classe, prioridade, alt: alt ?? info.alt, foco: foco ?? info.foco, largura,
  });
}

export function posterVideo(ctx, nome, opts = {}) {
  const m = ctx.manifesto.videos[nome];
  if (!m) throw new Error(`Vídeo desconhecido: ${nome}`);
  return imagem(ctx, `video-${nome}-${m.resumo}`, m, { alt: '', ...opts });
}

function imagem(ctx, prefixo, m, { sizes = '100vw', classe = '', prioridade = false, alt = '', foco = 50, largura }) {
  const larguras = largura ? m.larguras.filter((w) => w <= largura) : m.larguras;
  const ws = larguras.length ? larguras : [m.larguras[0]];
  const fontes = m.formatos.map((fmt) => {
    const srcset = ws.map((w) => { const f = `${prefixo}-${w}.${fmt}`; ctx.usados.add(f); return `${ctx.href('/assets/img/' + f)} ${w}w`; }).join(', ');
    return `<source type="image/${fmt}" srcset="${srcset}" sizes="${esc(sizes)}">`;
  }).join('');
  const jpg = `${prefixo}-${m.jpg}.jpg`;
  ctx.usados.add(jpg);
  const h = Math.round(m.h * m.jpg / m.w);
  const estilo = foco !== 50 ? ` style="object-position:50% ${foco}%"` : '';
  const carregar = prioridade ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture${classe ? ` class="${classe}"` : ''}>${fontes}<img src="${ctx.href('/assets/img/' + jpg)}" width="${m.jpg}" height="${h}" alt="${esc(alt)}" ${carregar}${estilo}></picture>`;
}

// O URL de uma variante (para o preload da imagem principal e para o og:image).
export function urlVariante(ctx, nome, w, fmt = 'avif') {
  const m = ctx.manifesto.fotos[nome];
  const larg = m.larguras.includes(w) ? w : m.larguras[m.larguras.length - 1];
  const f = `${nome}-${m.resumo}-${larg}.${fmt}`;
  ctx.usados.add(f);
  return ctx.href('/assets/img/' + f);
}
export function partilhaFoto(ctx, nome) {
  const m = ctx.manifesto.fotos[nome];
  const f = `${nome}-${m.resumo}-partilha.jpg`;
  ctx.usados.add(f);
  return ctx.abs(ctx.href('/assets/img/' + f).replace(ctx.base, ''));
}
export function partilhaMarca(ctx) {
  const f = ctx.manifesto.marca.partilha;
  ctx.usados.add(f);
  return ctx.abs(ctx.href('/assets/img/' + f).replace(ctx.base, ''));
}

// Vídeo sem som, em ciclo, que só toca quando se vê (o site.js trata disso), com botão de pausa (WCAG 2.2.2).
export function video(ctx, nome, { classe = '', rotulo = 'Vídeo', prioridade = false, sizes = '100vw' } = {}) {
  const m = ctx.manifesto.videos[nome];
  if (!m) throw new Error(`Vídeo desconhecido: ${nome}`);
  const mp4 = `${nome}.mp4`;
  ctx.usados.add('video:' + mp4);
  const posterJpg = `video-${nome}-${m.resumo}-${m.jpg}.jpg`;
  ctx.usados.add(posterJpg);
  return `<div class="video ${classe}" data-video>
  ${posterVideo(ctx, nome, { classe: 'video__poster', prioridade, sizes })}
  <video muted playsinline loop preload="none" poster="${ctx.href('/assets/img/' + posterJpg)}" data-src="${ctx.href('/assets/video/' + mp4)}" aria-label="${esc(rotulo)}" width="${m.w}" height="${m.h}"></video>
  <button class="video__botao" type="button" aria-pressed="false" data-video-botao>
    <svg class="i-pausa" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>
    <svg class="i-tocar" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>
    <span class="sr" data-video-rotulo>Pausar o vídeo</span>
  </button>
</div>`;
}

// O emblema (logótipo redondo) e o desenho dourado, como <img> com srcset (1×/2×/3×).
export function marca(ctx, chave, altura, { classe = '', alt = '' } = {}) {
  const m = ctx.manifesto.marca[chave];
  const alturas = m.alturas;
  const escolha = (x) => alturas.find((a) => a >= altura * x) ?? alturas[alturas.length - 1];
  const um = escolha(1), dois = escolha(2), tres = escolha(3);
  const f = (a, fmt) => { const n = `${chave}-${m.resumo}-${a}.${fmt}`; ctx.usados.add(n); return ctx.href('/assets/img/' + n); };
  const w = Math.round(m.w * altura / m.h);
  return `<picture${classe ? ` class="${classe}"` : ''}><source type="image/webp" srcset="${f(um, 'webp')} 1x, ${f(dois, 'webp')} 2x, ${f(tres, 'webp')} 3x"><img src="${f(dois, 'png')}" width="${w}" height="${altura}" alt="${esc(alt)}" decoding="async"></picture>`;
}

export const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// Ligação do WhatsApp com a mensagem já escrita (só se houver número).
export const whatsappHref = (numero, texto = '') => numero
  ? `https://wa.me/${numero}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
  : '';

export const icone = {
  seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 7 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  telefone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a12 12 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6A2 2 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6a2 2 0 0 1 2.6-2.1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>',
  local: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  estrela: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.5 5.5 4.5 9.5 10 10-5.5.5-9.5 4.5-10 10-.5-5.5-4.5-9.5-10-10 5.5-.5 9.5-4.5 10-10Z" fill="currentColor"/></svg>',
  orcamento: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20Z M14 3.5V8h4M9.5 12h5M9.5 15.5h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  medida: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 15.5 15.5 3.5l5 5-12 12Z M7 12l1.8 1.8M9.5 9.5l2.5 2.5M12 7l1.8 1.8M14.5 4.5 17 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  ampliar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  anterior: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  seguinte: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
