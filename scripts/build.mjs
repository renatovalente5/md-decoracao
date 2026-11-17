#!/usr/bin/env node
// Constrói o site em _site/ a partir de content/, media/ (via .cache/imagens) e src/.
//
//   node scripts/build.mjs                       pré-visualização local (base /, noindex)
//   node scripts/build.mjs --base=/md-decoracao --url=https://renatovalente5.github.io/md-decoracao
//   node scripts/build.mjs --producao --url=https://mddecoracao.pt   (indexável, com sitemap)
//   --proposta=a|b|c   o aspeto do site inteiro (por omissão a); as outras duas propostas da página inicial
//                      saem sempre em /propostas/<letra>/ (noindex), com as mesmas páginas interiores.
//
// Antes: python3 scripts/imagens.py (gera .cache/imagens e o manifesto).
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { criarContexto, partilhaMarca } from '../src/templates/util.mjs';
import { pagina } from '../src/templates/layout.mjs';
import * as P from '../src/templates/paginas.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const opcoes = {
  base: (arg('base', '') || '').replace(/\/$/, ''),
  url: arg('url', 'http://127.0.0.1:5180'),
  proposta: arg('proposta', 'a'),
  producao: process.argv.includes('--producao'),
  saida: join(RAIZ, arg('saida', '_site')),
};
opcoes.preview = !opcoes.producao;
if (!['a', 'b', 'c'].includes(opcoes.proposta)) throw new Error('--proposta tem de ser a, b ou c');

const ler = (f) => JSON.parse(readFileSync(join(RAIZ, f), 'utf8'));
const site = ler('content/site.json');
const servicos = ler('content/servicos.json');
const trabalhos = ler('content/trabalhos.json');
const fotos = ler('content/fotos.json');
const CACHE = join(RAIZ, '.cache', 'imagens');
if (!existsSync(join(CACHE, 'manifesto.json'))) throw new Error('Falta .cache/imagens/manifesto.json: corre primeiro python3 scripts/imagens.py');
const manifesto = JSON.parse(readFileSync(join(CACHE, 'manifesto.json'), 'utf8'));

// ---- verificações do conteúdo (a construção pára com a lista do que está mal) ----
const erros = [];
const fotoExiste = (n, onde) => { if (!fotos[n] || !manifesto.fotos[n]) erros.push(`${onde}: fotografia desconhecida «${n}»`); };
const videoExiste = (n, onde) => { if (n && !manifesto.videos[n]) erros.push(`${onde}: vídeo desconhecido «${n}»`); };
for (const s of servicos) {
  fotoExiste(s.capa, `serviço ${s.slug} (capa)`);
  s.fotos.forEach((f) => fotoExiste(f, `serviço ${s.slug}`));
  (s.antesDepois || []).flat().forEach((f) => fotoExiste(f, `serviço ${s.slug} (antes e depois)`));
  videoExiste(s.video, `serviço ${s.slug}`);
  if (!s.perguntas?.length) erros.push(`serviço ${s.slug}: sem perguntas frequentes`);
}
const slugs = new Set();
for (const t of trabalhos) {
  if (slugs.has(t.slug)) erros.push(`trabalho repetido: ${t.slug}`);
  slugs.add(t.slug);
  if (!t.fotos?.length) erros.push(`trabalho ${t.slug}: sem fotografias`);
  t.fotos.forEach((f) => fotoExiste(f, `trabalho ${t.slug}`));
  (t.antesDepois || []).flat().forEach((f) => fotoExiste(f, `trabalho ${t.slug} (antes e depois)`));
  videoExiste(t.video, `trabalho ${t.slug}`);
  t.servicos.forEach((sl) => { if (!servicos.some((s) => s.slug === sl)) erros.push(`trabalho ${t.slug}: serviço desconhecido «${sl}»`); });
  if (!/^\d{4}-\d{2}$/.test(t.data)) erros.push(`trabalho ${t.slug}: data «${t.data}» (AAAA-MM)`);
}
for (const [n, f] of Object.entries(fotos)) if (!f.alt || f.alt.length < 12) erros.push(`fotografia ${n}: descrição em falta ou curta`);
if (erros.length) { console.error('O conteúdo tem problemas:\n- ' + erros.join('\n- ')); process.exit(1); }

// ---- saída limpa ----
rmSync(opcoes.saida, { recursive: true, force: true });
mkdirSync(join(opcoes.saida, 'assets', 'img'), { recursive: true });
mkdirSync(join(opcoes.saida, 'assets', 'video'), { recursive: true });
mkdirSync(join(opcoes.saida, 'assets', 'fontes'), { recursive: true });

const resumo = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);

// letras: nome com resumo (o GitHub Pages guarda 10 min em cache e não deixa mudar os cabeçalhos)
const fontes = {};
for (const f of readdirSync(join(RAIZ, 'src', 'fontes')).filter((x) => x.endsWith('.woff2'))) {
  const buf = readFileSync(join(RAIZ, 'src', 'fontes', f));
  const nome = f.replace('.woff2', `-${resumo(buf)}.woff2`);
  writeFileSync(join(opcoes.saida, 'assets', 'fontes', nome), buf);
  fontes[f] = nome;
}
const fontFace = (familia, ficheiro, estilo, pesos) => `@font-face{font-family:"${familia}";src:url("fontes/${fontes[ficheiro]}") format("woff2");font-style:${estilo};font-weight:${pesos};font-display:swap}`;
const cssFontes = [
  fontFace('Source Serif 4', 'source-serif-4-normal-pt.woff2', 'normal', '300 600'),
  fontFace('Source Serif 4', 'source-serif-4-italic-pt.woff2', 'italic', '300 600'),
  fontFace('Albert Sans', 'albert-sans-normal-pt.woff2', 'normal', '100 900'),
  fontFace('Albert Sans', 'albert-sans-italic-pt.woff2', 'italic', '100 900'),
].join('\n');

const css = cssFontes + '\n' + readFileSync(join(RAIZ, 'src', 'estilos', 'site.css'), 'utf8');
const js = readFileSync(join(RAIZ, 'src', 'scripts', 'site.js'), 'utf8');
const assets = {
  css: `site-${resumo(css)}.css`,
  js: `site-${resumo(js)}.js`,
  fonteTitulos: fontes['source-serif-4-normal-pt.woff2'],
  fonteTexto: fontes['albert-sans-normal-pt.woff2'],
};
writeFileSync(join(opcoes.saida, 'assets', assets.css), css);
writeFileSync(join(opcoes.saida, 'assets', assets.js), js);

// ---- páginas ----
const ctx = criarContexto({ base: opcoes.base, url: opcoes.url.replace(/\/$/, ''), manifesto, fotos });
// o url absoluto já inclui a base (ex.: https://renatovalente5.github.io/md-decoracao); abs() recebe o caminho sem a base
Object.assign(ctx, { site, servicos, trabalhos, opcoes, assets });
ctx.partilhaMarca = partilhaMarca(ctx);

const lista = [...trabalhos].sort((a, b) => a.destaque - b.destaque);
const paginas = [
  P.inicio(ctx),
  P.servicosLista(ctx),
  ...servicos.map((s) => P.servico(ctx, s)),
  P.trabalhosLista(ctx),
  ...lista.map((t, i) => P.trabalho(ctx, t, i, lista)),
  P.sobre(ctx),
  P.contactos(ctx),
  P.privacidade(ctx),
  P.litigios(ctx),
  P.naoEncontrada(ctx),
];

const escrever = (caminho, html) => {
  const destino = caminho.endsWith('.html') ? join(opcoes.saida, caminho) : join(opcoes.saida, caminho, 'index.html');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html.normalize('NFC'));
};
for (const p of paginas) escrever(p.caminho, pagina(ctx, p));

// as outras propostas da página inicial (só para mostrar; as ligações levam ao site principal)
const outras = ['a', 'b', 'c'].filter((x) => x !== opcoes.proposta);
for (const letra of outras) {
  const c2 = Object.assign(Object.create(ctx), { opcoes: { ...opcoes, proposta: letra, preview: true } });
  const p = P.inicio(c2);
  escrever(`/propostas/${letra}/`, pagina(c2, { ...p, caminho: `/propostas/${letra}/`, indexar: false }));
}
escrever(`/propostas/${opcoes.proposta}/`, pagina(ctx, { ...paginas[0], caminho: `/propostas/${opcoes.proposta}/`, indexar: false }));

// ---- imagens e vídeos usados ----
let nImg = 0, nVid = 0;
for (const f of ctx.usados) {
  if (f.startsWith('video:')) {
    const n = f.slice(6);
    copyFileSync(join(RAIZ, 'media', 'videos', n), join(opcoes.saida, 'assets', 'video', n)); nVid++;
  } else {
    const origem = join(CACHE, f);
    if (!existsSync(origem)) throw new Error(`Falta na cache: ${f} (corre python3 scripts/imagens.py)`);
    copyFileSync(origem, join(opcoes.saida, 'assets', 'img', f)); nImg++;
  }
}

// ---- ícones, manifesto da app, robots, sitemap ----
const he = manifesto.marca.emblema.resumo;
copyFileSync(join(CACHE, `icone-${he}-32.png`), join(opcoes.saida, 'favicon.png'));
copyFileSync(join(CACHE, `icone-${he}-180.png`), join(opcoes.saida, 'apple-touch-icon.png'));
copyFileSync(join(CACHE, `icone-${he}-192.png`), join(opcoes.saida, 'icone-192.png'));
copyFileSync(join(CACHE, `icone-${he}-512.png`), join(opcoes.saida, 'icone-512.png'));
writeFileSync(join(opcoes.saida, 'site.webmanifest'), JSON.stringify({
  name: site.marca, short_name: site.marcaCurta, start_url: ctx.href('/'), display: 'browser',
  background_color: '#F6F2EB', theme_color: '#1C201F',
  icons: [{ src: ctx.href('/icone-192.png'), sizes: '192x192', type: 'image/png' }, { src: ctx.href('/icone-512.png'), sizes: '512x512', type: 'image/png' }],
}, null, 1));
writeFileSync(join(opcoes.saida, '.nojekyll'), '');
const indexaveis = paginas.filter((p) => p.indexar !== false && !p.legal);
if (opcoes.producao) {
  writeFileSync(join(opcoes.saida, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ctx.abs('/sitemap.xml')}\n`);
  writeFileSync(join(opcoes.saida, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexaveis.map((p) => `  <url><loc>${ctx.abs(p.caminho)}</loc></url>`).join('\n')}\n</urlset>\n`);
} else {
  // pré-visualização: as páginas levam noindex; o robots deixa ler (para o Google ver o noindex)
  writeFileSync(join(opcoes.saida, 'robots.txt'), 'User-agent: *\nAllow: /\n');
}

console.log(`${paginas.length} páginas + ${outras.length + 1} propostas, ${nImg} imagens, ${nVid} vídeos → ${opcoes.saida} (proposta ${opcoes.proposta}${opcoes.producao ? ', produção' : ', pré-visualização noindex'})`);
