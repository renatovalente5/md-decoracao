/* MD Decoração de Interiores — o comportamento do site (sem bibliotecas). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
  const poupar = navigator.connection && navigator.connection.saveData;

  /* ---------- cabeçalho: um fio por baixo quando a página desce ---------- */
  const topo = $('[data-topo]');
  if (topo) {
    const marcar = () => topo.classList.toggle('com-sombra', scrollY > 4);
    addEventListener('scroll', marcar, { passive: true });
    marcar();
  }

  /* ---------- menu de ecrã inteiro (telemóvel) ---------- */
  const menu = $('[data-menu]');
  const abrir = $('[data-menu-abrir]');
  if (menu && abrir) {
    const fechar = () => { if (menu.open) menu.close(); };
    abrir.addEventListener('click', () => { menu.showModal(); abrir.setAttribute('aria-expanded', 'true'); });
    menu.addEventListener('close', () => { abrir.setAttribute('aria-expanded', 'false'); abrir.focus({ preventScroll: true }); });
    $('[data-menu-fechar]', menu)?.addEventListener('click', fechar);
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(); if (e.target === menu) fechar(); });
    matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) fechar(); });
    addEventListener('pageshow', (e) => { if (e.persisted) fechar(); });
  }

  /* ---------- vídeos: carregam perto do ecrã, tocam quando se vêem, param quando saem ---------- */
  const videos = $$('[data-video]');
  const pausadoPelaPessoa = new WeakSet();
  const rotulo = (bloco, aTocar) => {
    const b = $('[data-video-botao]', bloco); const r = $('[data-video-rotulo]', bloco);
    b.setAttribute('aria-pressed', aTocar ? 'false' : 'true');
    r.textContent = aTocar ? 'Pausar o vídeo' : 'Ver o vídeo';
  };
  const carregar = (v) => { if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.preload = 'auto'; } };
  const tocar = (bloco) => {
    const v = $('video', bloco); carregar(v);
    const p = v.play();
    if (p && p.then) p.then(() => { bloco.classList.add('a-tocar', 'tocou'); rotulo(bloco, true); }).catch(() => rotulo(bloco, false));
  };
  const parar = (bloco) => { const v = $('video', bloco); if (!v.paused) v.pause(); bloco.classList.remove('a-tocar'); rotulo(bloco, false); };
  const automatico = () => !menosMovimento.matches && !poupar;
  for (const bloco of videos) {
    const v = $('video', bloco);
    bloco.classList.add('pronto');
    if (!automatico()) rotulo(bloco, false);
    $('[data-video-botao]', bloco).addEventListener('click', () => {
      if (v.paused) { pausadoPelaPessoa.delete(bloco); tocar(bloco); }
      else { pausadoPelaPessoa.add(bloco); parar(bloco); }
    });
    v.addEventListener('playing', () => bloco.classList.add('a-tocar', 'tocou'));
  }
  if (videos.length && 'IntersectionObserver' in window) {
    const perto = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && automatico()) carregar($('video', e.target)); }), { rootMargin: '600px 0px' });
    const visto = new IntersectionObserver((es) => es.forEach((e) => {
      const bloco = e.target;
      if (e.intersectionRatio >= 0.35) { if (automatico() && !pausadoPelaPessoa.has(bloco)) tocar(bloco); }
      else if (!e.isIntersecting || e.intersectionRatio < 0.05) { const v = $('video', bloco); if (!v.paused) { v.pause(); bloco.classList.remove('a-tocar'); } }
    }), { threshold: [0, 0.05, 0.35, 0.6] });
    videos.forEach((b) => { perto.observe(b); visto.observe(b); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach((b) => { const v = $('video', b); if (!v.paused) v.pause(); }); });
  }

  /* ---------- entrar ao descer: só o que está abaixo do primeiro ecrã ---------- */
  if (!menosMovimento.matches && 'IntersectionObserver' in window) {
    const ALVOS = '.seccao__cabeca, .cartao-servico, .cartao-trabalho, .pormenor, .antes-depois, .sobre-curto, .garantia, .item, .linha-servico, .galeria__item, .pergunta, .factos li, .pedido, .contactos__diretos, .fila-servicos';
    const h = innerHeight;
    const alvos = $$(ALVOS).filter((el) => {
      if (el.parentElement.closest(ALVOS)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top >= h;
    });
    // uma fila que desliza de lado entra inteira (os cartões fora do ecrã nunca se cruzariam)
    const io = new IntersectionObserver((es) => {
      let n = 0;
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.style.setProperty('--d', `${Math.min(n++, 5) * 0.08}s`);
        el.classList.add('visivel');
        io.unobserve(el);
        el.addEventListener('animationend', () => { el.classList.remove('revelar', 'visivel'); el.style.removeProperty('--d'); }, { once: true });
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    alvos.forEach((el) => { el.classList.add('revelar'); io.observe(el); });
  }

  /* ---------- separadores (antes e depois na página inicial) ---------- */
  for (const grupo of $$('[data-separadores]')) {
    const tabs = $$('[role="tab"]', grupo);
    const escolher = (t, foco) => {
      tabs.forEach((x) => { const sel = x === t; x.setAttribute('aria-selected', String(sel)); x.tabIndex = sel ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !sel; });
      if (foco) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => escolher(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); escolher(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  }

  /* ---------- antes e depois: a régua ---------- */
  for (const fig of $$('[data-antes-depois]')) {
    const palco = $('.antes-depois__palco', fig);
    const regua = $('.antes-depois__regua', fig);
    const pos = () => palco.style.setProperty('--pos', regua.value + '%');
    regua.addEventListener('input', pos);
    pos();
  }

  /* ---------- visor das fotografias ---------- */
  const visor = $('[data-lightbox]');
  if (visor) {
    const palco = $('[data-lightbox-palco]', visor);
    const legenda = $('[data-lightbox-legenda]', visor);
    let lista = [], atual = 0;
    const mostrar = (i) => {
      atual = (i + lista.length) % lista.length;
      const pic = lista[atual].querySelector('picture').cloneNode(true);
      pic.querySelectorAll('source').forEach((s) => s.setAttribute('sizes', '100vw'));
      const img = pic.querySelector('img');
      img.removeAttribute('loading'); img.removeAttribute('style'); img.setAttribute('sizes', '100vw');
      palco.replaceChildren(pic);
      legenda.textContent = img.alt + (lista.length > 1 ? ` (${atual + 1} de ${lista.length})` : '');
    };
    $$('[data-galeria]').forEach((g) => {
      const botoes = $$('[data-ampliar]', g);
      botoes.forEach((b, i) => b.addEventListener('click', () => { lista = botoes; mostrar(i); visor.showModal(); }));
    });
    $('[data-lightbox-fechar]', visor).addEventListener('click', () => visor.close());
    $('[data-lightbox-ant]', visor).addEventListener('click', () => mostrar(atual - 1));
    $('[data-lightbox-seg]', visor).addEventListener('click', () => mostrar(atual + 1));
    visor.addEventListener('click', (e) => { if (e.target === visor || e.target === palco) visor.close(); });
    visor.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') mostrar(atual + 1); if (e.key === 'ArrowLeft') mostrar(atual - 1); });
    let x0 = null;
    visor.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    visor.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1)); x0 = null; });
    visor.addEventListener('close', () => { if (lista[atual]) lista[atual].focus({ preventScroll: true }); });
  }

  /* ---------- filtro dos trabalhos (fica no sítio, sem recarregar) ---------- */
  const filtro = $('[data-filtro]');
  if (filtro) {
    const botoes = $$('[data-filtro-servico]', filtro);
    const cartoes = $$('.cartao-trabalho', filtro);
    const contagem = $('[data-filtro-contagem]', filtro);
    const aplicar = (slug, escreverUrl) => {
      let n = 0;
      cartoes.forEach((c) => { const ok = !slug || c.dataset.servicos.split(' ').includes(slug); c.hidden = !ok; if (ok) n++; });
      botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtroServico === slug)));
      contagem.textContent = `${n} ${n === 1 ? 'trabalho' : 'trabalhos'}`;
      if (escreverUrl) { const u = new URL(location.href); if (slug) u.searchParams.set('servico', slug); else u.searchParams.delete('servico'); history.replaceState(null, '', u); }
    };
    botoes.forEach((b) => b.addEventListener('click', () => aplicar(b.dataset.filtroServico, true)));
    const inicial = new URLSearchParams(location.search).get('servico') || '';
    if (botoes.some((b) => b.dataset.filtroServico === inicial)) aplicar(inicial, false);
  }

  /* ---------- pedido de orçamento: abre o WhatsApp ou o email com a mensagem escrita ---------- */
  const pedido = $('[data-pedido]');
  if (pedido) {
    const q = new URLSearchParams(location.search);
    const slug = q.get('servico');
    if (slug) { const c = $(`input[data-slug="${CSS.escape(slug)}"]`, pedido); if (c) c.checked = true; }
    const ref = q.get('ref');
    const msg = $('textarea[name="mensagem"]', pedido);
    if (ref && msg && !msg.value) msg.value = `Vi o trabalho «${ref}» no site e gostava de algo parecido.`;
    const nome = $('input[name="nome"]', pedido);
    const erro = $('#p-nome-erro', pedido);
    nome.addEventListener('input', () => { if (nome.value.trim()) { nome.removeAttribute('aria-invalid'); nome.removeAttribute('aria-describedby'); erro.hidden = true; } });
    pedido.addEventListener('submit', (e) => {
      e.preventDefault();
      const canal = e.submitter && e.submitter.value || 'email';
      if (!nome.value.trim()) {
        nome.setAttribute('aria-invalid', 'true'); nome.setAttribute('aria-describedby', 'p-nome-erro'); erro.hidden = false; nome.focus();
        return;
      }
      const servicos = $$('input[name="servico"]:checked', pedido).map((c) => c.value);
      const concelho = $('select[name="concelho"]', pedido).value;
      const linhas = [
        'Olá! Gostava de pedir um orçamento.',
        servicos.length ? `Preciso de: ${servicos.join(', ')}.` : '',
        concelho ? `Zona: ${concelho}.` : '',
        msg.value.trim() ? msg.value.trim() : '',
        `O meu nome é ${nome.value.trim()}.`,
      ].filter(Boolean);
      const texto = linhas.join('\n');
      if (canal === 'whatsapp' && pedido.dataset.whatsapp) {
        location.href = `https://wa.me/${pedido.dataset.whatsapp}?text=${encodeURIComponent(texto)}`;
      } else {
        const assunto = `Pedido de orçamento${servicos.length ? ' — ' + servicos.join(', ') : ''}`;
        location.href = `mailto:${pedido.dataset.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
      }
    });
  }
})();
