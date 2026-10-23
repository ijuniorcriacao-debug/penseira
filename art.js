'use strict';
/* Arte da Penseira, toda desenhada em SVG: sigilos do menu, runas, lua, bacia, frascos, selo de cera. */
const Art = (() => {
  /* ---- sigilos do menu e dos botões (traço fino, 24x24) ---- */
  const SIG = {
    hoje: '<path d="M20 14.5A8 8 0 1 1 9.6 4a6.4 6.4 0 0 0 10.4 10.5z"/><path d="M17.2 3.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z"/>',
    penseira: '<path d="M3.5 12.5h17"/><path d="M4.5 12.5c.5 4 3.6 7 7.5 7s7-3 7.5-7"/><path d="M9 20.5h6"/><path d="M12 10.5c-2.2-1.7 1.6-3 0-5.2M15 10.5c-1.6-1.2 1-2.4-.2-4"/>',
    frentes: '<path d="M6 3.5h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z"/><path d="M6 17.5a2 2 0 0 1 2-2h11"/><path d="M10 7.5h6M10 10.5h4"/>',
    agenda: '<path d="M7 3.5h10M7 20.5h10"/><path d="M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5"/><path d="M10 18.5h4"/>',
    frases: '<path d="M8 4h10a2 2 0 0 1 2 2v1H8z"/><path d="M8 4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7"/><path d="M9.5 10.5h6M9.5 13.5h6M9.5 16.5h3.5"/>',
    ajustes: '<circle cx="8" cy="9" r="4"/><path d="M11 12l8 8M15.5 16.5l2-2M18 19l2-2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M8.5 21h7"/>',
    pena: '<path d="M20 4c-8.5 0-13.5 5-14.5 12.5L3.5 20.5l4-2C15 17.5 20 12.5 20 4z"/><path d="M8 16l6-6"/>',
    lupa: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    estrela: '<path d="M12 2.5l2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 17l-5.8 3.3 1.3-6.5-4.8-4.5 6.5-.8z"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    mais3: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    ampulheta: '<path d="M7 3.5h10M7 20.5h10"/><path d="M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5"/>',
    sino: '<path d="M6 17c1-1.5 1.5-3 1.5-6a4.5 4.5 0 0 1 9 0c0 3 .5 4.5 1.5 6z"/><path d="M10 20.5a2 2 0 0 0 4 0M12 4V3"/>',
    losango: '<path d="M12 3l7 9-7 9-7-9z"/>',
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${SIG[n] || ''}</svg>`;

  /* ---- sigilo de cada categoria, desenhado dentro das esferas ---- */
  const CATSIG = {
    fazer: '<path d="M7 12.5l3.2 3.2L17 8.5"/>',
    ideia: '<path d="M12 4l1.6 5.4L19 11l-5.4 1.6L12 18l-1.6-5.4L5 11l5.4-1.6z"/>',
    pergunta: '<path d="M9.2 9.2a2.9 2.9 0 1 1 4.4 2.5c-1 .7-1.6 1.2-1.6 2.4M12 17.2v.3"/>',
    lembrar: '<path d="M12 4l6 8-6 8-6-8z"/><path d="M12 9.5v5"/>',
    frase: '<path d="M6 12V9.5A3.5 3.5 0 0 1 9.5 6M6 12h4v5H6zM13.5 12V9.5A3.5 3.5 0 0 1 17 6M13.5 12h4v5h-4z"/>',
    reflexao: '<circle cx="12" cy="12" r="7"/><path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0M12 12m-.01 0"/>',
  };
  const catSig = (c) => `<svg class="cs" viewBox="0 0 24 24" aria-hidden="true">${CATSIG[c] || CATSIG.reflexao}</svg>`;

  /* ---- doze runas (traços retos, centradas em 0,0) ---- */
  const RUNES = [
    'M-3 -9V9M-3 -9L5 -3L-3 3', 'M0 -9V9M0 -4L6 -9M0 2L6 -3', 'M-5 -9L5 0L-5 9M5 -9V9', 'M-5 -9V9M-5 -2L5 -9M-5 2L5 9',
    'M-4 -9V9M4 -9V9M-4 -3L4 3', 'M0 -9V9M-6 -3L0 -9L6 -3', 'M-5 9L0 -9L5 9M-3 2H3', 'M-5 -9L5 9M5 -9L-5 9M0 -9V9',
    'M-5 -9H5L-5 9H5', 'M0 -9V9M-5 -4L5 4', 'M-5 -9V9M-5 -9L5 -3L-5 3M-5 3L5 9', 'M0 -9L6 0L0 9L-6 0Z M0 -9V9',
  ];
  const rune = (i) => RUNES[((i % 12) + 12) % 12];

  /* ---- a lua do dia: fase calculada pela data ---- */
  function moonPhase(d = new Date()) {
    const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
    return ((((+d - ref) / 864e5) % syn) + syn) % syn / syn;
  }
  const moonName = (p) => (p < 0.03 || p > 0.97 ? 'Lua nova' : p < 0.22 ? 'Lua crescente' : p < 0.28 ? 'Quarto crescente' : p < 0.47 ? 'Gibosa crescente' : p < 0.53 ? 'Lua cheia' : p < 0.72 ? 'Gibosa minguante' : p < 0.78 ? 'Quarto minguante' : 'Lua minguante');
  const moonLit = (p) => Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100);
  let moonN = 0;
  function moonSvg(p, size = 64, attrs = '', cls = '') {
    const id = 'mn' + (moonN++), r = 30, c = 32;
    const waxing = p <= 0.5, q = waxing ? p : 1 - p, cosv = Math.cos(2 * Math.PI * q);
    const rx = Math.abs(cosv) * r, sweep = cosv > 0 ? 0 : 1;
    const lit = q < 0.005 ? '' : `<path d="M${c} ${c - r}A${r} ${r} 0 0 1 ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${c} ${c - r}Z" fill="url(#${id}l)" ${waxing ? '' : `transform="translate(64 0) scale(-1 1)"`}/>`;
    return `<svg class="moon ${cls}" ${attrs} viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${moonName(p)}">
      <defs><radialGradient id="${id}l" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#e6ecff"/><stop offset="1" stop-color="#b9c8f0"/></radialGradient>
      <radialGradient id="${id}d" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1a2348"/><stop offset="1" stop-color="#0c1230"/></radialGradient></defs>
      <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id}d)" stroke="#6f80b8" stroke-opacity=".5"/>
      ${lit}
      <g fill="#8896c4" fill-opacity=".28"><circle cx="24" cy="26" r="4"/><circle cx="38" cy="38" r="5"/><circle cx="30" cy="44" r="2.4"/><circle cx="41" cy="24" r="2.6"/></g></svg>`;
  }

  /* ---- ornamentos ---- */
  const CORNER = '<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M2 42V14C2 7 7 2 14 2H42M8 42V18c0-5.5 4.5-10 10-10h24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="15" cy="15" r="2.2" fill="currentColor"/><path d="M2 26c5 0 8-3 8-8M26 2c0 5-3 8-8 8" fill="none" stroke="currentColor" stroke-width=".9" opacity=".6"/></svg>';
  const corners = () => ['tl', 'tr', 'bl', 'br'].map((k) => `<i class="orn ${k}" aria-hidden="true">${CORNER}</i>`).join('');
  const divider = () => '<svg class="divider" viewBox="0 0 220 14" aria-hidden="true"><path d="M2 7h90M128 7h90" stroke="currentColor" stroke-width="1" opacity=".55"/><path d="M110 1l6 6-6 6-6-6z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="96" cy="7" r="1.6" fill="currentColor"/><circle cx="124" cy="7" r="1.6" fill="currentColor"/></svg>';

  /* ---- a bacia de pedra: líquido de prata girando, runas na borda e no corpo ---- */
  function basin() {
    const rimRunes = Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2, x = 450 + Math.cos(a) * 365, y = 124 + Math.sin(a) * 77;
      return `<path class="rr" style="animation-delay:${(i * 0.37).toFixed(2)}s" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.sin(a) * 0).toFixed(0)}) scale(.5)" d="${rune(i)}"/>`;
    }).join('');
    const bodyRunes = Array.from({ length: 11 }, (_, i) => {
      const x = 150 + i * 60, t = (x - 450) / 380, y = 205 + t * t * 22 - 18;
      return `<path class="br" style="animation-delay:${(i * 0.5).toFixed(2)}s" transform="translate(${x} ${y.toFixed(1)}) scale(.95)" d="${rune(i + 3)}"/>`;
    }).join('');
    return `<svg class="basin-svg" viewBox="0 0 900 300" role="img" aria-label="A Penseira: uma bacia de pedra com um líquido de prata">
    <defs>
      <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8091c4"/><stop offset=".35" stop-color="#4a5890"/><stop offset="1" stop-color="#151c3d"/></linearGradient>
      <linearGradient id="stoneR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa9d6"/><stop offset=".5" stop-color="#4d5b93"/><stop offset="1" stop-color="#1a2246"/></linearGradient>
      <radialGradient id="well" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#f2fbff"/><stop offset=".25" stop-color="#bfeaff"/><stop offset=".6" stop-color="#5d9bd0"/><stop offset="1" stop-color="#1c3b72"/></radialGradient>
      <radialGradient id="glowB" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#bfefff" stop-opacity=".9"/><stop offset="1" stop-color="#bfefff" stop-opacity="0"/></radialGradient>
      <clipPath id="wellClip"><ellipse cx="450" cy="126" rx="338" ry="62"/></clipPath>
      <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <ellipse cx="450" cy="282" rx="190" ry="14" fill="#000" opacity=".5" filter="url(#soft)"/>
    <path d="M300 286c40-9 260-9 300 0l-14-24H314z" fill="url(#stone)" stroke="#8da0d6" stroke-opacity=".35"/>
    <path d="M392 212h116l16 50H376z" fill="url(#stone)" stroke="#8da0d6" stroke-opacity=".3"/>
    <path d="M70 124C84 214 250 258 450 258s366-44 380-134z" fill="url(#stone)" stroke="#9fb0e0" stroke-opacity=".45"/>
    <path d="M70 124C84 214 250 258 450 258" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3"/>
    <g class="band" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${bodyRunes}</g>
    <ellipse cx="450" cy="124" rx="382" ry="86" fill="url(#stoneR)" stroke="#b7c5ee" stroke-opacity=".55"/>
    <ellipse cx="450" cy="124" rx="352" ry="70" fill="none" stroke="#0b1030" stroke-opacity=".6" stroke-width="2"/>
    <g class="rim" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${rimRunes}</g>
    <ellipse cx="450" cy="128" rx="338" ry="62" fill="#0a1230"/>
    <g clip-path="url(#wellClip)">
      <ellipse cx="450" cy="126" rx="338" ry="62" fill="url(#well)"/>
      <g class="swirl s1"><ellipse cx="450" cy="126" rx="270" ry="48" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.2" stroke-dasharray="70 120 30 90" stroke-linecap="round"/></g>
      <g class="swirl s2"><ellipse cx="450" cy="126" rx="190" ry="33" fill="none" stroke="#e8f8ff" stroke-opacity=".8" stroke-width="2" stroke-dasharray="40 80 90 60" stroke-linecap="round"/></g>
      <g class="swirl s3"><ellipse cx="450" cy="126" rx="105" ry="18" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.8" stroke-dasharray="26 50 12 40" stroke-linecap="round"/></g>
      <ellipse class="shine" cx="450" cy="118" rx="120" ry="20" fill="url(#glowB)"/>
      <g class="specks" fill="#fff"><circle cx="300" cy="120" r="1.8"/><circle cx="360" cy="138" r="1.4"/><circle cx="560" cy="112" r="1.8"/><circle cx="610" cy="136" r="1.4"/><circle cx="480" cy="150" r="1.6"/><circle cx="420" cy="104" r="1.2"/></g>
    </g>
    <ellipse cx="450" cy="128" rx="338" ry="62" fill="none" stroke="#dff3ff" stroke-opacity=".45" stroke-width="1.5"/>
  </svg>`;
  }

  /* ---- frasco de vidro com um líquido da cor da categoria ---- */
  let vialN = 0;
  function vial(hue, level, label, count, on) {
    const id = 'vl' + (vialN++);
    const top = 128 - Math.max(0.12, Math.min(1, level)) * 84;
    return `<svg class="vial-svg ${on ? 'on' : ''}" viewBox="0 0 100 168" aria-hidden="true">
      <defs><clipPath id="${id}"><path d="M34 40h32v12c0 4 16 14 16 34v50a14 14 0 0 1-14 14H32a14 14 0 0 1-14-14V86c0-20 16-30 16-34z"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 95% 82%)"/><stop offset="1" stop-color="hsl(${hue} 80% 45%)"/></linearGradient></defs>
      <path d="M36 14h28l-2 26H38z" fill="#8a5a2b" stroke="#d6a45e" stroke-opacity=".7"/><path d="M38 20h24M38 27h24" stroke="#4d3015" stroke-opacity=".5"/>
      <g clip-path="url(#${id})"><rect x="10" y="${top}" width="80" height="100" fill="url(#${id}g)" opacity=".92"/>
        <path class="wave" d="M10 ${top}q10-6 20 0t20 0 20 0 20 0v6H10z" fill="hsl(${hue} 100% 92%)" opacity=".7"/>
        <circle class="bub" cx="40" cy="${top + 30}" r="3" fill="#fff" opacity=".6"/><circle class="bub b2" cx="62" cy="${top + 44}" r="2" fill="#fff" opacity=".6"/></g>
      <path d="M34 40h32v12c0 4 16 14 16 34v50a14 14 0 0 1-14 14H32a14 14 0 0 1-14-14V86c0-20 16-30 16-34z" fill="none" stroke="#cfe0ff" stroke-opacity=".7" stroke-width="2"/>
      <path d="M28 70c-4 8-6 18-6 30" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  /* ---- selo de cera (favoritar) ---- */
  function seal(on) {
    return `<svg class="seal ${on ? 'on' : ''}" viewBox="0 0 52 52" aria-hidden="true">
      <defs><radialGradient id="sealg" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#e8576a"/><stop offset=".55" stop-color="#a51e33"/><stop offset="1" stop-color="#5a0d1c"/></radialGradient></defs>
      ${on
    ? `<path d="M26 3c4 0 6 3 10 3s7 3 7 7 3 6 3 10-3 6-3 10-3 7-7 7-6 3-10 3-6-3-10-3-7-3-7-7-3-6-3-10 3-6 3-10 3-7 7-7 6-3 10-3z" fill="url(#sealg)" stroke="#5a0d1c" stroke-width=".8"/><circle cx="26" cy="26" r="14" fill="none" stroke="#f3a0ad" stroke-opacity=".55" stroke-width="1.2"/><path d="M26 15l3 7 7.5.6-5.7 5 1.8 7.4L26 31l-6.6 4 1.8-7.4-5.7-5L23 22z" fill="#7a1022" stroke="#f6b4bd" stroke-opacity=".6" stroke-width=".8"/>`
    : `<circle cx="26" cy="26" r="21" fill="none" stroke="#b9a37a" stroke-opacity=".8" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M26 15l3 7 7.5.6-5.7 5 1.8 7.4L26 31l-6.6 4 1.8-7.4-5.7-5L23 22z" fill="none" stroke="#8a7550" stroke-opacity=".8" stroke-width="1.4"/>`}
    </svg>`;
  }

  /* ---- círculo de feitiços: cada meta é uma runa que acende ao ser cumprida ---- */
  function spellCircle(goals, doneFn) {
    const n = Math.min(goals.length, 12), R = 78;
    const runes = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2, x = 110 + Math.cos(a) * R, y = 110 + Math.sin(a) * R;
      const on = doneFn(goals[i]);
      return `<g class="rune ${on ? 'on' : ''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="15" class="rb"/><path d="${rune(i)}" transform="scale(.95)"/></g>`;
    }).join('');
    const ticks = Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return `M${(110 + Math.cos(a) * 100).toFixed(1)} ${(110 + Math.sin(a) * 100).toFixed(1)}L${(110 + Math.cos(a) * (i % 4 ? 103 : 107)).toFixed(1)} ${(110 + Math.sin(a) * (i % 4 ? 103 : 107)).toFixed(1)}`; }).join('');
    const done = goals.filter(doneFn).length;
    return `<svg class="spell" viewBox="0 0 220 220" role="img" aria-label="${done} de ${goals.length} feitiços lançados hoje">
      <g class="ring r1"><circle cx="110" cy="110" r="98" fill="none" stroke-dasharray="3 7"/><path d="${ticks}" fill="none"/></g>
      <g class="ring r2"><circle cx="110" cy="110" r="58" fill="none" stroke-dasharray="1 5"/></g>
      <circle cx="110" cy="110" r="94" fill="none" class="outl"/>
      ${n ? '' : '<text x="110" y="118" text-anchor="middle" class="empty-t">sem feitiços</text>'}
      <g class="runes">${runes}</g>
      <text x="110" y="116" text-anchor="middle" class="cnt">${done}<tspan class="of"> / ${goals.length}</tspan></text>
    </svg>`;
  }

  return { ic, SIG, catSig, rune, moonPhase, moonName, moonLit, moonSvg, corners, divider, basin, vial, seal, spellCircle };
})();
