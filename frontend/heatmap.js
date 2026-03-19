// Snoopy小龙虾办公室 - 工作热力图
// GitHub Contribution 风格的90天活跃度可视化

const HEATMAP_COLORS = [
  '#161b22', // level 0: 无活动
  '#0e4429', // level 1: 低
  '#006d32', // level 2: 中低
  '#26a641', // level 3: 中高
  '#39d353'  // level 4: 高
];

const HEATMAP_LABELS = ['无活动', '少量', '一般', '活跃', '非常活跃'];
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const heatmapState = {
  data: null,
  loading: false
};

// ─── Data Fetching ─────────────────────────────────────────

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

// ─── Rendering ─────────────────────────────────────────────

function renderHeatmap(container, data) {
  if (!container || !data || !data.ok) {
    if (container) container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:12px;">热力图加载失败</div>';
    return;
  }

  const days = data.days || [];
  if (days.length === 0) {
    container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:12px;">暂无活动数据</div>';
    return;
  }

  // Build date → level map
  const dateMap = {};
  for (const d of days) {
    dateMap[d.date] = d;
  }

  // Generate 90-day grid (13 weeks × 7 days)
  const today = new Date();
  const todayStr = formatDateStr(today);
  const cellSize = 11;
  const cellGap = 2;
  const totalSize = cellSize + cellGap;

  // Find the start: go back ~90 days to the nearest Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 89);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Calculate weeks
  const weeks = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const week = [];
    for (let dow = 0; dow < 7; dow++) {
      const ds = formatDateStr(cursor);
      const entry = dateMap[ds] || { date: ds, level: 0 };
      const isFuture = cursor > today;
      week.push({ ...entry, isFuture, isToday: ds === todayStr, dow });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const gridWidth = weeks.length * totalSize;
  const gridHeight = 7 * totalSize;

  let html = '';

  // Stats bar
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap;">';
  html += `<span style="color:#39d353;font-size:12px;font-weight:bold;">${data.totalActiveDays || 0}</span>`;
  html += '<span style="color:#6b7280;font-size:10px;">天活跃</span>';
  if (data.currentStreak > 0) {
    html += `<span style="color:#f59e0b;font-size:10px;">🔥 连续 ${data.currentStreak} 天</span>`;
  }
  if (data.longestStreak > 0) {
    html += `<span style="color:#6b7280;font-size:10px;">最长 ${data.longestStreak} 天</span>`;
  }
  html += '</div>';

  // Weekday labels + Grid
  html += '<div style="display:flex;gap:0;">';

  // Weekday column
  html += '<div style="display:flex;flex-direction:column;margin-right:4px;">';
  for (let dow = 0; dow < 7; dow++) {
    const show = dow === 1 || dow === 3 || dow === 5;
    html += `<div style="height:${totalSize}px;line-height:${totalSize}px;font-size:9px;color:#6b7280;width:14px;text-align:right;">${show ? WEEKDAY_LABELS[dow] : ''}</div>`;
  }
  html += '</div>';

  // Grid
  html += `<div style="display:flex;gap:${cellGap}px;overflow-x:auto;padding-bottom:4px;">`;
  for (const week of weeks) {
    html += `<div style="display:flex;flex-direction:column;gap:${cellGap}px;">`;
    for (const day of week) {
      if (day.isFuture) {
        html += `<div style="width:${cellSize}px;height:${cellSize}px;"></div>`;
        continue;
      }
      const color = HEATMAP_COLORS[day.level] || HEATMAP_COLORS[0];
      const border = day.isToday ? 'border:1px solid #fff;' : '';
      const tooltip = `${day.date} · ${HEATMAP_LABELS[day.level]}${day.hasMemo ? ' · 有日记' : ''}${day.reportCount ? ' · ' + day.reportCount + '份报告' : ''}`;
      html += `<div style="width:${cellSize}px;height:${cellSize}px;background:${color};border-radius:2px;${border}cursor:default;" title="${tooltip}"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  html += '</div>';

  // Month labels
  html += '<div style="display:flex;margin-left:18px;margin-top:2px;">';
  let lastMonth = -1;
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i][0];
    if (!firstDay.isFuture) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        html += `<div style="width:${totalSize}px;font-size:9px;color:#6b7280;position:relative;left:${i * totalSize}px;position:absolute;">${monthNames[month]}</div>`;
        lastMonth = month;
      }
    }
  }
  html += '</div>';

  // Legend
  html += '<div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:10px;">';
  html += '<span style="color:#6b7280;font-size:9px;">少</span>';
  for (let i = 0; i < HEATMAP_COLORS.length; i++) {
    html += `<div style="width:${cellSize}px;height:${cellSize}px;background:${HEATMAP_COLORS[i]};border-radius:2px;" title="${HEATMAP_LABELS[i]}"></div>`;
  }
  html += '<span style="color:#6b7280;font-size:9px;">多</span>';
  html += '</div>';

  container.innerHTML = html;
}

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Init ──────────────────────────────────────────────────

async function initHeatmap() {
  const container = document.getElementById('heatmap-container');
  if (!container) return;

  heatmapState.loading = true;
  container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:8px;">加载热力图...</div>';

  const data = await fetchHeatmapData();
  heatmapState.data = data;
  heatmapState.loading = false;

  renderHeatmap(container, data);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initHeatmap, 3000);
});
