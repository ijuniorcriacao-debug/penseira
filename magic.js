'use strict';
/* O céu da Penseira, discreto: poucas estrelas que cintilam devagar, um pó de luz quase invisível,
   uma estrela cadente rara. E um único gesto: ao guardar um pensamento, uma pérola de luz desce até a bacia.
   Com "reduzir movimento" ligado, o céu fica parado e o gesto é dispensado. */
const Magic = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('sky');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, stars = [], motes = [], shoot = null, last = 0, nextShoot = performance.now() + 25000, visible = true;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(Math.round((W * H) / 16000), 120) }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.9, r: rnd(0.3, 1.1), a: rnd(0.2, 0.75), s: rnd(0.25, 1.1), p: Math.random() * 6.28 }));
    motes = Array.from({ length: W < 700 ? 8 : 16 }, () => mote(true));
    if (reduce) draw(0);
  }
  const mote = (any) => ({ x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: rnd(0.5, 1.4), vy: rnd(3, 8), vx: rnd(-3, 3), a: rnd(0.08, 0.28), p: Math.random() * 6.28 });

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#dfe8ff';
    for (const s of stars) {
      ctx.globalAlpha = s.a * (reduce ? 1 : 0.6 + 0.4 * Math.sin((t / 1000) * s.s + s.p));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    for (const m of motes) {
      ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(t / 1400 + m.p));
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
      g.addColorStop(0, 'rgba(210,228,255,1)'); g.addColorStop(1, 'rgba(210,228,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 4, 0, 6.283); ctx.fill();
    }
    if (shoot) {
      const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 0.16, shoot.y - shoot.vy * 0.16);
      g.addColorStop(0, `rgba(255,255,255,${shoot.life * 0.8})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 0.16, shoot.y - shoot.vy * 0.16); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function step(t) {
    requestAnimationFrame(step);
    if (!visible) return;
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    for (const m of motes) { m.y -= m.vy * dt; m.x += m.vx * dt; if (m.y < -10) Object.assign(m, mote(false)); }
    if (!shoot && t > nextShoot) { shoot = { x: rnd(W * 0.3, W * 0.95), y: rnd(0, H * 0.25), vx: -rnd(420, 640), vy: rnd(160, 260), life: 1 }; nextShoot = t + rnd(40000, 90000); }
    if (shoot) { shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt * 0.95; if (shoot.life <= 0) shoot = null; }
    draw(t);
  }

  /* a pérola que desce do campo de escrita até a bacia */
  function flyToBasin(fromEl, onDone) {
    const basin = document.querySelector('.basin-target');
    if (reduce || !fromEl || !basin) { onDone?.(); return; }
    const a = fromEl.getBoundingClientRect(), b = basin.getBoundingClientRect();
    const sx = a.left + 54, sy = a.top + a.height / 2, ex = b.left + b.width / 2, ey = b.top + b.height * 0.52;
    const pearl = document.createElement('div');
    pearl.className = 'flyorb';
    document.body.appendChild(pearl);
    const mx = (sx + ex) / 2 + (ex > sx ? -40 : 40), my = Math.min(sy, ey) - 110, T = 900, t0 = performance.now();
    const tick = (now) => {
      const k = Math.min((now - t0) / T, 1), e = k * k * (3 - 2 * k);
      const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * ex;
      const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ey;
      pearl.style.transform = `translate(${x}px,${y}px) scale(${1 - 0.45 * k})`;
      pearl.style.opacity = k > 0.88 ? (1 - k) * 8 : 1;
      if (k < 1) requestAnimationFrame(tick);
      else { pearl.remove(); basin.classList.remove('ripple'); void basin.offsetWidth; basin.classList.add('ripple'); onDone?.(); }
    };
    requestAnimationFrame(tick);
  }

  const burst = () => {}, burstAt = () => {}; // sem efeitos de faísca: o app é sóbrio nos gestos
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  resize();
  if (!reduce) requestAnimationFrame(step);
  return { burst, burstAt, flyToBasin, reduce };
})();
