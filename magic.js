'use strict';
/* Magia da Penseira: o céu (estrelas, poeira de luz, estrela cadente),
   a trilha de faíscas do cursor e os efeitos de gesto (fio de luz, faíscas). Tudo opcional:
   com "reduzir movimento" ligado, o céu fica parado e nenhum efeito roda. */
const Magic = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('sky');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let stars = [], motes = [], shoot = null, sparks = [], trail = [];
  let last = 0, nextShoot = performance.now() + 6000, visible = true;

  const rnd = (a, b) => a + Math.random() * (b - a);

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 9000);
    stars = Array.from({ length: Math.min(n, 220) }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.85, r: rnd(0.3, 1.5),
      a: rnd(0.25, 1), s: rnd(0.4, 2.2), p: Math.random() * 6.28, warm: Math.random() < 0.18,
    }));
    motes = Array.from({ length: W < 700 ? 22 : 42 }, () => newMote(true));
    if (reduce) draw(0);
  }
  function newMote(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: rnd(0.6, 2.2), vy: rnd(4, 14), vx: rnd(-5, 5), a: rnd(0.15, 0.55), p: Math.random() * 6.28 };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t / 1000 * s.s + s.p);
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = s.warm ? '#ffe2a8' : '#dbe8ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      if (s.r > 1.2) { // brilho em cruz nas estrelas maiores
        ctx.globalAlpha = s.a * tw * 0.35;
        ctx.fillRect(s.x - s.r * 3, s.y - 0.3, s.r * 6, 0.6);
        ctx.fillRect(s.x - 0.3, s.y - s.r * 3, 0.6, s.r * 6);
      }
    }
    for (const m of motes) {
      ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(t / 900 + m.p));
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
      g.addColorStop(0, 'rgba(200,225,255,1)'); g.addColorStop(1, 'rgba(200,225,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 4, 0, 6.283); ctx.fill();
    }
    if (shoot) {
      const k = shoot;
      const g = ctx.createLinearGradient(k.x, k.y, k.x - k.vx * 0.18, k.y - k.vy * 0.18);
      g.addColorStop(0, 'rgba(255,255,255,' + k.life + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x - k.vx * 0.18, k.y - k.vy * 0.18); ctx.stroke();
    }
    for (const p of sparks.concat(trail)) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + p.life * 0.5), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step(t) {
    requestAnimationFrame(step);
    if (!visible) return;
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    for (const m of motes) {
      m.y -= m.vy * dt; m.x += (m.vx + Math.sin(t / 1400 + m.p) * 6) * dt;
      if (m.y < -10 || m.x < -10 || m.x > W + 10) Object.assign(m, newMote(false));
    }
    if (!shoot && t > nextShoot) {
      shoot = { x: rnd(W * 0.2, W * 0.9), y: rnd(0, H * 0.3), vx: -rnd(500, 800), vy: rnd(220, 380), life: 1 };
      nextShoot = t + rnd(9000, 20000);
    }
    if (shoot) { shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt * 0.9; if (shoot.life <= 0) shoot = null; }
    for (const arr of [sparks, trail]) {
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.life -= dt * p.decay;
        if (p.life <= 0) arr.splice(i, 1);
      }
    }
    draw(t);
  }

  /* explosão de faíscas num ponto da tela (gesto de completar algo) */
  function burst(x, y, kind) {
    if (reduce) return;
    const gold = kind === 'gold';
    const pal = gold ? ['#ffe08a', '#ffc65a', '#fff3c4', '#ffffff'] : ['#dff3ff', '#9fe6ff', '#ffffff', '#c7b8ff'];
    for (let i = 0; i < (gold ? 34 : 22); i++) {
      const a = Math.random() * 6.283, v = rnd(40, gold ? 220 : 160);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 160, r: rnd(1, 2.6), life: 1, decay: rnd(0.9, 1.6), c: pal[(Math.random() * pal.length) | 0] });
    }
  }
  function burstAt(el, kind) { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, kind); }

  /* um fio de luz sai de um ponto e voa até a bacia da Penseira */
  function flyToBasin(fromEl, onDone) {
    const basin = document.querySelector('.basin-target');
    if (reduce || !fromEl || !basin) { onDone?.(); return; }
    const a = fromEl.getBoundingClientRect(), b = basin.getBoundingClientRect();
    const sx = a.left + Math.min(a.width * 0.12, 60), sy = a.top + a.height / 2;
    const ex = b.left + b.width / 2, ey = b.top + b.height * 0.5;
    const orb = document.createElement('div');
    orb.className = 'flyorb';
    document.body.appendChild(orb);
    const mx = (sx + ex) / 2 + (Math.random() - 0.5) * 160, my = Math.min(sy, ey) - 140;
    const T = 1000, t0 = performance.now();
    const tick = (now) => {
      const k = Math.min((now - t0) / T, 1), e = k * k * (3 - 2 * k);
      const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * ex;
      const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ey;
      orb.style.transform = `translate(${x}px,${y}px) scale(${1 - 0.5 * k})`;
      orb.style.opacity = k > 0.9 ? (1 - k) * 10 : 1;
      if (Math.random() < 0.7) trail.push({ x, y, vx: rnd(-14, 14), vy: rnd(-10, 14), g: 0, r: rnd(1, 2.4), life: 1, decay: 1.8, c: Math.random() < 0.3 ? '#fff' : '#a8e6ff' });
      if (k < 1) requestAnimationFrame(tick);
      else { orb.remove(); burst(ex, ey, 'silver'); basin.classList.remove('ripple'); void basin.offsetWidth; basin.classList.add('ripple'); onDone?.(); }
    };
    requestAnimationFrame(tick);
  }

  /* trilha de faíscas do cursor (só com mouse) */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    let lx = 0, ly = 0;
    addEventListener('pointermove', (e) => {
      const d = Math.hypot(e.clientX - lx, e.clientY - ly);
      if (d < 14) return; lx = e.clientX; ly = e.clientY;
      trail.push({ x: e.clientX + rnd(-3, 3), y: e.clientY + rnd(-3, 3), vx: rnd(-12, 12), vy: rnd(-6, 20), g: 30, r: rnd(0.8, 1.9), life: 1, decay: 1.5, c: Math.random() < 0.25 ? '#ffe9b0' : '#cfe6ff' });
      if (trail.length > 90) trail.shift();
    }, { passive: true });
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  resize();
  if (!reduce) requestAnimationFrame(step);

  return { burst, burstAt, flyToBasin, reduce };
})();
