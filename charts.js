/* =========================================================
   ASHA – simple, readable line charts (no libraries)
   ========================================================= */
function drawLineChart(canvas, cfg) {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  if (!w || !h) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const fontPx = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.78;
  const font = `${fontPx}px "Atkinson Hyperlegible", system-ui, sans-serif`;
  const pad = { l: fontPx * 3.4, r: fontPx * 1.6, t: fontPx * 1.4, b: fontPx * 2.6 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;

  const values = cfg.series.flatMap((s) => s.data).filter((v) => v != null);
  if (!values.length) {
    ctx.fillStyle = '#5a6b82';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillText('No readings yet', w / 2, h / 2);
    return;
  }
  let min = Math.min(...values, cfg.band ? cfg.band[0] : Infinity);
  let max = Math.max(...values, cfg.band ? cfg.band[1] : -Infinity);
  const span = max - min || Math.max(1, Math.abs(max) * 0.1);
  min -= span * 0.15; max += span * 0.15;
  if (cfg.floor != null) min = Math.max(min, cfg.floor);

  const n = cfg.labels.length;
  const x = (i) => pad.l + (n === 1 ? cw / 2 : (i * cw) / (n - 1));
  const y = (v) => pad.t + ch - ((v - min) / (max - min)) * ch;

  // Normal-range band
  if (cfg.band) {
    const y1 = y(cfg.band[1]), y0 = y(cfg.band[0]);
    ctx.fillStyle = 'rgba(19, 112, 58, 0.08)';
    ctx.fillRect(pad.l, y1, cw, y0 - y1);
    ctx.strokeStyle = 'rgba(19, 112, 58, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    [y1, y0].forEach((yy) => { ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(pad.l + cw, yy); ctx.stroke(); });
    ctx.setLineDash([]);
  }

  // Grid + Y labels
  ctx.font = font;
  ctx.fillStyle = '#5a6b82';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const v = min + ((max - min) * i) / steps;
    const yy = y(v);
    ctx.strokeStyle = '#e6ecf2';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(pad.l + cw, yy); ctx.stroke();
    ctx.fillText(cfg.decimals ? v.toFixed(cfg.decimals) : Math.round(v), pad.l - 10, yy);
  }

  // X labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(cw / (fontPx * 4.5)))));
  cfg.labels.forEach((l, i) => {
    if (i % every === 0 || i === n - 1) {
      ctx.fillStyle = i === n - 1 ? '#0a6660' : '#5a6b82';
      ctx.fillText(l, x(i), pad.t + ch + 10);
    }
  });

  // Lines
  cfg.series.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    s.data.forEach((v, i) => {
      if (v == null) return;
      if (!started) { ctx.moveTo(x(i), y(v)); started = true; } else ctx.lineTo(x(i), y(v));
    });
    ctx.stroke();

    s.data.forEach((v, i) => {
      if (v == null) return;
      const flagged = s.flags && s.flags[i] && s.flags[i] !== 'normal';
      ctx.beginPath();
      ctx.arc(x(i), y(v), flagged ? 6.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = flagged ? (s.flags[i] === 'alert' ? '#b42020' : '#e0a52e') : '#fff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = flagged ? '#fff' : s.color;
      ctx.stroke();
    });

    // Label last value
    for (let i = s.data.length - 1; i >= 0; i--) {
      if (s.data[i] != null) {
        ctx.font = `700 ${fontPx}px "Atkinson Hyperlegible", system-ui, sans-serif`;
        ctx.fillStyle = s.color;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(s.data[i]), x(i) - 6, y(s.data[i]) - 8);
        break;
      }
    }
  });
}
