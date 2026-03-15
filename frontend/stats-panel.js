// Snoopy小龙虾办公室 - 统计面板
// 纯CSS可视化：今日时间线、周概览、Cron健康度、Agent排行榜

const STATE_COLORS = {
  idle: '#6b7280',
  writing: '#3b82f6',
  executing: '#f59e0b',
  syncing: '#8b5cf6',
  researching: '#06b6d4',
  error: '#ef4444'
};

const STATE_LABELS = {
  idle: '空闲', writing: '写作', executing: '执行',
  syncing: '同步', researching: '研究', error: '异常'
};

const STATS_FONT = 'ArkPixel, monospace';
const STATS_SECTION_TITLE_COLOR = '#9ca3af';
const STATS_DIVIDER = 'border-top:1px solid #333;margin:8px 0;';

// ─── Helpers ───────────────────────────────────────────

function statsGetApiBase() {
  return (typeof getApiBase === 'function') ? getApiBase() : '';
}

function formatTokenCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function padTime(h) {
  return String(h).padStart(2, '0') + ':00';
}

function formatDuration(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}小时${m}分` : `${h}小时`;
  }
  return `${Math.round(minutes)}分钟`;
}

// ─── Styles (injected once) ────────────────────────────

function injectStatsStyles() {
  if (document.getElementById('stats-panel-styles')) return;
  const style = document.createElement('style');
  style.id = 'stats-panel-styles';
  style.textContent = `
    #stats-dashboard {
      background: rgba(0,0,0,0.4);
      border: 1px solid #333;
      border-radius: 6px;
      padding: 10px;
      font-family: ${STATS_FONT};
      max-height: 300px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #444 transparent;
    }
    #stats-dashboard::-webkit-scrollbar { width: 4px; }
    #stats-dashboard::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
    .stats-section-title {
      color: ${STATS_SECTION_TITLE_COLOR};
      font-size: 11px;
      margin-bottom: 6px;
    }
    .stats-timeline-bar {
      display: flex;
      height: 20px;
      border-radius: 4px;
      overflow: hidden;
      background: #1f2937;
      position: relative;
    }
    .stats-timeline-segment {
      height: 100%;
      position: relative;
      min-width: 2px;
      transition: opacity 0.15s;
    }
    .stats-timeline-segment:hover { opacity: 0.8; }
    .stats-tooltip {
      display: none;
      position: absolute;
      bottom: 26px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      color: #e5e7eb;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      z-index: 10;
      pointer-events: none;
      border: 1px solid #444;
    }
    .stats-timeline-segment:hover .stats-tooltip { display: block; }
    .stats-time-markers {
      display: flex;
      justify-content: space-between;
      margin-top: 3px;
      color: #6b7280;
      font-size: 9px;
    }
    .stats-weekly-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 50px;
    }
    .stats-weekly-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      gap: 3px;
    }
    .stats-weekly-bar {
      width: 100%;
      border-radius: 2px;
      background: #374151;
      transition: height 0.3s;
    }
    .stats-weekly-label {
      font-size: 9px;
      color: #6b7280;
    }
    .stats-weekly-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    .stats-health-bar {
      display: flex;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      background: #1f2937;
    }
    .stats-leaderboard-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #d1d5db;
      padding: 2px 0;
    }
    .stats-leaderboard-rank {
      color: #6b7280;
      font-size: 10px;
      width: 16px;
      text-align: right;
    }
    .stats-leaderboard-tokens {
      margin-left: auto;
      color: #9ca3af;
      font-size: 10px;
    }
  `;
  document.head.appendChild(style);
}

// ─── Today Timeline ────────────────────────────────────

function renderTodayTimeline(container, timeline) {
  let html = `<div class="stats-section-title">今日时间线</div>`;

  if (!timeline || timeline.length === 0) {
    html += `<div style="color:#6b7280;font-size:11px;text-align:center;padding:8px;">今日暂无活动记录</div>`;
    container.innerHTML = html;
    return;
  }

  const totalMinutes = timeline.reduce((sum, seg) => sum + (seg.durationMin || 0), 0);

  html += `<div class="stats-timeline-bar">`;
  for (const seg of timeline) {
    const pct = totalMinutes > 0 ? ((seg.durationMin || 0) / totalMinutes) * 100 : 0;
    const color = STATE_COLORS[seg.state] || '#6b7280';
    const label = STATE_LABELS[seg.state] || seg.state;
    const startStr = seg.startTime || '--:--';
    const endStr = seg.endTime || '--:--';
    const durStr = formatDuration(seg.durationMin || 0);
    html += `<div class="stats-timeline-segment" style="width:${pct}%;background:${color};">`;
    html += `<div class="stats-tooltip">状态: ${label}, ${startStr}-${endStr}, ${durStr}</div>`;
    html += `</div>`;
  }
  html += `</div>`;

  const markers = [6, 9, 12, 15, 18, 21];
  html += `<div class="stats-time-markers">`;
  for (const h of markers) {
    html += `<span>${padTime(h)}</span>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

// ─── Weekly Chart ──────────────────────────────────────

function renderWeeklyChart(container, days) {
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
  let html = `<div class="stats-section-title">本周概览</div>`;

  if (!days || days.length === 0) {
    html += `<div style="color:#6b7280;font-size:11px;text-align:center;padding:8px;">暂无本周数据</div>`;
    container.innerHTML = html;
    return;
  }

  const today = new Date();
  const todayDay = today.getDay();
  // JS: 0=Sun => map to index: Mon=0 ... Sun=6
  const todayIdx = todayDay === 0 ? 6 : todayDay - 1;

  html += `<div class="stats-weekly-bars">`;
  for (let i = 0; i < 7; i++) {
    const day = days[i] || {};
    const hasMemo = Boolean(day.hasMemo);
    const isToday = i === todayIdx;
    const barHeight = hasMemo ? 40 : 6;
    const barColor = isToday
      ? (hasMemo ? '#3b82f6' : '#1e40af')
      : (hasMemo ? '#4b5563' : '#374151');
    const dotColor = hasMemo ? '#22c55e' : 'transparent';
    const labelColor = isToday ? '#e5e7eb' : '#6b7280';

    html += `<div class="stats-weekly-col">`;
    html += `<div class="stats-weekly-bar" style="height:${barHeight}px;background:${barColor};"></div>`;
    html += `<div class="stats-weekly-dot" style="background:${dotColor};"></div>`;
    html += `<span class="stats-weekly-label" style="color:${labelColor};">${weekLabels[i]}</span>`;
    html += `</div>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

// ─── Cron Health ───────────────────────────────────────

function renderCronHealth(container) {
  const data = (typeof openclawData !== 'undefined') ? openclawData : null;
  let html = `<div class="stats-section-title">Cron 健康度</div>`;

  if (!data || !data.cronJobs || data.cronJobs.length === 0) {
    html += `<div style="color:#6b7280;font-size:11px;">暂无任务数据</div>`;
    container.innerHTML = html;
    return;
  }

  const jobs = data.cronJobs;
  const total = jobs.length;
  const okCount = jobs.filter(j => j.lastStatus === 'ok').length;
  const errCount = jobs.filter(j => j.lastStatus === 'error').length;
  const rate = total > 0 ? Math.round((okCount / total) * 100) : 0;

  let rateColor = '#22c55e';
  if (rate < 70) rateColor = '#ef4444';
  else if (rate < 90) rateColor = '#eab308';

  const okPct = total > 0 ? (okCount / total) * 100 : 0;

  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">`;
  html += `<span style="color:${rateColor};font-size:16px;font-weight:bold;">${rate}%</span>`;
  html += `<span style="color:#9ca3af;font-size:10px;">${total}个任务 · 成功率 ${rate}%</span>`;
  html += `</div>`;

  html += `<div class="stats-health-bar">`;
  html += `<div style="width:${okPct}%;background:#22c55e;height:100%;"></div>`;
  if (errCount > 0) {
    const errPct = (errCount / total) * 100;
    html += `<div style="width:${errPct}%;background:#ef4444;height:100%;"></div>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

// ─── Agent Leaderboard ─────────────────────────────────

function renderAgentLeaderboard(container) {
  const data = (typeof openclawData !== 'undefined') ? openclawData : null;
  let html = `<div class="stats-section-title">Agent 排行 (Token 消耗)</div>`;

  const agents = (data && data.agentDetails) ? data.agentDetails : [];

  if (agents.length === 0) {
    html += `<div style="color:#6b7280;font-size:11px;">暂无 Agent 数据</div>`;
    container.innerHTML = html;
    return;
  }

  const sorted = [...agents]
    .filter(a => typeof a.totalTokens === 'number')
    .sort((a, b) => (b.totalTokens || 0) - (a.totalTokens || 0))
    .slice(0, 5);

  const rankEmojis = ['🥇', '🥈', '🥉', '4', '5'];

  for (let i = 0; i < sorted.length; i++) {
    const agent = sorted[i];
    const emoji = agent.emoji || '🤖';
    const rank = i < 3 ? rankEmojis[i] : `${i + 1}`;
    const tokens = formatTokenCount(agent.totalTokens || 0);
    const name = agent.name || agent.id || 'Unknown';

    html += `<div class="stats-leaderboard-row">`;
    html += `<span class="stats-leaderboard-rank">${rank}</span>`;
    html += `<span>${emoji}</span>`;
    html += `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>`;
    html += `<span class="stats-leaderboard-tokens">${tokens}</span>`;
    html += `</div>`;
  }

  container.innerHTML = html;
}

// ─── Main Orchestration ────────────────────────────────

async function fetchAndRenderStats() {
  const dashboard = document.getElementById('stats-dashboard');
  if (!dashboard) return;

  // Ensure section containers exist
  const sectionIds = ['stats-timeline', 'stats-weekly', 'stats-cron', 'stats-leaderboard'];
  for (const id of sectionIds) {
    if (!document.getElementById(id)) {
      const div = document.createElement('div');
      div.id = id;
      if (id !== 'stats-timeline') {
        div.style.cssText = STATS_DIVIDER;
      }
      dashboard.appendChild(div);
    }
  }

  // Render sections that use global openclawData (no fetch needed)
  renderCronHealth(document.getElementById('stats-cron'));
  renderAgentLeaderboard(document.getElementById('stats-leaderboard'));

  // Fetch timeline + weekly data in parallel
  const base = statsGetApiBase();
  const results = await Promise.allSettled([
    fetch(base + '/stats/today-timeline?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
    fetch(base + '/stats/weekly?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json())
  ]);

  const timelineData = results[0].status === 'fulfilled' ? results[0].value : null;
  const weeklyData = results[1].status === 'fulfilled' ? results[1].value : null;

  renderTodayTimeline(
    document.getElementById('stats-timeline'),
    (timelineData && timelineData.ok) ? timelineData.timeline : null
  );
  renderWeeklyChart(
    document.getElementById('stats-weekly'),
    (weeklyData && weeklyData.ok) ? weeklyData.days : null
  );
}

function refreshStatsPanel() {
  fetchAndRenderStats().catch(err => {
    console.error('Stats panel refresh failed:', err);
  });
}

function initStatsPanel() {
  injectStatsStyles();

  const dashboard = document.getElementById('stats-dashboard');
  if (!dashboard) {
    console.warn('stats-panel: #stats-dashboard not found');
    return;
  }

  fetchAndRenderStats().catch(err => {
    console.error('Stats panel init failed:', err);
  });
}

// Export for external use
window.refreshStatsPanel = refreshStatsPanel;

document.addEventListener('DOMContentLoaded', initStatsPanel);
