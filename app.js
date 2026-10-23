'use strict';
/* Penseira — dados ficam no aparelho (localStorage). Sem servidor, sem conta. */

const KEY = 'penseira:v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const diffDays = (k) => Math.round((parseKey(k) - parseKey(dkey())) / 864e5);
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

/* ---------- ícones: desenhados em art.js ---------- */
const ic = (n) => Art.ic({ more: 'mais3', search: 'lupa', plus: 'mais' }[n] || n);

/* ---------- dados ---------- */
const CATS = {
  fazer: { label: 'Fazer' },
  ideia: { label: 'Ideia' },
  pergunta: { label: 'Dúvida' },
  lembrar: { label: 'Lembrar' },
  frase: { label: 'Frase' },
  reflexao: { label: 'Reflexão' },
};

function defaults() {
  return {
    v: 1,
    phrases: [
      { id: uid(), text: 'Uma coisa de cada vez. A próxima ação é a única que importa agora.', author: '', fav: false },
      { id: uid(), text: 'Feito é melhor que perfeito.', author: '', fav: false },
      { id: uid(), text: 'Respira. Qual é o passo mais simples agora?', author: '', fav: false },
      { id: uid(), text: 'O que está na lista não precisa ficar na cabeça. A cabeça é para pensar.', author: '', fav: false },
    ],
    areas: [
      { id: 'a1', name: 'Trabalho' },
      { id: 'a2', name: 'Projetos' },
    ],
    tasks: [], events: [],
    goals: [
      { id: uid(), text: 'Revisar minhas prioridades do dia', days: [] },
      { id: uid(), text: 'Beber água', days: [] },
    ],
    thoughts: [
      { id: uid(), text: 'Use Registrar ou o microfone para soltar um pensamento aqui. Ele é classificado sozinho. #exemplo', cat: 'ideia', tags: ['exemplo'], pinned: true, done: false, created: Date.now() - 60000 },
      { id: uid(), text: 'Por que adio justo o que mais importa?', cat: 'pergunta', tags: [], pinned: false, done: false, created: Date.now() - 3 * 3600e3 },
      { id: uid(), text: 'Não esquecer de ligar para a minha mãe', cat: 'lembrar', tags: [], pinned: false, done: false, created: Date.now() - 5 * 3600e3 },
      { id: uid(), text: 'Preciso enviar a proposta ainda hoje #trabalho', cat: 'fazer', tags: ['trabalho'], pinned: false, done: false, created: Date.now() - 8 * 3600e3 },
    ],
    current: null,
    settings: { remind: false, interval: 120, from: '08:00', to: '21:00', theme: 'dark', mode: 'penseira' },
  };
}
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.v === 1) return { ...defaults(), ...raw, settings: { ...defaults().settings, ...raw.settings } };
  } catch (e) { /* ignora */ }
  return defaults();
}
let state = load();
let saveFailed = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); saveFailed = false; }
  catch (e) { if (!saveFailed) toast('Não consegui salvar neste navegador. Exporte um backup.'); saveFailed = true; }
}
const areaOf = (id) => state.areas.find((a) => a.id === id);

/* ---------- classificação automática ---------- */
function classify(t) {
  const s = norm(t).trim();
  if (/^["“'«]/.test(t.trim()) || /\s[—–]\s*\p{Lu}[\p{L}. ]+$/u.test(t.trim())) return 'frase';
  if (/\?\s*$/.test(s) || /^(por que|porque|como|quando|onde|quem|sera|qual|quais)\b/.test(s)) return 'pergunta';
  if (/\b(nao esquecer|lembrar|lembrete|recordar|nao posso esquecer)\b/.test(s)) return 'lembrar';
  if (/^(preciso|tenho que|tenho de|devo|fazer|ligar|enviar|mandar|comprar|marcar|pagar|agendar|resolver|revisar|terminar|conversar|falar com|responder|checar|verificar|pedir|cobrar|organizar)/.test(s)) return 'fazer';
  if (/\b(ideia|e se|que tal|poderia|podemos|imagina|projeto|conceito|testar|criar)\b/.test(s)) return 'ideia';
  return 'reflexao';
}
const tagsOf = (t) => [...String(t).matchAll(/(^|\s)#([\p{L}\d_-]+)/gu)].map((m) => norm(m[2]));
const fmtText = (t) => esc(t).replace(/(^|\s)#([\p{L}\d_-]+)/gu, '$1<i>#$2</i>');
function areaFromTags(tags) {
  return state.areas.find((a) => tags.includes(norm(a.name)) || tags.includes(norm(a.name).split(/\s+/)[0]));
}

function addThought(text, cat) {
  text = text.trim();
  if (!text) return null;
  const t = { id: uid(), text, cat: cat || classify(text), tags: tagsOf(text), pinned: false, done: false, created: Date.now() };
  state.thoughts.unshift(t);
  save();
  return t;
}

const liveThoughts = () => state.thoughts.filter((t) => !t.done);

/* ---------- datas ---------- */
function relDate(k) {
  const n = diffDays(k);
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  if (n === -1) return 'Ontem';
  if (n < 0) return `${-n}d atrás`;
  if (n < 7) return parseKey(k).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return parseKey(k).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
const dueCls = (k) => (diffDays(k) < 0 ? 'late' : diffDays(k) === 0 ? 'today' : '');

/* ---------- frase do momento ---------- */
function pickPhrase(manual) {
  const list = state.phrases;
  if (!list.length) { state.current = null; return; }
  const pool = [];
  list.forEach((p) => { if (p.id !== state.current?.id || list.length === 1) { pool.push(p); if (p.fav) pool.push(p, p); } });
  const p = pool[Math.floor(Math.random() * pool.length)];
  state.current = { id: p.id, at: Date.now() };
  save();
  return p;
}
const currentPhrase = () => state.phrases.find((p) => p.id === state.current?.id);

/* ---------- metas ---------- */
const goalDone = (g, k = dkey()) => g.days.includes(k);
function streak(g) {
  let k = dkey();
  if (!goalDone(g, k)) k = addDays(k, -1);
  let n = 0;
  while (goalDone(g, k)) { n++; k = addDays(k, -1); }
  return n;
}

/* ---------- agenda ---------- */
function agendaItems() {
  const ev = state.events.map((e) => ({ kind: 'event', id: e.id, title: e.title, date: e.date, time: e.time || '', done: e.done }));
  const tk = state.tasks.filter((t) => t.due).map((t) => ({ kind: 'task', id: t.id, title: t.text, date: t.due, time: '', done: t.done, area: areaOf(t.areaId) }));
  return [...ev, ...tk].sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')));
}

/* ---------- views ---------- */
const VIEWS = [
  ['hoje', 'Hoje', 'hoje'], ['penseira', 'Penseira', 'penseira'], ['frentes', 'Frentes', 'frentes'],
  ['agenda', 'Agenda', 'agenda'], ['frases', 'Frases', 'frases'], ['ajustes', 'Ajustes', 'ajustes'],
];
const BAR = ['hoje', 'penseira', 'frentes', 'agenda', 'frases']; // barra inferior no celular; Ajustes fica no topo
let view = 'hoje';
const ui = { tf: 'todas', q: '', book: null };

const HUE = { fazer: 152, ideia: 42, pergunta: 190, lembrar: 335, frase: 262, reflexao: 218 };
const fmtDay = (k) => parseKey(k).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const clean = (t) => t.replace(/(^|\s)#[\p{L}\d_-]+/gu, ' ').replace(/\s+/g, ' ').trim() || t;
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}
const empty = (msg) => `<p class="void">${msg}</p>`;
const isNarrow = () => innerWidth < 720;
const frame = (cls, html) => `<section class="frame ${cls}">${Art.corners()}${html}</section>`;
const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/* ----- a Penseira: bacia, esferas de memória e fios de luz ----- */
function layoutOrbs(items, sizes, W, H) {
  const pts = items.map((t, i) => { const h = hash(t.id); return { x: W * (0.1 + 0.8 * ((h % 997) / 997)), y: H * (0.1 + 0.62 * (((h >> 8) % 991) / 991)), rx: sizes[i] / 2 + 38, ry: sizes[i] / 2 + 34, s: sizes[i] }; });
  for (let k = 0; k < 120; k++) {
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      if (!dx && !dy) { dx = 1; dy = 0.5; }
      const sx = a.rx + b.rx, sy = a.ry + b.ry, d = Math.hypot(dx / sx, dy / sy);
      if (d < 1) { const m = (1 - d) * 0.5; a.x -= (dx / sx) * sx * m; a.y -= (dy / sy) * sy * m; b.x += (dx / sx) * sx * m; b.y += (dy / sy) * sy * m; }
    }
    for (const p of pts) { p.x = Math.max(p.s / 2 + 8, Math.min(W - p.s / 2 - 8, p.x)); p.y = Math.max(p.s / 2 + 6, Math.min(H - p.s / 2 - 34, p.y)); }
  }
  return pts.map((p) => ({ x: (p.x / W) * 100, y: (p.y / H) * 100 }));
}
function orbHtml(t, p, s) {
  const c = HUE[t.cat] ? t.cat : 'reflexao';
  return `<button class="orb ${t.pinned ? 'pin' : ''} ${Date.now() - t.created < 5000 ? 'fresh' : ''}" data-act="thought" data-id="${t.id}" aria-label="Memória: ${esc(trunc(clean(t.text), 90))}"
    style="--x:${p.x.toFixed(2)};--y:${p.y.toFixed(2)};--s:${s}px;--h:${HUE[c]};--dur:${7 + (hash(t.id) % 5)}s;--dl:-${hash(t.id) % 9}s">
    <span class="o-glass"></span><span class="o-mist"></span>${Art.catSig(c)}<span class="o-cap">${esc(trunc(clean(t.text), 40))}</span></button>`;
}
function stage(list, mini) {
  const narrow = isNarrow();
  const SH = mini ? (narrow ? 440 : 500) : narrow ? 560 : 660;
  const W = Math.max(280, Math.min(document.documentElement.clientWidth - (innerWidth >= 900 ? 260 : 32), 1180) - (mini ? 56 : 0));
  const max = mini ? (narrow ? 5 : 7) : narrow ? 8 : 15;
  const vis = [...list.filter((t) => t.pinned), ...list.filter((t) => !t.pinned)].slice(0, max);
  const sizes = vis.map((t, i) => (t.pinned ? 104 : i < 4 ? 92 : 80) * (mini || narrow ? 0.9 : 1));
  const bw0 = Math.min(W * 0.94, 760);
  const OH = Math.round(SH - (bw0 / 3) * 0.9 - 26);
  const pos = layoutOrbs(vis, sizes, W, OH);
  const bw = Math.min(W * 0.94, 760), bh = bw / 3, sy = ((SH - bh * 0.58) / SH) * 100;
  const threads = vis.map((t, i) => {
    const ox = pos[i].x, oy = ((pos[i].y / 100) * OH + sizes[i] / 2) / SH * 100;
    return `<path d="M50 ${sy.toFixed(1)} Q ${((50 + ox) / 2 + (hash(t.id) % 9) - 4).toFixed(1)} ${((sy + oy) / 2).toFixed(1)} ${ox.toFixed(1)} ${oy.toFixed(1)}" style="--dl:-${hash(t.id) % 7}s"/>`;
  }).join('');
  return `<div class="stage ${mini ? 'mini' : ''}" style="--sh:${SH}px;--oh:${OH}px;--bw:${Math.round(bw)}px">
    <div class="rays" aria-hidden="true"></div>
    <svg class="threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${threads}</svg>
    <div class="orbs">${vis.map((t, i) => orbHtml(t, pos[i], sizes[i])).join('')}</div>
    <div class="basin basin-target"><div class="halo" aria-hidden="true"></div>${Art.basin()}<span class="mist-up m1"></span><span class="mist-up m2"></span><span class="mist-up m3"></span></div>
    ${vis.length ? '' : '<p class="stage-empty">A Penseira está vazia.<br>Puxe um pensamento da mente e solte aqui.</p>'}
  </div>`;
}
const composer = () => `<form class="composer" data-form="quick">
  <span class="thread-ic" aria-hidden="true">${Art.ic('penseira')}</span>
  <input name="text" placeholder="Solte um pensamento…" autocomplete="off" aria-label="Novo pensamento">
  <button type="button" class="orb-btn" data-act="dictate" aria-label="Sussurrar um pensamento">${Art.ic('mic')}</button>
  <button class="gild">Guardar</button></form>`;

/* ----- linhas de lista ----- */
function memoryRow(t) {
  const c = HUE[t.cat] ? t.cat : 'reflexao';
  return `<button class="srow" data-act="thought" data-id="${t.id}" style="--h:${HUE[c]}">
    <span class="gem" aria-hidden="true">${Art.catSig(c)}</span>
    <span class="rc-main"><span class="rc-t">${fmtText(t.text)}</span><span class="rc-m">${CATS[c].label}${t.pinned ? ' · fixada' : ''} · ${ago(t.created)}</span></span>
    ${t.pinned ? `<span class="pin-star" aria-label="Fixada">${Art.ic('estrela')}</span>` : ''}</button>`;
}
function taskLine(t, showArea) {
  const a = showArea ? areaOf(t.areaId) : null;
  return `<div class="tl ${t.done ? 'done' : ''}">
    <button class="ck" data-act="taskToggle" data-id="${t.id}" aria-label="${t.done ? 'Reabrir' : 'Concluir'}: ${esc(t.text)}">${Art.ic('check')}</button>
    <button class="t" data-act="taskEdit" data-id="${t.id}">${esc(t.text)}${a ? ` <span class="faint">· ${esc(a.name)}</span>` : ''}</button>
    ${t.due && !t.done ? `<span class="due ${dueCls(t.due)}">${relDate(t.due)}</span>` : ''}
    <button class="star ${t.star ? 'on' : ''}" data-act="taskStar" data-id="${t.id}" aria-label="${t.star ? 'Tirar a marca' : 'Marcar como prioridade'}" aria-pressed="${!!t.star}">${Art.ic('estrela')}</button>
  </div>`;
}
function agendaRow(it) {
  return `<div class="ev-row ${it.done ? 'done' : ''}">
    <button class="ck" data-act="${it.kind}Toggle" data-id="${it.id}" aria-label="${it.done ? 'Reabrir' : 'Concluir'}: ${esc(it.title)}">${Art.ic('check')}</button>
    <button class="rc-main" data-act="${it.kind}Edit" data-id="${it.id}"><span class="rc-t">${esc(it.title)}</span><span class="rc-m">${Art.ic(it.kind === 'event' ? 'sino' : 'losango', 'mini')}${it.kind === 'event' ? 'Compromisso' : 'Tarefa'}${it.area ? ' · ' + esc(it.area.name) : ''}</span></button>
    <span class="when ${dueCls(it.date)}">${relDate(it.date)}${it.time ? `<small>${it.time}</small>` : ''}</span></div>`;
}

/* ----- o arco do dia: a lua viaja de um lado ao outro do céu ----- */
function dayArc() {
  const from = 6, to = 24, k = dkey(), now = new Date(), nowH = now.getHours() + now.getMinutes() / 60;
  const P = (h) => { const t = Math.max(0, Math.min(1, (h - from) / (to - from))), a = Math.PI * (1 - t); return [200 + Math.cos(a) * 165, 186 - Math.sin(a) * 148]; };
  const hm = (s) => { const [h, m] = s.split(':').map(Number); return h + m / 60; };
  const evs = state.events.filter((e) => e.date === k && e.time && !e.done).sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5);
  const ths = state.thoughts.filter((t) => dkey(new Date(t.created)) === k && new Date(t.created).getHours() >= from);
  const [mx, my] = P(nowH);
  const marks = [6, 12, 18, 24].map((h) => { const [x, y] = P(h); return `<text x="${x.toFixed(0)}" y="${h === 12 ? (y - 14).toFixed(0) : 206}" text-anchor="middle" class="ah">${pad(h % 24)}h</text>`; }).join('');
  const sparks = ths.map((t) => { const d = new Date(t.created), [x, y] = P(d.getHours() + d.getMinutes() / 60); return `<circle cx="${x.toFixed(1)}" cy="${(y + 9).toFixed(1)}" r="1.6" class="th"/>`; }).join('');
  const stars = evs.map((e, i) => { const [x, y] = P(hm(e.time)); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" class="evs"><path d="M0-8l2.2 4.6 5 .7-3.6 3.5.9 5L0 3.4l-4.5 2.4.9-5L-7.2-2.7l5-.7z"/><text y="${i % 2 ? 22 : -14}" text-anchor="middle">${esc(trunc(e.title, 13))}</text></g>`; }).join('');
  return `<svg class="arc" viewBox="0 0 400 214" role="img" aria-label="${plural(evs.length, 'compromisso', 'compromissos')} hoje; agora são ${pad(now.getHours())}:${pad(now.getMinutes())}">
    <path d="M35 186A165 148 0 0 1 365 186" class="track"/><path d="M20 186H380" class="horizon"/>${marks}${sparks}${stars}
    ${Art.moonSvg(Art.moonPhase(), 30, `x="${(mx - 15).toFixed(1)}" y="${(my - 15).toFixed(1)}"`, 'now-moon')}
  </svg>`;
}

function books(sel) {
  const tones = ['wine', 'emerald', 'sapphire', 'plum', 'bronze', 'teal'];
  return `<div class="books">${state.areas.map((a, i) => {
    const open = state.tasks.filter((t) => t.areaId === a.id && !t.done).length, h = hash(a.id);
    return `<button class="book ${tones[i % 6]} ${sel === a.id ? 'sel' : ''}" data-act="book" data-id="${a.id}" aria-label="Grimório ${esc(a.name)}: ${plural(open, 'página aberta', 'páginas abertas')}" style="--bh:${176 + (h % 5) * 9}px;--tilt:${((h % 7) - 3) * 0.35}deg">
      <span class="spine"><span class="band b1"></span><b>${esc(trunc(a.name, 16))}</b><span class="band b2"></span></span>${open ? `<span class="ribbon" aria-hidden="true">${open}</span>` : ''}</button>`;
  }).join('')}<button class="book new" data-act="areaAdd" aria-label="Novo grimório"><span class="spine"><b>+ nova frente</b></span></button></div><div class="board"></div>`;
}

/* ===== Hoje ===== */
function vHoje() {
  const k = dkey();
  const p = currentPhrase(), ph = Art.moonPhase();
  const goals = state.goals, doneN = goals.filter((g) => goalDone(g)).length;
  const live = liveThoughts();
  const stars = state.tasks.filter((t) => t.star && !t.done).slice(0, 3);
  const evsToday = state.events.filter((e) => e.date === k && !e.done).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const next = agendaItems().filter((i) => !i.done && diffDays(i.date) >= 0).slice(0, 3);
  const late = state.tasks.filter((t) => !t.done && t.due && diffDays(t.due) < 0).length;
  const lede = late ? `${plural(late, 'tarefa atrasada espera', 'tarefas atrasadas esperam')} por você` : evsToday.length ? `${plural(evsToday.length, 'compromisso', 'compromissos')} hoje` : 'Um dia livre para pensar';
  return `
  <header class="hero">
    <div class="greet">
      <div class="moon-wrap" title="${Art.moonName(ph)}">${Art.moonSvg(ph, 120)}</div>
      <div><h1 class="t-main">${greeting()}</h1><p class="sub">${fmtDay(k)}</p>
      <p class="sub moon-l">${Art.moonName(ph)} · ${Art.moonLit(ph)}% iluminada</p><p class="lede">${lede}</p></div>
    </div>
    ${frame('whisper', `<span class="lbl">Sussurro do momento</span>
      ${p ? `<blockquote>${esc(p.text)}</blockquote>${p.author ? `<cite>${esc(p.author)}</cite>` : ''}
      <div class="acts"><button class="ghost" data-act="phraseNext">Outro sussurro</button>
      <button class="sealbtn" data-act="phraseFav" data-id="${p.id}" aria-pressed="${!!p.fav}" aria-label="${p.fav ? 'Tirar o selo' : 'Selar esta frase'}">${Art.seal(!!p.fav)}<span>${p.fav ? 'Selada' : 'Selar'}</span></button></div>`
      : `<blockquote>Guarde aqui as frases que você precisa lembrar.</blockquote><div class="acts"><button class="ghost" data-act="phraseAdd">Escrever um pergaminho</button></div>`}`)}
  </header>

  ${frame('pensieve', `<div class="fh"><h2>A Penseira</h2><span class="faint">${plural(live.length, 'memória flutuando', 'memórias flutuando')}</span><span class="sp"></span><button class="ghost" data-act="go" data-view="penseira">Mergulhar</button></div>
    ${stage(live, true)}${composer()}`)}

  <div class="trio">
    ${frame('spells', `<div class="fh"><h2>Feitiços de hoje</h2></div>
      <div class="spell-wrap">${Art.spellCircle(goals, goalDone)}</div>
      ${goals.length ? goals.map((g, i) => `<div class="tl ${goalDone(g) ? 'done' : ''}"><button class="ck rn" data-act="goalToggle" data-id="${g.id}" aria-label="${goalDone(g) ? 'Desfazer' : 'Lançar'}: ${esc(g.text)}"><svg viewBox="-10 -10 20 20"><path d="${Art.rune(i)}"/></svg></button>
        <button class="t" data-act="goalEdit" data-id="${g.id}">${esc(g.text)}</button>${streak(g) > 1 ? `<span class="due">${streak(g)} dias seguidos</span>` : ''}</div>`).join('') : empty('Crie seu primeiro feitiço diário.')}
      <form class="addrow" data-form="goalAdd"><input class="in" name="text" placeholder="Um novo feitiço diário" autocomplete="off" aria-label="Novo feitiço diário"><button class="ghost">Criar</button></form>`)}
    ${frame('arcbox', `<div class="fh"><h2>O arco do dia</h2></div>${dayArc()}
      ${next.length ? next.map(agendaRow).join('') : empty('Nada marcado no céu de hoje.')}
      <div class="foot"><button class="link" data-act="go" data-view="agenda">Abrir a agenda</button></div>`)}
    ${frame('shelfbox', `<div class="fh"><h2>Grimórios</h2></div>${books(null)}
      ${stars.length ? `<h3 class="mini-h">Páginas marcadas</h3>${stars.map((t) => taskLine(t, true)).join('')}` : ''}`)}
  </div>`;
}

/* ===== Penseira ===== */
function vPenseira() {
  const live = liveThoughts();
  const q = norm(ui.q);
  const mode = state.settings.mode || 'penseira';
  const allTags = [...new Set(live.flatMap((t) => t.tags))].sort();
  let list = state.thoughts.filter((t) => (ui.tf === 'resolvidos' ? t.done : !t.done));
  if (CATS[ui.tf]) list = list.filter((t) => t.cat === ui.tf);
  else if (ui.tf.startsWith('#')) list = list.filter((t) => t.tags.includes(ui.tf.slice(1)));
  if (q) list = list.filter((t) => norm(t.text).includes(q));
  list.sort((a, b) => b.pinned - a.pinned || b.created - a.created);
  const count = (c) => live.filter((t) => t.cat === c).length;
  const nFazer = count('fazer');
  const resolved = state.thoughts.filter((t) => t.done).length;
  const gem = (id, label, n, h) => `<button class="gemchip ${ui.tf === id ? 'on' : ''}" ${h != null ? `style="--h:${h}"` : ''} data-act="filter" data-f="${id}"><i></i>${esc(label)}<b>${n}</b></button>`;
  const chips = [gem('todas', 'Todas', live.length), ...Object.entries(CATS).filter(([c]) => count(c) || ui.tf === c).map(([c, v]) => gem(c, v.label, count(c), HUE[c])), ...allTags.map((g) => gem('#' + g, '#' + g, live.filter((t) => t.tags.includes(g)).length)), ...(resolved ? [gem('resolvidos', 'Resolvidas', resolved)] : [])].join('');
  const modes = [['penseira', 'Penseira'], ['frascos', 'Frascos'], ['lista', 'Lista']].map(([m, l]) => `<button class="seg ${mode === m ? 'on' : ''}" data-act="mode" data-m="${m}" aria-pressed="${mode === m}">${l}</button>`).join('');
  let body;
  if (mode === 'penseira') body = frame('pensieve big', `${stage(list.filter((t) => !t.done || ui.tf === 'resolvidos'), false)}${composer()}${list.length > (isNarrow() ? 8 : 15) ? `<p class="more">Só as ${isNarrow() ? 8 : 15} memórias mais recentes flutuam aqui. Veja todas em <button class="link" data-act="mode" data-m="lista">Lista</button>.</p>` : ''}`);
  else if (mode === 'frascos') {
    const mx = Math.max(1, ...Object.keys(CATS).map(count));
    body = frame('vials-box', `<div class="vials">${Object.entries(CATS).map(([c, v]) => `<button class="vialbtn ${ui.tf === c ? 'on' : ''}" data-act="filter" data-f="${c}" aria-label="${v.label}: ${plural(count(c), 'memória', 'memórias')}">${Art.vial(HUE[c], count(c) / mx, v.label, count(c), ui.tf === c)}<span class="tag">${v.label}<b>${count(c)}</b></span></button>`).join('')}</div><div class="board"></div>`) +
      frame('listbox', `<div class="fh"><h2>${CATS[ui.tf] ? CATS[ui.tf].label : 'Todas as memórias'}</h2><span class="sp"></span>${ui.tf !== 'todas' ? '<button class="ghost" data-act="filter" data-f="todas">Ver todas</button>' : ''}</div>${list.length ? list.map(memoryRow).join('') : empty('Este frasco está vazio.')}`);
  } else body = frame('listbox', `${composer()}${list.length ? list.map(memoryRow).join('') : empty(state.thoughts.length ? 'Nenhuma memória com esse filtro.' : 'Solte um pensamento acima.')}`);
  return `
  <header class="hd"><div><h1 class="t-main">Penseira</h1><p class="sub">${plural(live.length, 'memória flutuando', 'memórias flutuando')}${nFazer ? ` · ${nFazer} para fazer` : ''}${ui.q ? ` · busca por “${esc(ui.q)}”` : ''}</p></div>
    <div class="hd-r">${ui.q ? '<button class="ghost" data-act="clearSearch">Limpar busca</button>' : ''}${nFazer ? `<button class="ghost" data-act="organize">Transformar em tarefas (${nFazer})</button>` : ''}<div class="segs" role="group" aria-label="Modo de ver">${modes}</div></div></header>
  <input class="in m-only" data-input="gsearch" placeholder="Buscar nas memórias" value="${esc(ui.q)}" aria-label="Buscar nas memórias" style="margin-bottom:12px">
  <div class="gemrow" role="group" aria-label="Filtrar por categoria">${chips}</div>
  ${body}`;
}

/* ===== Frentes: grimórios ===== */
function vFrentes() {
  if (!areaOf(ui.book)) ui.book = state.areas[0]?.id || null;
  const a = areaOf(ui.book);
  const nOpen = state.tasks.filter((t) => !t.done).length;
  let spread = empty('Crie seu primeiro grimório para guardar uma frente de trabalho.');
  if (a) {
    const all = state.tasks.filter((t) => t.areaId === a.id);
    const open = all.filter((t) => !t.done).sort((x, y) => (y.star || 0) - (x.star || 0) || (x.due || '9').localeCompare(y.due || '9'));
    const done = all.filter((t) => t.done);
    const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;
    spread = `<div class="spread">
      <article class="page l">${Art.corners()}<div class="ph"><h2>${esc(a.name)}</h2><button class="ghost" data-act="areaEdit" data-id="${a.id}">Editar livro</button></div>
        <div class="prog" role="img" aria-label="${done.length} de ${all.length} páginas viradas"><span>${done.length} de ${all.length} páginas viradas</span><i><u style="width:${pct}%"></u></i></div>
        ${open.map((t) => taskLine(t)).join('') || empty('Nenhuma página aberta. O livro descansa.')}</article>
      <article class="page r">${Art.corners()}<h3 class="mini-h">Escrever uma nova página</h3>
        <form class="addrow" data-form="taskAdd" data-area="${a.id}"><input class="in" name="text" placeholder="O que precisa ser feito?" autocomplete="off" aria-label="Nova tarefa em ${esc(a.name)}"><button class="gild">Escrever</button></form>
        ${done.length ? `<h3 class="mini-h">Páginas viradas</h3>${done.slice(0, 12).map((t) => taskLine(t)).join('')}` : `<p class="side-note">Quando você concluir uma tarefa, a página vira e fica guardada aqui.</p>`}</article></div>`;
  }
  return `
  <header class="hd"><div><h1 class="t-main">Grimórios</h1><p class="sub">${plural(nOpen, 'página aberta', 'páginas abertas')} em ${plural(state.areas.length, 'frente', 'frentes')}</p></div></header>
  ${frame('shelfbox wide', books(ui.book))}${spread}`;
}

/* ===== Agenda ===== */
function vAgenda() {
  const items = agendaItems();
  const open = items.filter((i) => !i.done);
  const groups = [['Atrasados', (n) => n < 0], ['Hoje', (n) => n === 0], ['Amanhã', (n) => n === 1], ['Próximos 7 dias', (n) => n >= 2 && n <= 7], ['Depois', (n) => n > 7]];
  const done = items.filter((i) => i.done).slice(-10).reverse();
  const blocks = groups.map(([name, f]) => {
    const g = open.filter((i) => f(diffDays(i.date)));
    if (!g.length) return '';
    const d = parseKey(g[0].date);
    return frame('agbox', `<div class="fh">${Art.moonSvg(Art.moonPhase(d), 34)}<h2>${name}</h2><span class="faint">${plural(g.length, 'item', 'itens')}</span></div>${g.map(agendaRow).join('')}`);
  }).join('');
  return `
  <header class="hd"><div><h1 class="t-main">Agenda</h1><p class="sub">${plural(open.length, 'item pendente', 'itens pendentes')} · compromissos e prazos das frentes</p></div><div class="hd-r"><button class="gild" data-act="eventAdd">Novo compromisso</button></div></header>
  <div class="narrow stack">${blocks || frame('agbox', empty('O calendário está em branco. Marque um compromisso.'))}
  ${done.length ? frame('agbox', `<details><summary>Concluídos recentes</summary><div style="margin-top:12px">${done.map(agendaRow).join('')}</div></details>`) : ''}</div>`;
}

/* ===== Frases: pergaminhos ===== */
function vFrases() {
  return `
  <header class="hd"><div><h1 class="t-main">Pergaminhos</h1><p class="sub">${plural(state.phrases.length, 'frase guardada', 'frases guardadas')} para lembrar durante o dia</p></div><div class="hd-r"><button class="gild" data-act="phraseAdd">Novo pergaminho</button></div></header>
  <div class="scrolls">${state.phrases.map((p, i) => `<article class="scroll" style="--rot:${(i % 2 ? 1 : -1) * 0.35}deg">
    <div class="paper"><q>${esc(p.text)}</q>${p.author ? `<cite>${esc(p.author)}</cite>` : ''}</div>
    <div class="sc-acts"><button class="sealbtn" data-act="phraseFav" data-id="${p.id}" aria-pressed="${!!p.fav}" aria-label="${p.fav ? 'Tirar o selo' : 'Selar'}">${Art.seal(!!p.fav)}</button>
    <button class="quill" data-act="phraseEdit" data-id="${p.id}" aria-label="Editar pergaminho">${Art.ic('pena')}</button></div></article>`).join('') || frame('agbox', empty('Nenhum pergaminho ainda.'))}</div>`;
}

/* ===== Ajustes ===== */
let installEvt = null;
function vAjustes() {
  const s = state.settings;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const hint = perm === 'denied' ? 'Bloqueado no navegador. Libere nas permissões do site.' : perm === 'unsupported' ? 'Este navegador não suporta notificações.' : 'Chega com o app aberto ou em segundo plano.';
  return `
  <header class="hd"><div><h1 class="t-main">Ajustes</h1><p class="sub">Tudo fica guardado neste aparelho</p></div></header>
  <div class="narrow stack">
  ${frame('setbox', `<div class="fh"><h2>Sussurros ao longo do dia</h2></div>
    <div class="set-row"><div>Receber frases como notificação<small>${hint}</small></div>
      <button class="sw-t ${s.remind ? 'on' : ''}" data-act="remindToggle" role="switch" aria-checked="${!!s.remind}" aria-label="Notificar frases"></button></div>
    <div class="set-row"><label for="iv">Intervalo</label><select class="in" id="iv" data-set="interval">${[30, 60, 90, 120, 180, 240].map((m) => `<option value="${m}" ${s.interval === m ? 'selected' : ''}>${m < 60 ? m + ' min' : m % 60 ? (m / 60).toString().replace('.', ',') + ' h' : m / 60 + ' h'}</option>`).join('')}</select></div>
    <div class="set-row"><span>Horário</span><span class="row"><input class="in" type="time" value="${s.from}" data-set="from" aria-label="Das"><span class="faint">até</span><input class="in" type="time" value="${s.to}" data-set="to" aria-label="Até"></span></div>
    <div class="actions"><button class="ghost" data-act="testNotif">Testar notificação</button></div>
    <p class="side-note">Sem servidor, o aviso só chega se o app estiver aberto ou rodando em segundo plano. No iPhone, instale na Tela de Início primeiro.</p>`)}
  ${frame('setbox', `<div class="fh"><h2>Levar a Penseira com você</h2></div>
    <div class="set-row"><div>Instalar neste aparelho<small>Celular: menu do navegador, “Instalar app” ou “Adicionar à Tela de Início”. Computador: ícone de instalar na barra de endereço.</small></div>${installEvt ? '<button class="gild" data-act="install">Instalar</button>' : ''}</div>`)}
  ${frame('setbox', `<div class="fh"><h2>Seus dados</h2></div>
    <p class="muted" style="margin-bottom:12px">Para levar do celular ao computador, ou fazer um backup, exporte e importe o arquivo.</p>
    <div class="actions"><button class="ghost" data-act="export">Exportar backup</button><button class="ghost" data-act="import">Importar backup</button></div>
    <input type="file" id="file" accept="application/json,.json" class="hide">
    <p class="side-note">Importar substitui tudo o que está neste aparelho.</p>`)}
  ${frame('setbox', `<div class="fh"><h2>Esquecer tudo</h2></div>
    <p class="muted" style="margin-bottom:12px">Apaga pensamentos, tarefas, metas, compromissos e frases deste aparelho. Exporte um backup antes.</p>
    <button class="ghost danger" data-act="wipe">Apagar todos os dados</button>`)}
  </div>`;
}

const RENDER = { hoje: vHoje, penseira: vPenseira, frentes: vFrentes, agenda: vAgenda, frases: vFrases, ajustes: vAjustes };

function renderTop() {
  $('#top').innerHTML = `
    <div class="mark"><img src="icons/icon.svg" alt="">Penseira</div>
    <label class="search">${Art.ic('lupa')}<input data-input="gsearch" placeholder="Buscar nas memórias" value="${esc(ui.q)}" aria-label="Buscar nas memórias"></label>
    <span class="grow"></span>
    <button class="orb-btn" data-act="speak" aria-label="Sussurrar um pensamento" title="Sussurrar um pensamento">${Art.ic('mic')}</button>
    <button class="gild" data-act="capture">${Art.ic('pena')}<span>Registrar</span></button>
    <button class="orb-btn only-m" data-act="go" data-view="ajustes" aria-label="Ajustes">${Art.ic('ajustes')}</button>`;
}
function renderNav() {
  $('#side').innerHTML = `<div class="brand"><span class="emblem"><img src="icons/icon.svg" alt=""></span><b>Penseira</b></div><nav class="rail-nav" aria-label="Principal">` +
    VIEWS.map(([id, l, i]) => `<button class="nav ${view === id ? 'on' : ''}" data-act="go" data-view="${id}"${view === id ? ' aria-current="page"' : ''}><span class="sg">${Art.ic(i)}</span><span class="nl">${l}</span></button>`).join('') +
    `</nav><div class="sp"></div><div class="foot">${Art.moonSvg(Art.moonPhase(), 34)}<span>${Art.moonName(Art.moonPhase())}</span></div>`;
  $('#tabs').innerHTML = VIEWS.filter(([id]) => BAR.includes(id)).map(([id, l, i]) => `<button class="${view === id ? 'on' : ''}" data-act="go" data-view="${id}" aria-label="${l}"${view === id ? ' aria-current="page"' : ''}>${Art.ic(i)}<span>${l}</span></button>`).join('');
}
function render() {
  const v = $('#view');
  const y = window.scrollY;
  v.innerHTML = RENDER[view]();
  renderNav();
  document.title = view === 'hoje' ? 'Penseira' : `${VIEWS.find((x) => x[0] === view)[1]} · Penseira`;
  window.scrollTo(0, y);
}
function go(id) {
  if (!RENDER[id]) id = 'hoje';
  view = id;
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  const v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  render();
  window.scrollTo(0, 0);
}

/* ---------- sheet / toast ---------- */
const sheet = $('#sheet');
function openSheet(title, html, bind) {
  sheet.innerHTML = `<div class="scrim" data-act="closeSheet"></div><form class="panel-s" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div>${Art.corners()}<h2>${esc(title)}</h2>${Art.divider()}${html}</form>`;
  sheet.classList.add('open');
  document.body.classList.add('noscroll');
  const f = $('.panel-s', sheet);
  bind?.(f);
  setTimeout(() => $('[autofocus]', f)?.focus(), 30);
  return f;
}
function closeSheet() { stopDictation(); sheet.classList.remove('open'); sheet.innerHTML = ''; document.body.classList.remove('noscroll'); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
const fd = (form) => Object.fromEntries(new FormData(form));
const areaOpts = (sel) => state.areas.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
const catChips = (sel, withAuto) => `<div class="chips" data-cats>${withAuto ? `<button type="button" class="chip ${!sel ? 'on' : ''}" data-cat="">Auto</button>` : ''}${Object.entries(CATS).map(([c, v]) => `<button type="button" class="chip ${sel === c ? 'on' : ''}" data-cat="${c}">${v.label}</button>`).join('')}</div>`;
function bindCats(root, onPick) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    $$('[data-cat]', root).forEach((x) => x.classList.toggle('on', x === b));
    onPick(b.dataset.cat);
  });
}

/* ---------- ditado por voz ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null; // reconhecimento em andamento
function stopDictation() { if (rec) { rec.stop(); rec = null; } }
function dictate(input, btn) {
  if (!SR) return toast('Este navegador não tem ditado por voz. Use o Chrome (Android/PC) ou o Safari (iPhone).');
  if (rec) { stopDictation(); return; }
  const r = new SR();
  r.lang = 'pt-BR'; r.interimResults = true; r.continuous = true;
  let base = input.value, finals = '', wanted = true;
  const paint = (interim) => {
    const spoken = (finals + interim).trim();
    input.value = (base && spoken ? base + ' ' : base) + spoken;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  r.onstart = () => { btn.classList.add('rec'); btn.setAttribute('aria-pressed', 'true'); };
  r.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finals += (finals ? ' ' : '') + t.trim(); else interim += t;
    }
    paint(interim ? ' ' + interim : '');
  };
  r.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    wanted = false;
    toast(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Libere o microfone nas permissões do site e tente de novo.' : 'Não consegui ouvir. Verifique o microfone.');
  };
  r.onend = () => {
    // alguns navegadores encerram sozinhos após uma pausa: reinicia até o usuário parar
    if (wanted && rec === r) { base = input.value; finals = ''; try { r.start(); return; } catch (e) { /* cai para o fim */ } }
    btn.classList.remove('rec'); btn.removeAttribute('aria-pressed'); if (rec === r) rec = null;
  };
  const stop = r.stop.bind(r);
  r.stop = () => { wanted = false; stop(); };
  rec = r;
  try { r.start(); } catch (e) { rec = null; toast('Não consegui iniciar o microfone.'); }
}

/* ---------- captura rápida ---------- */
function openCapture(kind = 'pensamento', preset = '', autoDictate = false) {
  const KINDS = [['pensamento', 'Pensamento'], ['tarefa', 'Tarefa'], ['compromisso', 'Compromisso'], ['meta', 'Feitiço diário'], ['frase', 'Pergaminho']];
  let cat = '';
  openSheet('Registrar na Penseira', `
    <div class="chips" style="margin-bottom:14px" data-kinds>${KINDS.map(([k, l]) => `<button type="button" class="chip ${k === kind ? 'on' : ''}" data-kind="${k}">${l}</button>`).join('')}</div>
    <div class="field"><textarea class="in" name="text" autofocus placeholder="Escreva ou sussurre…" required>${esc(preset)}</textarea></div>
    <div style="margin:-6px 0 12px"><button type="button" class="btn sm" data-dict>${ic('mic')} Sussurrar</button></div>
    <div data-x="pensamento"><div class="pv" data-pv></div>${catChips('', true)}</div>
    <div data-x="tarefa"><div class="field"><span>Frente</span><select class="in" name="area">${areaOpts()}</select></div><div class="field"><span>Prazo (opcional)</span><input class="in" type="date" name="due"></div></div>
    <div data-x="compromisso"><div class="row"><div class="field grow"><span>Data</span><input class="in" type="date" name="date" value="${dkey()}"></div><div class="field grow"><span>Hora</span><input class="in" type="time" name="time"></div></div></div>
    <div data-x="frase"><div class="field"><span>Autor (opcional)</span><input class="in" name="author"></div></div>
    <div class="actions"><button type="button" class="btn grow" data-act="closeSheet">Cancelar</button><button class="btn pri grow">Salvar</button></div>`,
  (f) => {
    const ta = $('textarea', f);
    const sync = () => {
      $$('[data-x]', f).forEach((x) => x.classList.toggle('hide', x.dataset.x !== kind));
      $$('[data-kind]', f).forEach((c) => c.classList.toggle('on', c.dataset.kind === kind));
      const pv = $('[data-pv]', f);
      if (pv) { const c = cat || classify(ta.value || ' '); pv.textContent = ta.value.trim() ? `Esta memória vai brilhar como ${CATS[c].label}` : 'A Penseira escolhe a categoria sozinha, ou escolha abaixo.'; }
    };
    $('[data-kinds]', f).addEventListener('click', (e) => { const b = e.target.closest('[data-kind]'); if (b) { kind = b.dataset.kind; sync(); } });
    bindCats($('[data-x=pensamento]', f), (c) => { cat = c; sync(); });
    ta.addEventListener('input', sync);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.requestSubmit(); });
    $('[data-dict]', f)?.addEventListener('click', (e) => dictate(ta, e.currentTarget));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = fd(f), text = (d.text || '').trim();
      if (!text) return;
      let fresh = false;
      if (kind === 'pensamento') { const t = addThought(text, cat); toast(`Memória guardada: ${CATS[t.cat].label}`); fresh = true; }
      else if (kind === 'tarefa') {
        const a = areaFromTags(tagsOf(text))?.id || d.area;
        state.tasks.unshift({ id: uid(), text, areaId: a, due: d.due || '', done: false, star: false, created: Date.now() });
        toast('Nova página escrita');
      } else if (kind === 'compromisso') { state.events.push({ id: uid(), title: text, date: d.date || dkey(), time: d.time || '', done: false }); toast('Compromisso salvo'); }
      else if (kind === 'meta') { state.goals.push({ id: uid(), text, days: [] }); toast('Feitiço criado'); }
      else { state.phrases.unshift({ id: uid(), text, author: (d.author || '').trim(), fav: false }); toast('Pergaminho guardado'); }
      save(); closeSheet(); render();
      if (fresh) { const b = $('.basin-target'); if (b) { b.classList.remove('ripple'); void b.offsetWidth; b.classList.add('ripple'); Magic.burstAt(b, 'silver'); } }
    });
    sync();
    if (autoDictate && SR) dictate(ta, $('[data-dict]', f));
  });
}

/* ---------- sheets de edição ---------- */
function thoughtSheet(id) {
  const t = state.thoughts.find((x) => x.id === id);
  if (!t) return;
  let cat = t.cat;
  openSheet('Pensamento', `
    <div class="field"><textarea class="in" name="text" style="min-height:120px">${esc(t.text)}</textarea></div>
    ${catChips(cat)}
    <div class="field" style="margin-top:14px"><span>Frente (para virar tarefa)</span><select class="in" name="area">${areaOpts(areaFromTags(t.tags)?.id)}</select></div>
    <div class="actions">
      <button type="button" class="btn sm" data-do="pin">${t.pinned ? 'Desafixar' : 'Fixar'}</button>
      <button type="button" class="btn sm" data-do="task">Virar tarefa</button>
      <button type="button" class="btn sm" data-do="phrase">Virar frase</button>
      <button type="button" class="btn sm" data-do="done">${t.done ? 'Reabrir' : 'Resolvido'}</button>
    </div>
    <div class="actions" style="margin-top:14px"><button type="button" class="btn danger" data-do="del">Apagar</button><span class="grow"></span><button class="btn pri">Salvar</button></div>`,
  (f) => {
    bindCats(f, (c) => { cat = c; });
    const upd = () => { t.text = $('[name=text]', f).value.trim() || t.text; t.cat = cat; t.tags = tagsOf(t.text); };
    f.addEventListener('submit', (e) => { e.preventDefault(); upd(); save(); closeSheet(); render(); });
    f.addEventListener('click', (e) => {
      const b = e.target.closest('[data-do]');
      if (!b) return;
      upd();
      const w = b.dataset.do;
      if (w === 'pin') t.pinned = !t.pinned;
      else if (w === 'done') t.done = !t.done;
      else if (w === 'del') { if (!confirm('Apagar este pensamento?')) return; state.thoughts = state.thoughts.filter((x) => x !== t); }
      else if (w === 'task') { state.tasks.unshift({ id: uid(), text: t.text, areaId: $('[name=area]', f).value, due: '', done: false, star: false, created: Date.now() }); t.done = true; toast('Virou tarefa'); }
      else if (w === 'phrase') { state.phrases.unshift({ id: uid(), text: t.text.replace(/\s#[\p{L}\d_-]+/gu, ''), author: '', fav: false }); t.done = true; toast('Virou frase'); }
      save(); closeSheet(); render();
    });
  });
}

function organizeSheet() {
  const list = liveThoughts().filter((t) => t.cat === 'fazer');
  if (!list.length) return toast('Nada marcado como “Fazer” por enquanto.');
  openSheet('Organizar “Fazer”', `
    <p class="muted" style="margin-top:0">Marque o que quer transformar em tarefa. A frente é escolhida pela #tag, ou pela frente abaixo.</p>
    <div class="field"><span>Frente padrão</span><select class="in" name="area">${areaOpts()}</select></div>
    ${list.map((t) => `<label class="item"><input type="checkbox" name="c" value="${t.id}" checked><span class="t">${fmtText(t.text)}</span></label>`).join('')}
    <div class="actions" style="margin-top:14px"><button type="button" class="btn grow" data-act="closeSheet">Cancelar</button><button class="btn pri grow">Criar tarefas</button></div>`,
  (f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = $$('[name=c]:checked', f).map((x) => x.value), def = $('[name=area]', f).value;
    ids.forEach((id) => {
      const t = state.thoughts.find((x) => x.id === id);
      state.tasks.unshift({ id: uid(), text: t.text, areaId: areaFromTags(t.tags)?.id || def, due: '', done: false, star: false, created: Date.now() });
      t.done = true;
    });
    save(); closeSheet(); render(); toast(`${ids.length} tarefa${ids.length === 1 ? '' : 's'} criada${ids.length === 1 ? '' : 's'}`);
  }));
}

function taskSheet(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  openSheet('Tarefa', `
    <div class="field"><input class="in" name="text" value="${esc(t.text)}" required></div>
    <div class="row"><div class="field grow"><span>Frente</span><select class="in" name="area">${areaOpts(t.areaId)}</select></div><div class="field grow"><span>Prazo</span><input class="in" type="date" name="due" value="${t.due}"></div></div>
    <div class="actions"><button type="button" class="btn danger" data-do="del">Apagar</button><span class="grow"></span><button class="btn pri">Salvar</button></div>`,
  (f) => {
    f.addEventListener('submit', (e) => { e.preventDefault(); const d = fd(f); t.text = d.text.trim() || t.text; t.areaId = d.area; t.due = d.due; save(); closeSheet(); render(); });
    f.addEventListener('click', (e) => { if (e.target.closest('[data-do=del]') && confirm('Apagar tarefa?')) { state.tasks = state.tasks.filter((x) => x !== t); save(); closeSheet(); render(); } });
  });
}

function eventSheet(id) {
  const ev = id ? state.events.find((x) => x.id === id) : null;
  if (id && !ev) return;
  openSheet(ev ? 'Compromisso' : 'Novo compromisso', `
    <div class="field"><input class="in" name="title" value="${esc(ev?.title)}" placeholder="O que é?" required autofocus></div>
    <div class="row"><div class="field grow"><span>Data</span><input class="in" type="date" name="date" value="${ev?.date || dkey()}" required></div><div class="field grow"><span>Hora</span><input class="in" type="time" name="time" value="${ev?.time || ''}"></div></div>
    <div class="actions">${ev ? '<button type="button" class="btn danger" data-do="del">Apagar</button>' : ''}<span class="grow"></span><button class="btn pri">Salvar</button></div>`,
  (f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const d = fd(f);
      if (ev) { Object.assign(ev, { title: d.title.trim(), date: d.date, time: d.time, notified: false }); }
      else state.events.push({ id: uid(), title: d.title.trim(), date: d.date, time: d.time, done: false });
      save(); closeSheet(); render();
    });
    f.addEventListener('click', (e) => { if (e.target.closest('[data-do=del]') && confirm('Apagar compromisso?')) { state.events = state.events.filter((x) => x !== ev); save(); closeSheet(); render(); } });
  });
}

function goalSheet(id) {
  const g = state.goals.find((x) => x.id === id);
  if (!g) return;
  openSheet('Meta diária', `
    <div class="field"><input class="in" name="text" value="${esc(g.text)}" required></div>
    <p class="muted">Sequência atual: ${streak(g)} dia${streak(g) === 1 ? '' : 's'} · ${g.days.length} no total</p>
    <div class="actions"><button type="button" class="btn danger" data-do="del">Apagar</button><span class="grow"></span><button class="btn pri">Salvar</button></div>`,
  (f) => {
    f.addEventListener('submit', (e) => { e.preventDefault(); g.text = fd(f).text.trim() || g.text; save(); closeSheet(); render(); });
    f.addEventListener('click', (e) => { if (e.target.closest('[data-do=del]') && confirm('Apagar meta?')) { state.goals = state.goals.filter((x) => x !== g); save(); closeSheet(); render(); } });
  });
}

function phraseSheet(id) {
  const p = id ? state.phrases.find((x) => x.id === id) : null;
  openSheet(p ? 'Editar frase' : 'Nova frase', `
    <div class="field"><textarea class="in" name="text" autofocus required placeholder="A frase que você precisa lembrar…">${esc(p?.text)}</textarea></div>
    <div class="field"><span>Autor (opcional)</span><input class="in" name="author" value="${esc(p?.author)}"></div>
    <div class="actions">${p ? '<button type="button" class="btn danger" data-do="del">Apagar</button>' : ''}<span class="grow"></span><button class="btn pri">Salvar</button></div>`,
  (f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const d = fd(f);
      if (p) { p.text = d.text.trim(); p.author = d.author.trim(); }
      else state.phrases.unshift({ id: uid(), text: d.text.trim(), author: d.author.trim(), fav: false });
      if (!state.current) pickPhrase();
      save(); closeSheet(); render();
    });
    f.addEventListener('click', (e) => {
      if (e.target.closest('[data-do=del]') && confirm('Apagar frase?')) {
        state.phrases = state.phrases.filter((x) => x !== p);
        if (state.current?.id === p.id) { state.current = null; pickPhrase(); }
        save(); closeSheet(); render();
      }
    });
  });
}

function areaSheet(id) {
  const a = id ? areaOf(id) : null;
  openSheet(a ? 'Editar frente' : 'Nova frente', `
    <div class="field"><span>Nome</span><input class="in" name="name" value="${esc(a?.name)}" required autofocus></div>
    <div class="actions">${a ? '<button type="button" class="btn danger" data-do="del">Apagar</button>' : ''}<span class="grow"></span><button class="btn pri">Salvar</button></div>`,
  (f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const d = fd(f);
      const v = { name: d.name.trim() };
      if (a) Object.assign(a, v); else state.areas.push({ id: uid(), ...v });
      save(); closeSheet(); render();
    });
    f.addEventListener('click', (e) => {
      if (e.target.closest('[data-do=del]')) {
        const n = state.tasks.filter((t) => t.areaId === a.id).length;
        if (!confirm(`Apagar a frente “${a.name}”${n ? ` e suas ${n} tarefas` : ''}?`)) return;
        state.areas = state.areas.filter((x) => x !== a);
        state.tasks = state.tasks.filter((t) => t.areaId !== a.id);
        save(); closeSheet(); render();
      }
    });
  });
}

/* ---------- notificações ---------- */
async function notify(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, opts); return true; }
    new Notification(title, opts);
    return true;
  } catch (e) { return false; }
}
const inWindow = (d) => { const m = `${pad(d.getHours())}:${pad(d.getMinutes())}`; return m >= state.settings.from && m <= state.settings.to; };

function tick() {
  const s = state.settings, now = new Date(), ms = +now;
  let changed = false;
  if (state.phrases.length && (!state.current || !currentPhrase() || ms - state.current.at >= s.interval * 60000)) {
    const p = pickPhrase();
    changed = true;
    if (p && s.remind && document.hidden && inWindow(now)) notify('Lembre-se', p.text + (p.author ? ` — ${p.author}` : ''), 'frase');
  }
  state.events.forEach((e) => {
    if (e.done || e.notified || e.date !== dkey() || !e.time) return;
    const [h, m] = e.time.split(':').map(Number);
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
    if (ms >= at - 10 * 60000 && ms < at + 60 * 60000) {
      e.notified = true; save();
      if (document.hidden) notify('Compromisso às ' + e.time, e.title, 'ev-' + e.id); else toast(`${e.time} · ${e.title}`);
      changed = true;
    }
  });
  if (changed && !sheet.classList.contains('open') && !document.activeElement?.matches?.('input,textarea')) render();
}

/* ---------- ações ---------- */
const ACT = {
  go: (el) => go(el.dataset.view),
  capture: () => openCapture(),
  speak: () => { if (!SR) return toast('Este navegador não tem ditado por voz. Use o Chrome (Android/PC) ou o Safari (iPhone).'); openCapture('pensamento', '', true); },
  closeSheet,
  taskToggle: (el) => { const t = state.tasks.find((x) => x.id === el.dataset.id); t.done = !t.done; t.doneAt = t.done ? Date.now() : null; save(); if (t.done) Magic.burstAt(el, 'silver'); render(); },
  taskStar: (el) => { const t = state.tasks.find((x) => x.id === el.dataset.id); t.star = !t.star; save(); render(); },
  taskEdit: (el) => taskSheet(el.dataset.id),
  eventToggle: (el) => { const e = state.events.find((x) => x.id === el.dataset.id); e.done = !e.done; save(); render(); },
  eventEdit: (el) => eventSheet(el.dataset.id),
  eventAdd: () => eventSheet(),
  goalToggle: (el) => { const g = state.goals.find((x) => x.id === el.dataset.id), k = dkey(); const was = goalDone(g); g.days = was ? g.days.filter((d) => d !== k) : [...g.days, k]; save(); if (!was) Magic.burstAt(el, 'gold'); render(); },
  goalEdit: (el) => goalSheet(el.dataset.id),
  phraseNext: () => { pickPhrase(true); render(); },
  phraseFav: (el) => { const p = state.phrases.find((x) => x.id === el.dataset.id); p.fav = !p.fav; save(); if (p.fav) Magic.burstAt(el, 'gold'); render(); },
  book: (el) => { ui.book = el.dataset.id; if (view !== 'frentes') go('frentes'); else render(); },
  mode: (el) => { state.settings.mode = el.dataset.m; save(); render(); },
  phraseAdd: () => phraseSheet(),
  phraseEdit: (el) => phraseSheet(el.dataset.id),
  areaAdd: () => areaSheet(),
  areaEdit: (el) => areaSheet(el.dataset.id),
  thought: (el) => thoughtSheet(el.dataset.id),
  organize: organizeSheet,
  clearSearch: () => { ui.q = ''; const i = $('.top .search input'); if (i) i.value = ''; render(); },
  filter: (el) => { ui.tf = el.dataset.f; render(); },
  dictate: (el) => dictate($('input[name=text]', el.closest('form')), el),
  remindToggle: async () => {
    const s = state.settings;
    if (!s.remind) {
      if (!('Notification' in window)) return toast('Este navegador não suporta notificações.');
      const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (p !== 'granted') return toast('Permissão negada. Libere nas configurações do navegador.');
      s.remind = true; notify('Penseira', 'Lembretes ativados.', 'teste');
    } else s.remind = false;
    save(); render();
  },
  testNotif: async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return toast('Ative os lembretes primeiro.');
    const p = currentPhrase();
    (await notify('Lembre-se', p ? p.text : 'Teste de notificação', 'teste')) || toast('Falhou ao notificar.');
  },
  install: async () => { if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; render(); } },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `penseira-${dkey()}.json` });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import: () => $('#file').click(),
  wipe: () => { if (confirm('Apagar TODOS os dados deste aparelho? Exporte um backup antes.') && confirm('Tem certeza? Não dá para desfazer.')) { state = defaults(); pickPhrase(); save(); render(); toast('Dados apagados'); } },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !ACT[el.dataset.act]) return;
  e.preventDefault();
  ACT[el.dataset.act](el, e);
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  const text = (new FormData(f).get('text') || '').trim();
  if (!text) return;
  const kind = f.dataset.form;
  if (kind === 'quick') {
    const t = addThought(text); toast(`Memória guardada: ${CATS[t.cat].label}`);
    f.reset();
    if ($('.basin-target')) { Magic.flyToBasin(f, () => { render(); $('.composer input')?.focus(); }); return; }
  }
  else if (kind === 'goalAdd') { state.goals.push({ id: uid(), text, days: [] }); save(); }
  else if (kind === 'taskAdd') { state.tasks.unshift({ id: uid(), text, areaId: f.dataset.area, due: '', done: false, star: false, created: Date.now() }); save(); }
  render();
  if (kind === 'quick') $('.composer input')?.focus();
});

document.addEventListener('input', (e) => {
  if (!e.target.matches('[data-input=gsearch]')) return;
  ui.q = e.target.value;
  const inView = !!e.target.closest('#view');
  const pos = e.target.selectionStart;
  if (view !== 'penseira') go('penseira'); else render();
  if (inView) { const i = $('#view [data-input=gsearch]'); i.focus(); i.setSelectionRange(pos, pos); }
  else { const top = $('.top .search input'); const m = $('#view [data-input=gsearch]'); if (m) m.value = ui.q; top.focus(); }
});

document.addEventListener('change', (e) => {
  const k = e.target.dataset?.set;
  if (k) {
    state.settings[k] = k === 'interval' ? +e.target.value : e.target.value; save();
    return;
  }
  if (e.target.id === 'file' && e.target.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.v !== 1 || !Array.isArray(d.thoughts) || !Array.isArray(d.tasks)) throw new Error();
        if (!confirm('Substituir todos os dados deste aparelho pelos do arquivo?')) return;
        state = { ...defaults(), ...d, settings: { ...defaults().settings, ...d.settings } };
        save(); render(); toast('Backup importado');
      } catch (err) { toast('Arquivo inválido.'); }
    };
    r.readAsText(e.target.files[0]);
    e.target.value = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
  else if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey && !sheet.classList.contains('open') && !e.target.matches('input,textarea,select')) { e.preventDefault(); openCapture(); }
});

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (view === 'ajustes') render(); });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h === 'nova') { history.replaceState(null, '', '#' + view); openCapture(); } else if (h && h !== view) go(h); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); render(); } });

/* ---------- init ---------- */
renderTop();
if (!state.current || !currentPhrase()) pickPhrase();
const h0 = location.hash.slice(1);
view = RENDER[h0] ? h0 : 'hoje';
$('#view').classList.add('enter');
render();
if (h0 === 'nova') { history.replaceState(null, '', '#hoje'); openCapture(); }
tick();
setInterval(tick, 20000);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
