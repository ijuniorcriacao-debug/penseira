'use strict';
/* Arte da Penseira, toda em SVG: ícones de traço fino, a lua do dia, a bacia e o mostrador das metas. */
const Art = (() => {
  const SIG = {
    foto: '<path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5H8l1.3-2h5.4L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.3"/>',
    hoje: '<path d="M20 14.5A8 8 0 1 1 9.6 4a6.4 6.4 0 0 0 10.4 10.5z"/>',
    penseira: '<path d="M3.5 12.5h17"/><path d="M4.5 12.5c.5 4 3.6 7 7.5 7s7-3 7.5-7"/><path d="M9 20.5h6"/><path d="M12 10.5c-2.2-1.7 1.6-3 0-5.2"/>',
    frentes: '<path d="M6 3.5h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z"/><path d="M6 17.5a2 2 0 0 1 2-2h11"/>',
    agenda: '<path d="M7 3.5h10M7 20.5h10"/><path d="M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5"/>',
    frases: '<path d="M6 12V9.5A3.5 3.5 0 0 1 9.5 6M6 12h4v5H6zM14 12V9.5A3.5 3.5 0 0 1 17.5 6M14 12h4v5h-4z"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M8.5 21h7"/>',
    pena: '<path d="M20 4c-8.5 0-13.5 5-14.5 12.5L3.5 20.5l4-2C15 17.5 20 12.5 20 4z"/><path d="M8 16l6-6"/>',
    lupa: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    estrela: '<path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2 6.4 20.3l1.2-6.3L3 9.6l6.3-.8z"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    mais3: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    sino: '<path d="M6 17c1-1.5 1.5-3 1.5-6a4.5 4.5 0 0 1 9 0c0 3 .5 4.5 1.5 6z"/><path d="M10 20.5a2 2 0 0 0 4 0M12 4V3"/>',
    losango: '<path d="M12 3l7 9-7 9-7-9z"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${SIG[n] || ''}</svg>`;

  /* ---- a lua do dia: a fase vem da data ---- */
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
      <defs><radialGradient id="${id}l" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#fbfaf2"/><stop offset=".6" stop-color="#e4e9f6"/><stop offset="1" stop-color="#b4c0de"/></radialGradient></defs>
      <circle cx="${c}" cy="${c}" r="${r}" fill="#0d1328" stroke="#8d9bc4" stroke-opacity=".35"/>${lit}
      <g fill="#7f8db8" fill-opacity=".22"><circle cx="24" cy="26" r="4"/><circle cx="38" cy="38" r="5"/><circle cx="30" cy="44" r="2.4"/></g></svg>`;
  }

  const corners = () => '';
  const divider = () => '<svg class="divider" viewBox="0 0 120 10" aria-hidden="true"><path d="M2 5h48M70 5h48" stroke="currentColor" stroke-width="1" opacity=".5"/><path d="M60 1l4 4-4 4-4-4z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';

  /* ---- a bacia: pedra escura, borda de luar, líquido de prata e fios de névoa ---- */
  function basin() {
    const ticks = Array.from({ length: 96 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2, x1 = 450 + Math.cos(a) * 349, y1 = 110 + Math.sin(a) * 71, x2 = 450 + Math.cos(a) * (i % 4 ? 353 : 357), y2 = 110 + Math.sin(a) * (i % 4 ? 73 : 75);
      return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }).join('');
    return `<svg class="basin-svg" viewBox="0 -150 900 410" role="img" aria-label="Ilustração decorativa">
    <defs>
      <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3556"/><stop offset=".55" stop-color="#151c38"/><stop offset="1" stop-color="#0a0e20"/></linearGradient>
      <linearGradient id="br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46517a"/><stop offset=".5" stop-color="#252e52"/><stop offset="1" stop-color="#171d3a"/></linearGradient>
      <radialGradient id="lq" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#e9f3ff"/><stop offset=".32" stop-color="#bcd5f0"/><stop offset=".66" stop-color="#5f87bf"/><stop offset="1" stop-color="#172857"/></radialGradient>
      <linearGradient id="wp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#cfe2ff" stop-opacity="0"/></linearGradient>
      <clipPath id="wc"><ellipse cx="450" cy="114" rx="324" ry="59"/></clipPath>
      <filter id="bl"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="bl2"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <g class="wisps" fill="none" stroke="url(#wp)" stroke-linecap="round" filter="url(#bl)">
      <path d="M430 104C400 60 470 30 436 -20S470 -90 448 -140" stroke-width="2.2"/>
      <path d="M480 106C520 70 450 40 492 0S470 -80 500 -125" stroke-width="1.6"/>
      <path d="M390 108C360 80 410 56 380 20S395 -50 372 -92" stroke-width="1.2"/>
    </g>
    <ellipse cx="450" cy="248" rx="210" ry="9" fill="#000" opacity=".55" filter="url(#bl2)"/>
    <path d="M330 250C380 242 520 242 570 250l-20-18H350z" fill="url(#bw)" stroke="#fff" stroke-opacity=".08"/>
    <path d="M406 196h88l10 38H396z" fill="url(#bw)" stroke="#fff" stroke-opacity=".07"/>
    <path d="M92 112C104 186 262 226 450 226s346-40 358-114z" fill="url(#bw)" stroke="#fff" stroke-opacity=".1"/>
    <path d="M150 168C230 206 330 218 450 218" fill="none" stroke="#e9eefb" stroke-opacity=".08" stroke-width="1"/>
    <ellipse cx="450" cy="110" rx="362" ry="78" fill="url(#br)" stroke="#e9eefb" stroke-opacity=".28"/>
    <path d="${ticks}" stroke="#e9eefb" stroke-opacity=".22" stroke-width="1" fill="none"/>
    <ellipse cx="450" cy="112" rx="334" ry="66" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2"/>
    <ellipse cx="450" cy="114" rx="326" ry="60" fill="#060a1d"/>
    <g clip-path="url(#wc)">
      <ellipse cx="450" cy="114" rx="324" ry="59" fill="url(#lq)"/>
      <g class="swirl s1"><ellipse cx="450" cy="114" rx="250" ry="42" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="80 160 30 120" stroke-linecap="round"/></g>
      <g class="swirl s2"><ellipse cx="450" cy="114" rx="160" ry="27" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="40 90 70 80" stroke-linecap="round"/></g>
      <ellipse class="shine" cx="450" cy="104" rx="120" ry="16" fill="#fff" opacity=".24" filter="url(#bl2)"/>
    </g>
    <ellipse cx="450" cy="114" rx="324" ry="59" fill="none" stroke="#eaf3ff" stroke-opacity=".4"/>
  </svg>`;
  }

  /* ---- mostrador das metas: um segmento por meta, preenchido quando cumprida ---- */
  function dial(goals, doneFn) {
    const n = Math.max(goals.length, 1), gap = n > 1 ? 7 : 0, span = 360 / n - gap, R = 78;
    const pt = (deg) => { const a = ((deg - 90) * Math.PI) / 180; return [110 + Math.cos(a) * R, 110 + Math.sin(a) * R]; };
    const segs = Array.from({ length: n }, (_, i) => {
      const a0 = i * (360 / n) + gap / 2, a1 = a0 + span, [x0, y0] = pt(a0), [x1, y1] = pt(a1), big = span > 180 ? 1 : 0;
      const on = goals[i] && doneFn(goals[i]);
      return `<path d="M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" class="seg ${on ? 'on' : ''}"/>`;
    }).join('');
    const ticks = Array.from({ length: 60 }, (_, i) => { const a = (i / 60) * Math.PI * 2, r1 = 96, r2 = i % 5 ? 99 : 103; return `M${(110 + Math.cos(a) * r1).toFixed(1)} ${(110 + Math.sin(a) * r1).toFixed(1)}L${(110 + Math.cos(a) * r2).toFixed(1)} ${(110 + Math.sin(a) * r2).toFixed(1)}`; }).join('');
    const done = goals.filter((g) => doneFn(g)).length;
    return `<svg class="dial" viewBox="0 0 220 220" role="img" aria-label="${done} de ${goals.length} metas cumpridas hoje">
      <path d="${ticks}" class="ticks"/>${goals.length ? segs : '<circle cx="110" cy="110" r="78" class="seg"/>'}
      <text x="110" y="124" text-anchor="middle" class="cnt">${done}</text>
      <text x="110" y="146" text-anchor="middle" class="of">${goals.length ? `de ${goals.length}` : 'sem metas'}</text></svg>`;
  }

  return { ic, SIG, moonPhase, moonName, moonLit, moonSvg, corners, divider, basin, dial };
})();
