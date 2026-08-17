export function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || undefined;
}

export function gridColor() {
  return cssVar('--border-soft') || '#ebeef2';
}

export function tickColor() {
  return cssVar('--text-faint') || '#9aa3b2';
}

export function chartBaseOptions(yUnit = '') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cssVar('--ink') || '#0e1520',
        titleFont: { family: 'Manrope', weight: 700 },
        bodyFont: { family: 'JetBrains Mono' },
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx) => ctx.parsed.y + yUnit },
      },
    },
    scales: {
      y: { grid: { color: gridColor() }, ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 11 } } },
      x: { grid: { display: false }, ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
    },
  };
}

export function genSeries(base, amp, range) {
  const points = range === '24h' ? 24 : range === '7d' ? 56 : 30;
  const labels = [];
  const data = [];
  for (let i = points - 1; i >= 0; i--) {
    let lbl;
    if (range === '24h') lbl = ((24 - i) % 24) + ':00';
    else if (range === '7d') lbl = 'D-' + Math.floor(i / 8);
    else lbl = 'D-' + i;
    labels.push(lbl);
    const wave = Math.sin(i / (range === '24h' ? 3.2 : 5)) * amp;
    const noise = (Math.random() - 0.5) * amp * 0.4;
    data.push(+(base + wave + noise).toFixed(1));
  }
  return { labels, data };
}
