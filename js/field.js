const canvas = document.getElementById("field");
if (canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0.72, y: 0.28, tx: 0.72, ty: 0.28 };
  const orbs = [
    { x: 0.18, y: 0.22, r: 0.52, hue: 188, a: 0.5, speed: 0.16, phase: 0.4 },
    { x: 0.78, y: 0.18, r: 0.42, hue: 258, a: 0.42, speed: 0.12, phase: 2.1 },
    { x: 0.62, y: 0.78, r: 0.48, hue: 24, a: 0.28, speed: 0.09, phase: 4.2 },
  ];
  let width = 0;
  let height = 0;
  let points = [];
  let running = false;

  function makePoints() {
    const area = width * height;
    const count = Math.max(28, Math.min(reduce ? 36 : 96, Math.floor(area / 16000)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makePoints();
  }

  function paint(time) {
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, width, height);

    for (const orb of orbs) {
      const drift = reduce ? 0 : 1;
      const x = (orb.x + Math.sin(time * orb.speed + orb.phase) * 0.07 * drift) * width;
      const y = (orb.y + Math.cos(time * orb.speed * 0.8 + orb.phase) * 0.06 * drift) * height;
      const radius = orb.r * Math.min(width, height);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `hsla(${orb.hue}, 92%, 64%, ${orb.a})`);
      glow.addColorStop(0.45, `hsla(${orb.hue}, 80%, 48%, ${orb.a * 0.28})`);
      glow.addColorStop(1, "hsla(220, 40%, 4%, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    const px = pointer.x * width;
    const py = pointer.y * height;
    const follow = ctx.createRadialGradient(px, py, 0, px, py, Math.min(width, height) * 0.22);
    follow.addColorStop(0, "hsla(186, 100%, 76%, 0.34)");
    follow.addColorStop(1, "hsla(186, 100%, 76%, 0)");
    ctx.fillStyle = follow;
    ctx.fillRect(0, 0, width, height);

    const linkDistance = Math.min(150, Math.max(88, Math.min(width, height) * 0.16));
    for (const point of points) {
      if (!reduce) {
        const dx = px - point.x;
        const dy = py - point.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 220) {
          point.vx += (dx / dist) * 0.018;
          point.vy += (dy / dist) * 0.018;
        }
        point.x += point.vx;
        point.y += point.vy;
        point.vx *= 0.985;
        point.vy *= 0.985;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
        point.x = Math.max(0, Math.min(width, point.x));
        point.y = Math.max(0, Math.min(height, point.y));
      }
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > linkDistance) continue;
        ctx.strokeStyle = `rgba(214, 244, 255, ${(1 - dist / linkDistance) * 0.28})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (const point of points) {
      ctx.fillStyle = "rgba(244, 251, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const shade = ctx.createLinearGradient(0, height * 0.28, 0, height);
    shade.addColorStop(0, "rgba(7, 8, 13, 0)");
    shade.addColorStop(1, "rgba(7, 8, 13, 0.88)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
  }

  function frame(now) {
    if (!running) return;
    paint(now / 1000);
    if (!reduce) requestAnimationFrame(frame);
  }

  function start() {
    if (running || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  window.addEventListener("pointermove", (event) => {
    pointer.tx = event.clientX / Math.max(width, 1);
    pointer.ty = event.clientY / Math.max(height, 1);
  });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  resize();
  start();
}
