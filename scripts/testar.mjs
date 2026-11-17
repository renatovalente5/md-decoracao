#!/usr/bin/env node
// Provas do site construído (_site): cada página com título, descrição, um h1, canonical e og:image que existe;
// ligações internas e ficheiros referidos existem; legais com noindex; sem marcadores por resolver.
//   node scripts/testar.mjs [--base=/md-decoracao]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(RAIZ, '_site');
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=').slice(7).replace(/\/$/, '');
const paginas = [];
(function andar(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'assets') andar(p); } else if (f.endsWith('.html')) paginas.push(p); } })(SITE);

let ok = 0; const falhas = [];
const prova = (cond, msg) => { if (cond) ok++; else falhas.push(msg); };
const existe = (url) => {
  let caminho = url.split('#')[0].split('?')[0];
  if (base && caminho.startsWith(base)) caminho = caminho.slice(base.length);
  if (!caminho.startsWith('/')) return true;
  const f = join(SITE, decodeURIComponent(caminho));
  return existsSync(f) && (statSync(f).isFile() || existsSync(join(f, 'index.html')));
};

for (const p of paginas) {
  const rel = p.slice(SITE.length);
  const html = readFileSync(p, 'utf8');
  const legal = /\/(privacidade|litigios)\/|404\.html|\/propostas\//.test(rel);
  prova(/<title>[^<]{10,}<\/title>/.test(html), `${rel}: sem <title>`);
  prova(/<meta name="description" content="[^"]{40,}">/.test(html), `${rel}: descrição em falta ou curta`);
  prova((html.match(/<h1[\s>]/g) || []).length === 1, `${rel}: não tem exatamente um h1`);
  prova(/<html lang="pt-PT"/.test(html), `${rel}: língua`);
  prova(/<link rel="canonical" href="https?:\/\//.test(html), `${rel}: canonical`);
  prova(!/\{\{|\}\}|undefined|NaN|\[object Object\]/.test(html.replace(/<(script|style)[\s\S]*?<\/(script|style)>/g, '')), `${rel}: texto por resolver (undefined, {{ }})`);
  if (legal) prova(html.includes('<meta name="robots" content="noindex">'), `${rel}: legal sem noindex`);
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  prova(og && existe(new URL(og).pathname), `${rel}: og:image em falta (${og})`);
  for (const m of html.matchAll(/(?:href|src|poster|data-src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
    prova(existe(u), `${rel}: ligação partida ${u}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const parte of m[1].split(',')) { const u = parte.trim().split(' ')[0]; prova(existe(u), `${rel}: imagem em falta ${u}`); }
  prova(html.includes('livroreclamacoes.pt'), `${rel}: sem o Livro de Reclamações no rodapé`);
  prova(/\(Chamada para a rede móvel nacional\)/.test(html), `${rel}: telefone sem a nota da chamada`);
}
// o rodapé só com «© ano Marca» (sem NIF nem morada)
const inicio = readFileSync(join(SITE, 'index.html'), 'utf8');
prova(/<p>© \d{4} MD Decoração de Interiores<\/p>/.test(inicio), 'rodapé: linha do © diferente de «© ano Marca»');
prova(!/como funciona|do pedido à entrega/i.test(inicio), 'página inicial: secção de passos (regra do Renato)');
prova(inicio.includes('"@type":"HomeAndConstructionBusiness"'), 'página inicial: dados estruturados do negócio');

console.log(`${paginas.length} páginas, ${ok} provas certas, ${falhas.length} falhas.`);
if (falhas.length) { console.log(falhas.slice(0, 40).join('\n')); process.exit(1); }
