// Snoopy小龙虾办公室 - 工作热力图
// GitHub Contribution 风格活跃度可视化，支持30/60/90天切换

const HEATMAP_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const HEATMAP_LABELS = ['无活动', '少量', '一般', '活跃', '非常活跃'];
const HEATMAP_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const HEATMAP_MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const heatmapState = { data: null, loading: false, selectedDate: null, range: 30 };

// ─── Styles ────────────────────────────────────────────

function injectHeatmapStyles() {
  if (document.getElementById('heatmap-v3-styles')) return;
  const s = document.createElement('style');
  s.id = 'heatmap-v3-styles';
  s.textContent = `
    .hm-wrap{font-family:ArkPixel,monospace}
    .hm-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px}
    .hm-range-btns{display:flex;gap:0;border:1px solid #333;border-radius:4px;overflow:hidden}
    .hm-range-btn{padding:2px 8px;font-size:10px;font-family:ArkPixel,monospace;cursor:pointer;background:transparent;border:none;color:#6b7280;transition:all 0.15s}
    .hm-range-btn:not(:last-child){border-right:1px solid #333}
    .hm-range-btn.active{background:#39d353;color:#000;font-weight:bold}
    .hm-range-btn:hover:not(.active){background:rgba(255,255,255,0.05);color:#d1d5db}
    .hm-summary{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
    .hm-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 12px;text-align:center;min-width:55px;flex:1}
    .hm-stat-val{font-size:18px;font-weight:bold;color:#e5e7eb}
    .hm-stat-label{font-size:8px;color:#6b7280;margin-top:2px}
    .hm-recent{display:flex;gap:3px;margin-bottom:12px;align-items:center;flex-wrap:wrap}
    .hm-recent-title{color:#9ca3af;font-size:10px;margin-right:4px;white-space:nowrap}
    .hm-recent-cell{border-radius:3px;cursor:pointer;transition:transform 0.1s,box-shadow 0.15s;flex-shrink:0}
    .hm-recent-cell:hover{transform:scale(1.2);box-shadow:0 0 6px rgba(57,211,83,0.4)}
    .hm-grid-wrap{display:flex;gap:0;overflow-x:auto;padding-bottom:4px}
    .hm-grid-wrap::-webkit-scrollbar{height:4px}
    .hm-grid-wrap::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
    .hm-dow{display:flex;flex-direction:column;margin-right:4px;flex-shrink:0}
    .hm-dow-label{font-size:9px;color:#6b7280;text-align:right;width:14px}
    .hm-grid{display:flex;gap:__GAP__px}
    .hm-week{display:flex;flex-direction:column;gap:__GAP__px}
    .hm-cell{border-radius:__RAD__px;cursor:pointer;transition:transform 0.1s,box-shadow 0.15s}
    .hm-cell:hover{transform:scale(1.3);z-index:1;box-shadow:0 0 8px rgba(57,211,83,0.4)}
    .hm-cell.today{outline:2px solid #fff;outline-offset:-1px}
    .hm-cell.selected{outline:2px solid #06b6d4;outline-offset:-1px;box-shadow:0 0 8px rgba(6,182,212,0.5)}
    .hm-months{display:flex;margin-left:18px;margin-top:3px;position:relative;height:14px}
    .hm-month-label{position:absolute;font-size:9px;color:#6b7280}
    .hm-legend{display:flex;align-items:center;justify-content:flex-end;gap:3px;margin-top:8px}
    .hm-legend span{font-size:9px;color:#6b7280}
    .hm-detail{margin-top:10px;background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-radius:8px;padding:10px 12px;font-size:11px;color:#d1d5db;animation:hm-fadein 0.2s ease}
    .hm-detail-close{float:right;cursor:pointer;color:#6b7280;font-size:12px;padding:0 4px}
    .hm-detail-close:hover{color:#e5e7eb}
    @keyframes hm-fadein{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  `;
  document.head.appendChild(s);
}

// ─── Data ──────────────────────────────────────────────

async function fetchHeatmapData() {
  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';
    const resp = await fetch(base + '/stats/heatmap?t=' + Date.now(), { cache: 'no-store' });
    return await resp.json();
  } catch (e) {
    console.error('Heatmap fetch failed:', e);
    return null;
  }
}

// ─── Render ────────────────────────────────────────────

function renderHeatmap(container, data) {
  if (!container) return;
  if (!data || !data.ok) {
    container.innerHTML = '<div style="color:#4b5563;font-size:11px;text-align:center;padding:12px;">热力图加载失败</div>';
    return;
  }

  const allDays = data.days || [];
  if (allDays.length === 0) {
    container.innerHTML = '<div style="color:#4b5563;font-size:11px;text-align:center;padding:12px;">暂无活动数据</div>';
    return;
  }

  const range = heatmapState.range;
  // Cell size adapts to range: fewer days = bigger cells
  const cellSize = range <= 30 ? 16 : range <= 60 ? 13 : 11;
  const cellGap = range <= 30 ? 3 : 2;
  const cellRad = range <= 30 ? 3 : 2;
  const totalSize = cellSize + cellGap;

  // Filter days to selected range
  const days = allDays.slice(0, range);
  const dateMap = {};
  for (const d of days) dateMap[d.date] = d;

  const today = new Date();
  const todayStr = hmFmtDate(today);

  // Align start to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - (range - 1));
  start.setDate(start.getDate() - start.getDay());

  // Build weeks
  const weeks = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week = [];
    for (let dow = 0; dow < 7; dow++) {
      const ds = hmFmtDate(cursor);
      const entry = dateMap[ds] || { date: ds, level: 0 };
      const isBeforeRange = cursor < new Date(today.getFullYear(), today.getMonth(), today.getDate() - range + 1);
      week.push({ ...entry, isFuture: cursor > today, isOutOfRange: isBeforeRange, isToday: ds === todayStr, dow });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Update dynamic CSS vars
  const styleEl = document.getElementById('heatmap-v3-styles');
  if (styleEl) {
    let css = styleEl.textContent;
    css = css.replace(/__GAP__/g, String(cellGap)).replace(/__RAD__/g, String(cellRad));
    styleEl.textContent = css;
  }

  let html = '<div class="hm-wrap">';

  // ── Header: title + range toggle ──
  html += '<div class="hm-header">';
  html += '<div class="hm-range-btns">';
  for (const r of [30, 60, 90]) {
    const active = range === r ? ' active' : '';
    html += `<button class="hm-range-btn${active}" onclick="hmSetRange(${r})">${r}天</button>`;
  }
  html += '</div>';
  html += '</div>';

  // ── Summary cards ──
  const summary = data.summary || {};
  const activeDays = summary.activeDays || data.totalActiveDays || 0;
  const curStreak = summary.currentStreak || data.currentStreak || 0;
  const lonStreak = summary.longestStreak || data.longestStreak || 0;
  const thisWeek = summary.thisWeekActive || 0;
  const lastWeek = summary.lastWeekActive || 0;

  html += '<div class="hm-summary">';
  html += hmStatCard(String(activeDays), '天活跃', '#39d353');
  if (curStreak > 0) {
    html += hmStatCard(`🔥${curStreak}`, '连续', '#f59e0b');
  }
  html += hmStatCard(String(lonStreak), '最长连续', '#06b6d4');
  if (thisWeek > 0 || lastWeek > 0) {
    const diff = thisWeek - lastWeek;
    const trend = diff > 0 ? `↑${diff}` : diff < 0 ? `↓${Math.abs(diff)}` : '→';
    const trendColor = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#6b7280';
    html += hmStatCard(trend, '周环比', trendColor);
  }
  html += '</div>';

  // ── Recent 14-day strip (large cells, always visible) ──
  html += '<div class="hm-recent">';
  html += '<span class="hm-recent-title">近14天</span>';
  const recent14 = allDays.slice(0, 14).reverse(); // oldest to newest (left to right)
  for (const day of recent14) {
    const color = HEATMAP_COLORS[day.level] || HEATMAP_COLORS[0];
    const isToday = day.date === todayStr;
    const sel = day.date === heatmapState.selectedDate ? 'outline:2px solid #06b6d4;' : '';
    const todayBorder = isToday ? 'outline:2px solid #fff;outline-offset:-1px;' : '';
    const title = `${day.date} · ${HEATMAP_LABELS[day.level]}`;
    html += `<div class="hm-recent-cell" style="width:18px;height:18px;background:${color};${sel}${todayBorder}" title="${title}" onclick="hmSelectDay('${day.date}')"></div>`;
  }
  html += '</div>';

  // ── Full grid ──
  html += '<div class="hm-grid-wrap">';

  // Weekday labels
  html += '<div class="hm-dow">';
  for (let dow = 0; dow < 7; dow++) {
    const show = dow === 1 || dow === 3 || dow === 5;
    html += `<div class="hm-dow-label" style="height:${totalSize}px;line-height:${totalSize}px;">${show ? HEATMAP_WEEKDAYS[dow] : ''}</div>`;
  }
  html += '</div>';

  // Cells
  html += `<div style="display:flex;gap:${cellGap}px;">`;
  for (const week of weeks) {
    html += `<div style="display:flex;flex-direction:column;gap:${cellGap}px;">`;
    for (const day of week) {
      if (day.isFuture) {
        html += `<div style="width:${cellSize}px;height:${cellSize}px;"></div>`;
        continue;
      }
      if (day.isOutOfRange) {
        html += `<div style="width:${cellSize}px;height:${cellSize}px;background:#0d1117;border-radius:${cellRad}px;opacity:0.3;"></div>`;
        continue;
      }
      const color = HEATMAP_COLORS[day.level] || HEATMAP_COLORS[0];
      const classes = ['hm-cell'];
      if (day.isToday) classes.push('today');
      if (day.date === heatmapState.selectedDate) classes.push('selected');

      html += `<div class="${classes.join(' ')}" style="width:${cellSize}px;height:${cellSize}px;background:${color};" data-date="${day.date}" onclick="hmSelectDay('${day.date}')" title="${day.date} · ${HEATMAP_LABELS[day.level]}"></div>`;
    }
    html += '</div>';
  }
  html += '</div></div>';

  // ── Month labels ──
  html += '<div class="hm-months">';
  let lastMonth = -1;
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i].find(d => !d.isFuture && !d.isOutOfRange);
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        html += `<div class="hm-month-label" style="left:${18 + i * totalSize}px;">${HEATMAP_MONTHS[month]}</div>`;
        lastMonth = month;
      }
    }
  }
  html += '</div>';

  // ── Legend ──
  html += '<div class="hm-legend">';
  html += '<span>少</span>';
  for (let i = 0; i < HEATMAP_COLORS.length; i++) {
    html += `<div style="width:${cellSize}px;height:${cellSize}px;background:${HEATMAP_COLORS[i]};border-radius:${cellRad}px;" title="${HEATMAP_LABELS[i]}"></div>`;
  }
  html += '<span>多</span>';
  html += '</div>';

  // ── Detail panel ──
  html += '<div id="hm-detail-panel"></div>';
  html += '</div>';

  container.innerHTML = html;

  if (heatmapState.selectedDate) hmRenderDetail(heatmapState.selectedDate);
}

function hmStatCard(value, label, color) {
  return `<div class="hm-stat"><div class="hm-stat-val" style="color:${color};">${value}</div><div class="hm-stat-label">${label}</div></div>`;
}

// ─── Range Toggle ──────────────────────────────────────

window.hmSetRange = function(range) {
  heatmapState.range = range;
  heatmapState.selectedDate = null;
  const container = document.getElementById('heatmap-container');
  if (container && heatmapState.data) {
    renderHeatmap(container, heatmapState.data);
  }
};

// ─── Day Detail ────────────────────────────────────────

window.hmSelectDay = function(dateStr) {
  if (heatmapState.selectedDate === dateStr) {
    heatmapState.selectedDate = null;
    const panel = document.getElementById('hm-detail-panel');
    if (panel) panel.innerHTML = '';
    document.querySelectorAll('.hm-cell.selected, .hm-recent-cell[style*="outline: 2px solid"]').forEach(el => {
      el.classList.remove('selected');
      el.style.removeProperty('outline');
    });
    return;
  }

  heatmapState.selectedDate = dateStr;
  // Re-render to update selection state (simpler than manual DOM updates)
  const container = document.getElementById('heatmap-container');
  if (container && heatmapState.data) {
    renderHeatmap(container, heatmapState.data);
  }
};

function hmRenderDetail(dateStr) {
  const panel = document.getElementById('hm-detail-panel');
  if (!panel || !heatmapState.data) return;

  const day = (heatmapState.data.days || []).find(d => d.date === dateStr);
  if (!day) { panel.innerHTML = ''; return; }

  const levelColor = HEATMAP_COLORS[day.level] || HEATMAP_COLORS[0];
  const levelLabel = HEATMAP_LABELS[day.level] || '未知';

  const d = new Date(dateStr + 'T00:00:00');
  const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
  const todayStr = hmFmtDate(new Date());
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  let dateLabel = `${weekday} ${dateStr}`;
  if (dateStr === todayStr) dateLabel = `今天 ${dateStr}`;
  else if (dateStr === hmFmtDate(yesterday)) dateLabel = `昨天 ${dateStr}`;

  let html = '<div class="hm-detail">';
  html += `<span class="hm-detail-close" onclick="hmSelectDay('${dateStr}')">✕</span>`;
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">`;
  html += `<div style="width:14px;height:14px;border-radius:3px;background:${levelColor};flex-shrink:0;"></div>`;
  html += `<span style="font-size:12px;font-weight:bold;">${dateLabel}</span>`;
  html += `<span style="color:${levelColor};font-size:10px;margin-left:auto;border:1px solid ${levelColor}44;padding:1px 6px;border-radius:3px;">${levelLabel}</span>`;
  html += '</div>';

  // Detail items with icons
  html += '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:#9ca3af;margin-top:4px;">';
  html += `<span style="color:${day.hasMemo ? '#22c55e' : '#4b5563'};">${day.hasMemo ? '📝 有日记' : '📝 无日记'}</span>`;
  html += `<span style="color:${day.reportCount > 0 ? '#3b82f6' : '#4b5563'};">📋 ${day.reportCount || 0} 份报告</span>`;

  // Level bar
  html += '<span style="display:flex;align-items:center;gap:3px;">';
  for (let i = 0; i < 4; i++) {
    const filled = i < day.level;
    html += `<div style="width:8px;height:8px;border-radius:2px;background:${filled ? '#39d353' : '#1f2937'};"></div>`;
  }
  html += ` Lv.${day.level}</span>`;
  html += '</div>';

  html += '</div>';
  panel.innerHTML = html;
}

function hmFmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Init ──────────────────────────────────────────────

async function initHeatmap() {
  const container = document.getElementById('heatmap-container');
  if (!container) return;

  injectHeatmapStyles();
  heatmapState.loading = true;
  container.innerHTML = '<div style="color:#4b5563;font-size:11px;text-align:center;padding:8px;">加载热力图...</div>';

  const data = await fetchHeatmapData();
  heatmapState.data = data;
  heatmapState.loading = false;

  // Auto-select range based on data: if active days < 15, show 30 days
  if (data && data.ok) {
    const active = (data.days || []).filter(d => d.level > 0);
    if (active.length <= 15) heatmapState.range = 30;
    else if (active.length <= 40) heatmapState.range = 60;
    else heatmapState.range = 90;
  }

  renderHeatmap(container, data);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initHeatmap, 2500);
});
