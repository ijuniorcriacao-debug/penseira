/* Efeitos da Penseira: pó de luz subindo devagar ao fundo e a pérola que desce até a bacia ao guardar um pensamento.
   Com "reduzir movimento" ligado, o fundo fica parado e o gesto é dispensado. */
'use strict';
const Magic = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('sky');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, motes = [], last = 0, visible = true;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mote = (any) => ({ x: Math.random() * W, y: any ? Math.random() * H : H + 12, r: rnd(0.7, 1.9), vy: rnd(4, 11), vx: rnd(-4, 4), a: rnd(0.12, 0.4), p: Math.random() * 6.28 });
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    motes = Array.from({ length: W < 700 ? 14 : 26 }, () => mote(true));
    draw(0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const m of motes) {
      ctx.globalAlpha = m.a * (0.55 + 0.45 * Math.sin(t / 1500 + m.p));
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
      g.addColorStop(0, 'rgba(190,236,255,1)'); g.addColorStop(1, 'rgba(190,236,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 5, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function step(t) {
    requestAnimationFrame(step);
    if (!visible) return;
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    for (const m of motes) { m.y -= m.vy * dt; m.x += m.vx * dt + Math.sin(t / 2500 + m.p) * 0.12; if (m.y < -12) Object.assign(m, mote(false)); }
    draw(t);
  }
  /* a pérola que desce do campo de escrita até a bacia */
  function flyToBasin(fromEl, onDone) {
    const basin = document.querySelector('.basin-target');
    if (reduce || !fromEl || !basin) { onDone?.(); return; }
    const a = fromEl.getBoundingClientRect(), b = basin.getBoundingClientRect();
    const sx = a.left + 44, sy = a.top + a.height / 2, ex = b.left + b.width / 2, ey = b.top + b.height * 0.5;
    const pearl = document.createElement('div');
    pearl.className = 'flyorb'; document.body.appendChild(pearl);
    const mx = (sx + ex) / 2 + (ex > sx ? -40 : 40), my = Math.min(sy, ey) - 90, T = 950, t0 = performance.now();
    const tick = (now) => {
      const k = Math.min((now - t0) / T, 1), e = k * k * (3 - 2 * k);
      const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * ex, y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ey;
      pearl.style.transform = `translate(${x}px,${y}px) scale(${1 - 0.45 * k})`;
      pearl.style.opacity = k > 0.88 ? (1 - k) * 8 : 1;
      if (k < 1) requestAnimationFrame(tick);
      else { pearl.remove(); basin.classList.remove('ripple'); void basin.offsetWidth; basin.classList.add('ripple'); onDone?.(); }
    };
    requestAnimationFrame(tick);
  }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  resize();
  if (!reduce) requestAnimationFrame(step);
  return { flyToBasin };
})();
