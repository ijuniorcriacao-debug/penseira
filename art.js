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

  /* ---- a bacia: água de luz azul, aro com pontos, fios prateados subindo ---- */
  function basin() {
    const dots = Array.from({ length: 22 }, (_, i) => {
      const t = (i / 22) * Math.PI * 2, x = 300 + Math.cos(t) * 252, y = 198 + Math.sin(t) * 54;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 2 ? 1.6 : 2.2}"/>`;
    }).join('');
    return `<svg class="basin-svg" viewBox="0 -150 600 440" role="img" aria-label="Penseira: bacia de luz onde os pensamentos pousam">
    <defs>
      <linearGradient id="bg-bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4778"/><stop offset=".6" stop-color="#151c42"/><stop offset="1" stop-color="#080c22"/></linearGradient>
      <linearGradient id="bg-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8bbd"/><stop offset=".5" stop-color="#363f6e"/><stop offset="1" stop-color="#232b55"/></linearGradient>
      <radialGradient id="bg-liq" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="#f1fdff"/><stop offset=".22" stop-color="#a6efff"/><stop offset=".5" stop-color="#3fb4f2"/><stop offset=".82" stop-color="#1a4fb4"/><stop offset="1" stop-color="#0b1c58"/></radialGradient>
      <linearGradient id="bg-wisp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2fdff" stop-opacity=".95"/><stop offset=".6" stop-color="#bfe8ff" stop-opacity=".45"/><stop offset="1" stop-color="#bfe8ff" stop-opacity="0"/></linearGradient>
      <clipPath id="bg-clip"><ellipse cx="300" cy="200" rx="232" ry="44"/></clipPath>
      <filter id="bg-b1"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="bg-b2"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <g class="wisps" fill="none" stroke="url(#bg-wisp)" stroke-linecap="round" filter="url(#bg-b1)">
      <path class="w1" d="M290 196C250 140 340 110 292 50S330 -40 296 -130" stroke-width="2.4"/>
      <path class="w2" d="M330 198C380 150 300 120 346 64S318 -30 352 -110" stroke-width="1.8"/>
      <path class="w3" d="M246 200C206 160 272 126 236 76S262 -10 232 -86" stroke-width="1.4"/>
      <path class="w4" d="M392 200C428 168 366 140 398 98S380 14 410 -52" stroke-width="1.2"/>
      <path class="w5" d="M300 198C282 150 322 100 304 34" stroke-width="1"/>
    </g>
    <ellipse cx="300" cy="280" rx="170" ry="9" fill="#000" opacity=".55" filter="url(#bg-b2)"/>
    <path d="M52 200C62 262 168 282 300 282s238-20 248-82z" fill="url(#bg-bowl)" stroke="#bcd0ff" stroke-opacity=".12"/>
    <ellipse cx="300" cy="198" rx="266" ry="62" fill="url(#bg-rim)" stroke="#dbe6ff" stroke-opacity=".38"/>
    <g class="rimdots" fill="#e6f1ff" fill-opacity=".6">${dots}</g>
    <ellipse cx="300" cy="200" rx="244" ry="50" fill="#050820" stroke="#000" stroke-opacity=".5"/>
    <g clip-path="url(#bg-clip)">
      <ellipse cx="300" cy="200" rx="232" ry="44" fill="url(#bg-liq)"/>
      <g class="swirl s1"><ellipse cx="300" cy="200" rx="176" ry="32" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-dasharray="70 150 26 110" stroke-linecap="round"/></g>
      <g class="swirl s2"><ellipse cx="300" cy="200" rx="108" ry="20" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.1" stroke-dasharray="36 80 60 70" stroke-linecap="round"/></g>
      <ellipse class="core" cx="300" cy="196" rx="70" ry="13" fill="#fff" opacity=".55" filter="url(#bg-b2)"/>
    </g>
    <ellipse cx="300" cy="200" rx="232" ry="44" fill="none" stroke="#e3f6ff" stroke-opacity=".5"/>
  </svg>`;
  }

  return { ic, SIG, basin };
})();
