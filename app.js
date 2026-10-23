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

/* ---------- ícones ---------- */
const IC = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  cal: '<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
  quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h4M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h4"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

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
    thoughts: [{ id: uid(), text: 'Use Registrar ou o microfone para soltar um pensamento aqui. Ele é classificado sozinho. #exemplo', cat: 'ideia', tags: ['exemplo'], pinned: true, done: false, created: Date.now() }],
    current: null,
    settings: { remind: false, interval: 120, from: '08:00', to: '21:00', theme: 'dark' },
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
  ['hoje', 'Hoje', 'sun'], ['penseira', 'Penseira', 'cloud'], ['frentes', 'Frentes', 'grid'],
  ['agenda', 'Agenda', 'cal'], ['frases', 'Frases', 'quote'], ['ajustes', 'Ajustes', 'sliders'],
];
const BAR = ['hoje', 'penseira', 'frentes', 'agenda', 'frases']; // barra inferior no celular; Ajustes fica no topo
let view = 'hoje';
const ui = { tf: 'todas', q: '' };

const fmtDay = (k) => parseKey(k).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}
const empty = (msg) => `<div class="empty">${msg}</div>`;

function thoughtRow(t) {
  const c = CATS[t.cat] || CATS.reflexao;
  return `<button class="row-card" data-act="thought" data-id="${t.id}">
    <span class="rc-main"><span class="rc-t">${fmtText(t.text)}</span><span class="rc-m">${c.label}${t.pinned ? ' · fixado' : ''} · ${ago(t.created)}</span></span>
    ${t.pinned ? '<span class="pin-dot" aria-label="Fixado"></span>' : ''}</button>`;
}

function taskLine(t, showArea) {
  const a = showArea ? areaOf(t.areaId) : null;
  return `<div class="line ${t.done ? 'done' : ''}">
    <button class="ck ${t.done ? 'on' : ''}" data-act="taskToggle" data-id="${t.id}" aria-label="Concluir">${ic('check')}</button>
    <button class="t" data-act="taskEdit" data-id="${t.id}">${esc(t.text)}${a ? ` <span class="faint">· ${esc(a.name)}</span>` : ''}</button>
    ${t.due && !t.done ? `<span class="due ${dueCls(t.due)}">${relDate(t.due)}</span>` : ''}
    <button class="ib ${t.star ? 'on' : ''}" data-act="taskStar" data-id="${t.id}" aria-label="${t.star ? 'Tirar prioridade' : 'Marcar como prioridade'}" aria-pressed="${!!t.star}">${ic('star')}</button>
  </div>`;
}

function agendaRow(it) {
  return `<div class="row-card ${it.done ? 'done' : ''}">
    <button class="ck ${it.done ? 'on' : ''}" data-act="${it.kind}Toggle" data-id="${it.id}" aria-label="Concluir">${ic('check')}</button>
    <button class="rc-main" data-act="${it.kind}Edit" data-id="${it.id}"><span class="rc-t">${esc(it.title)}</span><span class="rc-m">${it.kind === 'event' ? 'Compromisso' : 'Tarefa'}${it.area ? ' · ' + esc(it.area.name) : ''}</span></button>
    <span class="rc-when ${dueCls(it.date)}">${relDate(it.date)}${it.time ? `<small>${it.time}</small>` : ''}</span>
  </div>`;
}

/* A linha do dia: das 6h à meia-noite, com o que está marcado e o que foi guardado hoje. */
const DAY_LEGEND = '<span class="legend"><span><i class="d1"></i>Compromissos</span><span><i class="d2"></i>Pensamentos guardados</span></span>';
function dayline() {
  const k = dkey(), from = 6, to = 24;
  const pos = (h) => Math.max(0, Math.min(100, ((h - from) / (to - from)) * 100));
  const hm = (s) => { const [h, m] = s.split(':').map(Number); return h + m / 60; };
  const evs = state.events.filter((e) => e.date === k && e.time && !e.done).sort((a, b) => a.time.localeCompare(b.time));
  const ths = state.thoughts.filter((t) => dkey(new Date(t.created)) === k);
  const now = new Date(), nowH = now.getHours() + now.getMinutes() / 60;
  const summary = `${plural(evs.length, 'compromisso', 'compromissos')} e ${plural(ths.length, 'pensamento guardado', 'pensamentos guardados')} hoje`;
  return `<div class="dayline ${evs.length ? '' : 'compact'}" role="img" aria-label="${summary}">
    <div class="axis"></div>
    ${[6, 9, 12, 15, 18, 21, 24].map((h) => `<i class="tick" style="left:${pos(h)}%"></i><span class="hr" style="left:${pos(h)}%">${pad(h % 24)}h</span>`).join('')}
    ${ths.filter((t) => new Date(t.created).getHours() >= from).map((t) => { const d = new Date(t.created); return `<i class="th" style="left:${pos(d.getHours() + d.getMinutes() / 60)}%"></i>`; }).join('')}
    ${evs.map((e, i) => `<div class="ev ${i % 2 ? 'l2' : ''}" style="left:${pos(hm(e.time))}%"><span>${esc(e.time)} ${esc(e.title)}</span><i></i></div>`).join('')}
    ${nowH >= from ? `<div class="now ${pos(nowH) > 86 ? 'r' : ''}" style="left:${pos(nowH)}%"><b>${pad(now.getHours())}:${pad(now.getMinutes())}</b></div>` : ''}
  </div>${evs.length ? '' : '<p class="side-note" style="margin-top:6px">Nenhum compromisso com horário hoje.</p>'}`;
}

function tile(label, value, unit, caption, go) {
  const inner = `<span class="l">${label}</span><span class="v">${value}${unit ? `<small>${unit}</small>` : ''}</span><span class="c">${caption}</span>`;
  return go
    ? `<button class="tile" data-act="go" data-view="${go}">${inner}</button>`
    : `<div class="tile">${inner}</div>`;
}

function vHoje() {
  const k = dkey(), now = new Date(), hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const p = currentPhrase();
  const goals = state.goals, doneN = goals.filter((g) => goalDone(g)).length;
  const pendingGoal = goals.find((g) => !goalDone(g));
  const evsToday = state.events.filter((e) => e.date === k && !e.done).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const nextEv = evsToday.find((e) => !e.time || e.time >= hhmm);
  const openTasks = state.tasks.filter((t) => !t.done);
  const late = openTasks.filter((t) => t.due && diffDays(t.due) < 0).length;
  const live = liveThoughts();
  const ag = agendaItems().filter((i) => !i.done && diffDays(i.date) <= 1).slice(0, 4);
  const stars = state.tasks.filter((t) => t.star && !t.done).slice(0, 3);
  const recent = [...live.filter((t) => t.pinned), ...live.filter((t) => !t.pinned)].slice(0, 3);
  const finding = late ? `${plural(late, 'tarefa atrasada', 'tarefas atrasadas')}` : nextEv ? `Próximo: <b>${esc(nextEv.title)}</b>${nextEv.time ? ' às ' + nextEv.time : ''}` : 'Nada urgente por enquanto';
  return `
  <div class="page-h"><div><h1>Hoje</h1><p>${fmtDay(k)} · ${finding}</p></div></div>
  <div class="g12">
    <section class="panel phrase s12" aria-label="Frase do momento">
      <span class="l">Lembre-se agora</span>
      ${p ? `<div><blockquote>${esc(p.text)}</blockquote>${p.author ? `<cite>${esc(p.author)}</cite>` : ''}</div>
      <div class="acts"><button class="btn sm" data-act="phraseNext">Outra frase</button>
      <button class="btn sm" data-act="phraseFav" data-id="${p.id}" aria-pressed="${!!p.fav}">${p.fav ? 'Favorita' : 'Favoritar'}</button></div>`
      : `<div><blockquote>Guarde aqui as frases que você precisa lembrar.</blockquote></div><div class="acts"><button class="btn sm" data-act="phraseAdd">Nova frase</button></div>`}
    </section>
    <div class="s3">${tile('Metas de hoje', doneN, `de ${goals.length}`, pendingGoal ? `Falta: ${esc(pendingGoal.text)}` : goals.length ? 'Tudo cumprido' : 'Nenhuma meta criada')}</div>
    <div class="s3">${tile('Compromissos hoje', evsToday.length, '', nextEv ? `Próximo: ${esc(nextEv.title)}${nextEv.time ? ', ' + nextEv.time : ''}` : evsToday.length ? 'Sem horário definido' : 'Nada marcado para hoje', 'agenda')}</div>
    <div class="s3">${tile('Tarefas abertas', openTasks.length, '', openTasks.length ? (late ? plural(late, 'atrasada', 'atrasadas') : 'Nenhuma atrasada') : 'Nada em aberto', 'frentes')}</div>
    <div class="s3">${tile('Pensamentos soltos', live.length, '', live.length ? `Último ${ago(live[0].created)}` : 'Nenhum guardado', 'penseira')}</div>
    <section class="panel s12"><div class="panel-h"><h2>Seu dia</h2><span class="sp"></span>${DAY_LEGEND}</div>${dayline()}</section>
    <div class="s7 colstack">
      <section class="panel"><div class="panel-h"><h2>Hoje e amanhã</h2>${ag.length ? `<span class="count">${ag.length}</span>` : ''}</div>
        ${ag.length ? ag.map(agendaRow).join('') : empty('Nada marcado para hoje ou amanhã.')}
        <div class="foot"><button class="link" data-act="go" data-view="agenda">Ver agenda</button></div></section>
      <section class="panel"><div class="panel-h"><h2>Prioridades</h2>${stars.length ? `<span class="count">${stars.length}</span>` : ''}</div>
        ${stars.length ? stars.map((t) => taskLine(t, true)).join('') : empty('Marque uma tarefa como prioridade e ela aparece aqui.')}
        <div class="foot"><button class="link" data-act="go" data-view="frentes">Ver frentes</button></div></section>
    </div>
    <div class="s5 colstack">
      <section class="panel"><div class="panel-h"><h2>Metas de hoje</h2><span class="sp"></span><span class="faint num">${doneN} de ${goals.length}</span></div>
        ${goals.length ? goals.map((g) => `<div class="line ${goalDone(g) ? 'done' : ''}"><button class="ck ${goalDone(g) ? 'on' : ''}" data-act="goalToggle" data-id="${g.id}" aria-label="Concluir">${ic('check')}</button>
          <button class="t" data-act="goalEdit" data-id="${g.id}">${esc(g.text)}</button>${streak(g) > 1 ? `<span class="due">${streak(g)} dias seguidos</span>` : ''}</div>`).join('') : empty('Crie sua primeira meta diária.')}
        <form class="addrow" data-form="goalAdd"><input class="in" name="text" placeholder="Nova meta diária" autocomplete="off" aria-label="Nova meta diária"><button class="btn" aria-label="Adicionar meta">Adicionar</button></form></section>
      <section class="panel"><div class="panel-h"><h2>Pensamentos soltos</h2>${live.length ? `<span class="count">${live.length}</span>` : ''}</div>
        ${recent.length ? recent.map(thoughtRow).join('') : empty('Nenhum pensamento guardado. Use Registrar ou o microfone.')}
        <div class="foot"><button class="link" data-act="go" data-view="penseira">Ver todos</button></div></section>
    </div>
  </div>`;
}

function vPenseira() {
  const live = liveThoughts();
  const q = norm(ui.q);
  const allTags = [...new Set(live.flatMap((t) => t.tags))].sort();
  let list = state.thoughts.filter((t) => (ui.tf === 'resolvidos' ? t.done : !t.done));
  if (CATS[ui.tf]) list = list.filter((t) => t.cat === ui.tf);
  else if (ui.tf.startsWith('#')) list = list.filter((t) => t.tags.includes(ui.tf.slice(1)));
  if (q) list = list.filter((t) => norm(t.text).includes(q));
  list.sort((a, b) => b.pinned - a.pinned || b.created - a.created);
  const count = (c) => live.filter((t) => t.cat === c).length;
  const nFazer = count('fazer');
  const resolved = state.thoughts.filter((t) => t.done).length;
  const filters = [['todas', 'Todas', live.length], ...Object.entries(CATS).map(([c, v]) => [c, v.label, count(c)]), ...allTags.map((g) => ['#' + g, '#' + g, live.filter((t) => t.tags.includes(g)).length])];
  if (resolved) filters.push(['resolvidos', 'Resolvidos', resolved]);
  const kv = (f) => `<button class="kv ${ui.tf === f[0] ? 'on' : ''}" data-act="filter" data-f="${f[0]}"><span>${esc(f[1])}</span><span>${f[2]}</span></button>`;
  const chip = (f) => `<button class="chip ${ui.tf === f[0] ? 'on' : ''}" data-act="filter" data-f="${f[0]}">${esc(f[1])} <span class="num">&nbsp;${f[2]}</span></button>`;
  return `
  <div class="page-h"><div><h1>Penseira</h1><p>${plural(live.length, 'pensamento solto', 'pensamentos soltos')}${nFazer ? ` · ${nFazer} para fazer` : ''}${ui.q ? ` · busca por “${esc(ui.q)}”` : ''}</p></div>
    ${ui.q ? '<button class="btn sm" data-act="clearSearch">Limpar busca</button>' : ''}</div>
  <form class="composer" data-form="quick"><input name="text" placeholder="Solte um pensamento" autocomplete="off" aria-label="Novo pensamento">
    <button type="button" class="ib" data-act="dictate" aria-label="Ditar por voz">${ic('mic')}</button><button class="btn pri">Guardar</button></form>
  <input class="in m-only" data-input="gsearch" placeholder="Buscar nos pensamentos" value="${esc(ui.q)}" aria-label="Buscar nos pensamentos" style="margin-bottom:12px">
  <div class="tabs-h">${filters.map(chip).join('')}</div>
  ${nFazer ? `<button class="btn sm m-only" data-act="organize" style="margin-bottom:14px">Transformar em tarefas (${nFazer})</button>` : ''}
  <div class="g12">
    <section class="s8">${list.length ? list.map(thoughtRow).join('') : empty(state.thoughts.length ? 'Nada por aqui com esse filtro.' : 'Solte um pensamento acima.')}</section>
    <aside class="panel s4 cats cats-d"><div class="panel-h"><h2>Categorias</h2></div>${filters.map(kv).join('')}
      ${nFazer ? `<div class="actions" style="margin-top:14px"><button class="btn sm" data-act="organize">Transformar em tarefas (${nFazer})</button></div><p class="side-note">Os pensamentos classificados como “Fazer” viram tarefas nas suas frentes.</p>` : ''}</aside>
  </div>`;
}

function vFrentes() {
  const nOpen = state.tasks.filter((t) => !t.done).length;
  return `
  <div class="page-h"><div><h1>Frentes</h1><p>${plural(nOpen, 'tarefa aberta', 'tarefas abertas')} em ${plural(state.areas.length, 'frente', 'frentes')}</p></div><button class="btn" data-act="areaAdd">Nova frente</button></div>
  <div class="areas">${state.areas.map((a) => {
    const all = state.tasks.filter((t) => t.areaId === a.id);
    const open = all.filter((t) => !t.done).sort((x, y) => (y.star || 0) - (x.star || 0) || (x.due || '9').localeCompare(y.due || '9'));
    const done = all.filter((t) => t.done);
    const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;
    return `<section class="panel area">
      <div class="ttl"><h3>${esc(a.name)}</h3><span class="faint num">${plural(open.length, 'aberta', 'abertas')}</span><button class="ib" data-act="areaEdit" data-id="${a.id}" aria-label="Editar frente ${esc(a.name)}">${ic('more')}</button></div>
      ${all.length ? `<div class="progress"><span class="num">${done.length} de ${all.length}</span><span class="trk"><i style="width:${pct}%"></i></span></div>` : ''}
      ${open.map((t) => taskLine(t)).join('') || empty('Nenhuma tarefa aberta.')}
      <form class="addrow" data-form="taskAdd" data-area="${a.id}"><input class="in" name="text" placeholder="Nova tarefa" autocomplete="off" aria-label="Nova tarefa em ${esc(a.name)}"><button class="btn" aria-label="Adicionar tarefa">Adicionar</button></form>
      ${done.length ? `<details><summary>${plural(done.length, 'concluída', 'concluídas')}</summary>${done.slice(0, 15).map((t) => taskLine(t)).join('')}</details>` : ''}
    </section>`;
  }).join('') || empty('Crie sua primeira frente de trabalho.')}</div>`;
}

function vAgenda() {
  const items = agendaItems();
  const open = items.filter((i) => !i.done);
  const groups = [['Atrasados', (n) => n < 0], ['Hoje', (n) => n === 0], ['Amanhã', (n) => n === 1], ['Próximos 7 dias', (n) => n >= 2 && n <= 7], ['Depois', (n) => n > 7]];
  const done = items.filter((i) => i.done).slice(-10).reverse();
  const blocks = groups.map(([name, f]) => {
    const g = open.filter((i) => f(diffDays(i.date)));
    return g.length ? `<section class="panel"><div class="panel-h"><h2>${name}</h2><span class="count">${g.length}</span></div>${g.map(agendaRow).join('')}</section>` : '';
  }).join('');
  return `
  <div class="page-h"><div><h1>Agenda</h1><p>${plural(open.length, 'item pendente', 'itens pendentes')} · compromissos e prazos das frentes</p></div><button class="btn" data-act="eventAdd">Novo compromisso</button></div>
  <div class="narrow stack">${blocks || empty('Nada na agenda. Adicione um compromisso.')}
  ${done.length ? `<details class="panel"><summary style="margin:0">Concluídos recentes</summary><div style="margin-top:12px">${done.map(agendaRow).join('')}</div></details>` : ''}</div>`;
}

function vFrases() {
  return `
  <div class="page-h"><div><h1>Frases</h1><p>${plural(state.phrases.length, 'frase', 'frases')} para lembrar durante o dia</p></div><button class="btn" data-act="phraseAdd">Nova frase</button></div>
  <section class="panel narrow">${state.phrases.map((p) => `<div class="phr"><q>${esc(p.text)}${p.author ? `<small>${esc(p.author)}</small>` : ''}</q>
    <button class="btn sm" data-act="phraseFav" data-id="${p.id}" aria-pressed="${!!p.fav}">${p.fav ? 'Favorita' : 'Favoritar'}</button>
    <button class="btn sm" data-act="phraseEdit" data-id="${p.id}">Editar</button></div>`).join('') || empty('Nenhuma frase ainda.')}</section>`;
}

let installEvt = null;
function vAjustes() {
  const s = state.settings;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const hint = perm === 'denied' ? 'Bloqueado no navegador. Libere nas permissões do site.' : perm === 'unsupported' ? 'Este navegador não suporta notificações.' : 'Chega com o app aberto ou em segundo plano.';
  return `
  <div class="page-h"><div><h1>Ajustes</h1><p>Tudo fica salvo neste aparelho</p></div></div>
  <div class="narrow stack">
  <section class="panel"><div class="panel-h"><h2>Lembretes de frases</h2></div>
    <div class="set-row"><div>Notificar frases ao longo do dia<small>${hint}</small></div>
      <button class="sw-t ${s.remind ? 'on' : ''}" data-act="remindToggle" role="switch" aria-checked="${!!s.remind}" aria-label="Lembretes de frases"></button></div>
    <div class="set-row"><label for="iv">Intervalo</label><select class="in" id="iv" data-set="interval">${[30, 60, 90, 120, 180, 240].map((m) => `<option value="${m}" ${s.interval === m ? 'selected' : ''}>${m < 60 ? m + ' min' : m % 60 ? (m / 60).toString().replace('.', ',') + ' h' : m / 60 + ' h'}</option>`).join('')}</select></div>
    <div class="set-row"><span>Horário</span><span class="row"><input class="in" type="time" value="${s.from}" data-set="from" aria-label="Das"><span class="faint">até</span><input class="in" type="time" value="${s.to}" data-set="to" aria-label="Até"></span></div>
    <div class="actions"><button class="btn sm" data-act="testNotif">Testar notificação</button></div>
    <p class="side-note">Sem servidor, o aviso só chega se o app estiver aberto ou rodando em segundo plano. No iPhone, instale na Tela de Início primeiro.</p>
  </section>
  <section class="panel"><div class="panel-h"><h2>Aplicativo</h2></div>
    <div class="set-row"><div>Instalar neste aparelho<small>Celular: menu do navegador, “Instalar app” ou “Adicionar à Tela de Início”. Computador: ícone de instalar na barra de endereço.</small></div>${installEvt ? '<button class="btn pri sm" data-act="install">Instalar</button>' : ''}</div>
  </section>
  <section class="panel"><div class="panel-h"><h2>Seus dados</h2></div>
    <p class="muted" style="margin-bottom:12px">Para levar do celular ao computador, ou fazer backup, exporte e importe o arquivo.</p>
    <div class="actions"><button class="btn" data-act="export">Exportar backup</button><button class="btn" data-act="import">Importar backup</button></div>
    <input type="file" id="file" accept="application/json,.json" class="hide">
    <p class="side-note">Importar substitui tudo o que está neste aparelho.</p>
  </section>
  <section class="panel"><div class="panel-h"><h2>Apagar tudo</h2></div>
    <p class="muted" style="margin-bottom:12px">Remove pensamentos, tarefas, metas, compromissos e frases deste aparelho. Exporte um backup antes.</p>
    <button class="btn danger" data-act="wipe">Apagar todos os dados</button>
  </section>
  </div>`;
}

const RENDER = { hoje: vHoje, penseira: vPenseira, frentes: vFrentes, agenda: vAgenda, frases: vFrases, ajustes: vAjustes };

function renderTop() {
  $('#top').innerHTML = `
    <div class="mark"><img src="icons/icon.svg" alt="">Penseira</div>
    <label class="search">${ic('search')}<input data-input="gsearch" placeholder="Buscar nos pensamentos" value="${esc(ui.q)}" aria-label="Buscar nos pensamentos"></label>
    <span class="grow"></span>
    <button class="ib" data-act="speak" aria-label="Falar um pensamento">${ic('mic')}</button>
    <button class="btn pri" data-act="capture">Registrar</button>
    <button class="ib only-m" data-act="go" data-view="ajustes" aria-label="Ajustes">${ic('sliders')}</button>`;
}
function renderNav() {
  $('#side').innerHTML = `<div class="brand"><img src="icons/icon.svg" alt="">Penseira</div>` +
    VIEWS.map(([id, l, i]) => `<button class="nav ${view === id ? 'on' : ''}" data-act="go" data-view="${id}"${view === id ? ' aria-current="page"' : ''}>${ic(i)}${l}</button>`).join('') +
    `<div class="sp"></div><div class="foot">Salvo neste aparelho<br>Tecla N registra rápido</div>`;
  $('#tabs').innerHTML = VIEWS.filter(([id]) => BAR.includes(id)).map(([id, l, i]) => `<button class="${view === id ? 'on' : ''}" data-act="go" data-view="${id}" aria-label="${l}"${view === id ? ' aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`).join('');
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
  render();
  window.scrollTo(0, 0);
}

/* ---------- sheet / toast ---------- */
const sheet = $('#sheet');
function openSheet(title, html, bind) {
  sheet.innerHTML = `<div class="scrim" data-act="closeSheet"></div><form class="panel-s" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div><h2>${esc(title)}</h2>${html}</form>`;
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
  const KINDS = [['pensamento', 'Pensamento'], ['tarefa', 'Tarefa'], ['compromisso', 'Compromisso'], ['meta', 'Meta'], ['frase', 'Frase']];
  let cat = '';
  openSheet('Registrar', `
    <div class="chips" style="margin-bottom:14px" data-kinds>${KINDS.map(([k, l]) => `<button type="button" class="chip ${k === kind ? 'on' : ''}" data-kind="${k}">${l}</button>`).join('')}</div>
    <div class="field"><textarea class="in" name="text" autofocus placeholder="Escreva ou dite…" required>${esc(preset)}</textarea></div>
    <div style="margin:-6px 0 12px"><button type="button" class="btn sm" data-dict>${ic('mic')} Falar</button></div>
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
      if (pv) { const c = cat || classify(ta.value || ' '); pv.textContent = ta.value.trim() ? `Vai entrar como ${CATS[c].label}` : 'Eu escolho a categoria sozinho, ou escolha abaixo.'; }
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
      if (kind === 'pensamento') { const t = addThought(text, cat); toast(`Guardado em ${CATS[t.cat].label}`); }
      else if (kind === 'tarefa') {
        const a = areaFromTags(tagsOf(text))?.id || d.area;
        state.tasks.unshift({ id: uid(), text, areaId: a, due: d.due || '', done: false, star: false, created: Date.now() });
        toast('Tarefa adicionada');
      } else if (kind === 'compromisso') { state.events.push({ id: uid(), title: text, date: d.date || dkey(), time: d.time || '', done: false }); toast('Compromisso salvo'); }
      else if (kind === 'meta') { state.goals.push({ id: uid(), text, days: [] }); toast('Meta criada'); }
      else { state.phrases.unshift({ id: uid(), text, author: (d.author || '').trim(), fav: false }); toast('Frase salva'); }
      save(); closeSheet(); render();
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
  taskToggle: (el) => { const t = state.tasks.find((x) => x.id === el.dataset.id); t.done = !t.done; t.doneAt = t.done ? Date.now() : null; save(); render(); },
  taskStar: (el) => { const t = state.tasks.find((x) => x.id === el.dataset.id); t.star = !t.star; save(); render(); },
  taskEdit: (el) => taskSheet(el.dataset.id),
  eventToggle: (el) => { const e = state.events.find((x) => x.id === el.dataset.id); e.done = !e.done; save(); render(); },
  eventEdit: (el) => eventSheet(el.dataset.id),
  eventAdd: () => eventSheet(),
  goalToggle: (el) => { const g = state.goals.find((x) => x.id === el.dataset.id), k = dkey(); g.days = goalDone(g) ? g.days.filter((d) => d !== k) : [...g.days, k]; save(); render(); },
  goalEdit: (el) => goalSheet(el.dataset.id),
  phraseNext: () => { pickPhrase(true); render(); },
  phraseFav: (el) => { const p = state.phrases.find((x) => x.id === el.dataset.id); p.fav = !p.fav; save(); render(); },
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
  if (kind === 'quick') { const t = addThought(text); toast(`Guardado em ${CATS[t.cat].label}`); }
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
render();
if (h0 === 'nova') { history.replaceState(null, '', '#hoje'); openCapture(); }
tick();
setInterval(tick, 20000);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
