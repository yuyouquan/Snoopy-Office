// Snoopy小龙虾办公室 - 工作热力图
// GitHub Contribution 风格的90天活跃度可视化

const HEATMAP_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const HEATMAP_LABELS = ['无活动', '少量', '一般', '活跃', '非常活跃'];
const HEATMAP_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const HEATMAP_MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const heatmapState = { data: null, loading: false, selectedDate: null };

// ─── Styles ────────────────────────────────────────────

function injectHeatmapStyles() {
  if (document.getElementById('heatmap-v2-styles')) return;
  const s = document.createElement('style');
  s.id = 'heatmap-v2-styles';
  s.textContent = `
    .hm-wrap{font-family:ArkPixel,monospace}
    .hm-summary{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
    .hm-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:6px 10px;text-align:center;min-width:60px;flex:1}
    .hm-stat-val{font-size:16px;font-weight:bold;color:#e5e7eb}
    .hm-stat-label{font-size:8px;color:#6b7280;margin-top:2px}
    .hm-grid-wrap{display:flex;gap:0;overflow-x:auto;padding-bottom:4px}
    .hm-grid-wrap::-webkit-scrollbar{height:4px}
    .hm-grid-wrap::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
    .hm-dow{display:flex;flex-direction:column;margin-right:4px;flex-shrink:0}
    .hm-dow-label{font-size:9px;color:#6b7280;text-align:right;width:14px}
    .hm-grid{display:flex;gap:2px}
    .hm-week{display:flex;flex-direction:column;gap:2px}
    .hm-cell{width:11px;height:11px;border-radius:2px;cursor:pointer;transition:transform 0.1s,box-shadow 0.15s}
    .hm-cell:hover{transform:scale(1.4);z-index:1;box-shadow:0 0 6px rgba(57,211,83,0.4)}
    .hm-cell.today{border:1.5px solid #fff}
    .hm-cell.selected{border:1.5px solid #06b6d4;box-shadow:0 0 8px rgba(6,182,212,0.5)}
    .hm-months{display:flex;margin-left:18px;margin-top:3px;position:relative;height:14px}
    .hm-month-label{position:absolute;font-size:9px;color:#6b7280}
    .hm-legend{display:flex;align-items:center;justify-content:flex-end;gap:3px;margin-top:8px}
    .hm-legend span{font-size:9px;color:#6b7280}
    .hm-legend-cell{width:11px;height:11px;border-radius:2px}
    .hm-detail{margin-top:8px;background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-radius:8px;padding:10px 12px;font-size:11px;color:#d1d5db;animation:hm-fadein 0.2s ease}
    .hm-detail-close{float:right;cursor:pointer;color:#6b7280;font-size:12px;padding:0 4px}
    .hm-detail-close:hover{color:#e5e7eb}
    .hm-trend{display:flex;align-items:center;gap:4px;font-size:10px;margin-top:4px}
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
    container.innerHTML = '<div style="color:#4b5563;font-size:11px;text-align:center;padding:12px;">热力图数载失败</div>';
    return;
  }

  const days = data.days || [];
  if (days.length === 0) {
    container.innerHTML = '<div style="color:#4b5563;font-size:11px;text-align:center;padding:12px;">暂无活动数据</div>';
    return;
  }

  const dateMap = {};
  for (const d of days) dateMap[d.date] = d;

  const today = new Date();
  const todayStr = hmFmtDate(today);
  const cellSize = 11;
  const gap = 2;
  const totalSize = cellSize + gap;

  // Align start to Sunday, ~90 days ago
  const start = new Date(today);
  start.setDate(start.getDate() - 89);
  start.setDate(start.getDate() - start.getDay());

  // Build weeks grid
  const weeks = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week = [];
    for (let dow = 0; dow < 7; dow++) {
      const ds = hmFmtDate(cursor);
      const entry = dateMap[ds] || { date: ds, level: 0 };
      week.push({ ...entry, isFuture: cursor > today, isToday: ds === todayStr, dow });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  let html = '<div class="hm-wrap">';

  // ── Summary cards ──
  const summary = data.summary || {};
  const activeDays = summary.activeDays || data.totalActiveDays || 0;
  const curStreak = summary.currentStreak || data.currentStreak || 0;
  const lonStreak = summary.longestStreak || data.longestStreak || 0;
  const thisWeek = summary.thisWeekActive || 0;
  const lastWeek = summary.lastWeekActive || 0;

  html += '<div class="hm-summary">';
  html += hmStatCard(String(activeDays), '天活跃', '#39d353');
  html += hmStatCard(curStreak > 0 ? `🔥${curStreak}` : '0', '连续天数', '#f59e0b');
  html += hmStatCard(String(lonStreak), '最长连续', '#06b6d4');

  // Week-over-week trend
  if (thisWeek > 0 || lastWeek > 0) {
    const diff = thisWeek - lastWeek;
    const trend = diff > 0 ? `↑${diff}` : diff < 0 ? `↓${Math.abs(diff)}` : '→';
    const trendColor = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#6b7280';
    html += hmStatCard(trend, '周环比', trendColor);
  }
  html += '</div>';

  // ── Grid ──
  html += '<div class="hm-grid-wrap">';

  // Weekday labels
  html += '<div class="hm-dow">';
  for (let dow = 0; dow < 7; dow++) {
    const show = dow === 1 || dow === 3 || dow === 5;
    html += `<div class="hm-dow-label" style="height:${totalSize}px;line-height:${totalSize}px;">${show ? HEATMAP_WEEKDAYS[dow] : ''}</div>`;
  }
  html += '</div>';

  // Cells
  html += '<div class="hm-grid">';
  for (const week of weeks) {
    html += '<div class="hm-week">';
    for (const day of week) {
      if (day.isFuture) {
        html += `<div style="width:${cellSize}px;height:${cellSize}px;"></div>`;
        continue;
      }
      const color = HEATMAP_COLORS[day.level] || HEATMAP_COLORS[0];
      const classes = ['hm-cell'];
      if (day.isToday) classes.push('today');
      if (day.date === heatmapState.selectedDate) classes.push('selected');

      html += `<div class="${classes.join(' ')}" style="background:${color};" data-date="${day.date}" onclick="hmSelectDay('${day.date}')" title="${day.date}"></div>`;
    }
    html += '</div>';
  }
  html += '</div></div>';

  // ── Month labels ──
  html += '<div class="hm-months">';
  let lastMonth = -1;
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i].find(d => !d.isFuture);
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
    html += `<div class="hm-legend-cell" style="background:${HEATMAP_COLORS[i]};" title="${HEATMAP_LABELS[i]}"></div>`;
  }
  html += '<span>多</span>';
  html += '</div>';

  // ── Detail panel (for selected date) ──
  html += '<div id="hm-detail-panel"></div>';

  html += '</div>';
  container.innerHTML = html;

  // Render detail if a date is selected
  if (heatmapState.selectedDate) {
    hmRenderDetail(heatmapState.selectedDate);
  }
}

function hmStatCard(value, label, color) {
  return `<div class="hm-stat"><div class="hm-stat-val" style="color:${color};">${value}</div><div class="hm-stat-label">${label}</div></div>`;
}

// ─── Day Detail ────────────────────────────────────────

window.hmSelectDay = function(dateStr) {
  if (heatmapState.selectedDate === dateStr) {
    heatmapState.selectedDate = null;
    const panel = document.getElementById('hm-detail-panel');
    if (panel) panel.innerHTML = '';
    // Remove selected class
    document.querySelectorAll('.hm-cell.selected').forEach(el => el.classList.remove('selected'));
    return;
  }

  // Update selected
  document.querySelectorAll('.hm-cell.selected').forEach(el => el.classList.remove('selected'));
  const cell = document.querySelector(`.hm-cell[data-date="${dateStr}"]`);
  if (cell) cell.classList.add('selected');

  heatmapState.selectedDate = dateStr;
  hmRenderDetail(dateStr);
};

function hmRenderDetail(dateStr) {
  const panel = document.getElementById('hm-detail-panel');
  if (!panel) return;

  const data = heatmapState.data;
  if (!data || !data.days) { panel.innerHTML = ''; return; }

  const day = data.days.find(d => d.date === dateStr);
  if (!day) { panel.innerHTML = ''; return; }

  const levelColor = HEATMAP_COLORS[day.level] || HEATMAP_COLORS[0];
  const levelLabel = HEATMAP_LABELS[day.level] || '未知';

  // Format date nicely
  const d = new Date(dateStr + 'T00:00:00');
  const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
  const todayStr = hmFmtDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = hmFmtDate(yesterday);
  let dateLabel = `${weekday} ${dateStr}`;
  if (dateStr === todayStr) dateLabel = `今天 ${dateStr}`;
  else if (dateStr === yesterdayStr) dateLabel = `昨天 ${dateStr}`;

  let html = '<div class="hm-detail">';
  html += `<span class="hm-detail-close" onclick="hmSelectDay('${dateStr}')">✕</span>`;
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">`;
  html += `<div style="width:12px;height:12px;border-radius:3px;background:${levelColor};"></div>`;
  html += `<span style="font-size:12px;font-weight:bold;">${dateLabel}</span>`;
  html += `<span style="color:${levelColor};font-size:10px;margin-left:auto;">${levelLabel}</span>`;
  html += '</div>';

  html += '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:10px;color:#9ca3af;">';
  html += `<span>${day.hasMemo ? '📝 有日记' : '📝 无日记'}</span>`;
  html += `<span>📋 ${day.reportCount || 0} 份报告</span>`;
  html += `<span>⬛ 活跃等级 ${day.level}/4</span>`;
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

  renderHeatmap(container, data);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initHeatmap, 2500);
});
