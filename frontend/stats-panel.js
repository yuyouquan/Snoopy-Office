// Snoopy小龙虾办公室 - 工作数据统计面板
// 今日时间线、周概览、Cron健康度、Agent排行榜

const STATE_COLORS = {
  idle: '#6b7280', writing: '#3b82f6', executing: '#f59e0b',
  syncing: '#8b5cf6', researching: '#06b6d4', error: '#ef4444'
};
const STATE_LABELS = {
  idle: '空闲', writing: '写作', executing: '执行',
  syncing: '同步', researching: '研究', error: '异常'
};

// ─── Helpers ─────────────────────────────────────────────

function statsGetApiBase() {
  return (typeof getApiBase === 'function') ? getApiBase() : '';
}

function statsFmtTokens(n) {
  if (!n || n <= 0) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function statsFmtDuration(min) {
  if (!min || min <= 0) return '0分';
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }
  return `${Math.round(min)}m`;
}

// ─── Styles ──────────────────────────────────────────────

function injectStatsStyles() {
  if (document.getElementById('stats-v2-styles')) return;
  const s = document.createElement('style');
  s.id = 'stats-v2-styles';
  s.textContent = `
    #stats-dashboard{font-family:ArkPixel,monospace;max-height:360px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#444 transparent}
    #stats-dashboard::-webkit-scrollbar{width:4px}
    #stats-dashboard::-webkit-scrollbar-thumb{background:#444;border-radius:2px}
    .sp-section{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .sp-section:last-child{border-bottom:none}
    .sp-title{color:#9ca3af;font-size:10px;margin-bottom:6px;display:flex;align-items:center;gap:6px}
    .sp-title b{color:#d1d5db;font-size:11px}
    .sp-timeline{display:flex;height:24px;border-radius:5px;overflow:hidden;background:#1a1a2e;position:relative}
    .sp-seg{height:100%;position:relative;min-width:3px;cursor:default;transition:filter 0.15s}
    .sp-seg:hover{filter:brightness(1.3)}
    .sp-seg:hover .sp-tip{display:block}
    .sp-tip{display:none;position:absolute;bottom:28px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.92);color:#e5e7eb;font-size:10px;padding:4px 8px;border-radius:4px;white-space:nowrap;z-index:10;pointer-events:none;border:1px solid #444;box-shadow:0 2px 8px rgba(0,0,0,0.4)}
    .sp-markers{display:flex;justify-content:space-between;margin-top:3px;color:#4b5563;font-size:8px}
    .sp-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
    .sp-legend-item{display:flex;align-items:center;gap:3px;font-size:9px;color:#9ca3af}
    .sp-legend-dot{width:8px;height:8px;border-radius:2px}
    .sp-bars{display:flex;align-items:flex-end;gap:4px;height:56px;padding:0 2px}
    .sp-bar-col{display:flex;flex-direction:column;align-items:center;flex:1;gap:2px}
    .sp-bar{width:100%;border-radius:3px 3px 1px 1px;transition:height 0.4s cubic-bezier(0.34,1.56,0.64,1);position:relative;cursor:default}
    .sp-bar:hover .sp-tip{display:block}
    .sp-bar-label{font-size:9px;color:#6b7280}
    .sp-bar-count{font-size:8px;color:#6b7280;margin-top:1px}
    .sp-health{display:flex;align-items:center;gap:10px}
    .sp-health-ring{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative}
    .sp-health-pct{font-size:14px;font-weight:bold}
    .sp-health-info{flex:1}
    .sp-health-bar{height:4px;border-radius:2px;background:#1f2937;overflow:hidden;margin-top:4px;display:flex;}
    .sp-lb-row{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:#d1d5db}
    .sp-lb-row:hover{background:rgba(255,255,255,0.03);border-radius:4px}
    .sp-lb-rank{width:18px;text-align:center;font-size:12px}
    .sp-lb-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sp-lb-val{color:#9ca3af;font-size:10px;font-variant-numeric:tabular-nums}
    .sp-empty{color:#4b5563;font-size:11px;text-align:center;padding:10px 0}
    .sp-summary-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
    .sp-summary-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:6px 10px;flex:1;min-width:70px;text-align:center}
    .sp-summary-val{font-size:16px;font-weight:bold;color:#e5e7eb}
    .sp-summary-label{font-size:9px;color:#6b7280;margin-top:2px}
  `;
  document.head.appendChild(s);
}

// ─── Today Timeline ──────────────────────────────────────

function renderTodayTimeline(el, data) {
  if (!el) return;
  const timeline = (data && data.timeline) || [];
  const totalMin = (data && data.totalActiveMin) || 0;
  const curState = (data && data.currentState) || 'idle';

  let html = '<div class="sp-section">';
  html += `<div class="sp-title">📅 <b>今日活动</b>`;
  if (totalMin > 0) {
    html += `<span style="margin-left:auto;color:#22c55e;font-size:10px;">${statsFmtDuration(totalMin)} 活跃</span>`;
  }
  html += '</div>';

  if (timeline.length === 0) {
    // Show current state summary instead of empty
    const color = STATE_COLORS[curState] || '#6b7280';
    const label = STATE_LABELS[curState] || curState;
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">`;
    html += `<div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></div>`;
    html += `<span style="color:${color};font-size:12px;">当前状态: ${label}</span>`;
    html += `</div>`;
    html += `<div style="color:#4b5563;font-size:10px;">今日暂无状态切换记录</div>`;
  } else {
    // Timeline bar
    const totalDur = timeline.reduce((s, seg) => s + (seg.durationMin || 1), 0);
    html += '<div class="sp-timeline">';
    for (const seg of timeline) {
      const pct = Math.max((seg.durationMin || 1) / totalDur * 100, 2);
      const color = STATE_COLORS[seg.state] || '#6b7280';
      const label = STATE_LABELS[seg.state] || seg.state;
      const start = seg.startTime || '--:--';
      const end = seg.endTime || '--:--';
      const dur = statsFmtDuration(seg.durationMin || 0);
      html += `<div class="sp-seg" style="width:${pct}%;background:${color};">`;
      html += `<div class="sp-tip">${label} · ${start}-${end} · ${dur}</div>`;
      html += '</div>';
    }
    html += '</div>';

    // Time markers
    html += '<div class="sp-markers">';
    for (const h of [6, 9, 12, 15, 18, 21]) {
      html += `<span>${String(h).padStart(2, '0')}:00</span>`;
    }
    html += '</div>';

    // State legend
    const usedStates = [...new Set(timeline.map(s => s.state))];
    if (usedStates.length > 0) {
      html += '<div class="sp-legend">';
      for (const st of usedStates) {
        html += `<div class="sp-legend-item"><div class="sp-legend-dot" style="background:${STATE_COLORS[st] || '#6b7280'};"></div>${STATE_LABELS[st] || st}</div>`;
      }
      html += '</div>';
    }
  }
  html += '</div>';
  el.innerHTML = html;
}

// ─── Weekly Chart ────────────────────────────────────────

function renderWeeklyChart(el, days) {
  if (!el) return;
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
  const today = new Date();
  const todayDow = today.getDay();
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

  let html = '<div class="sp-section">';
  html += '<div class="sp-title">📊 <b>本周概览</b></div>';

  if (!days || days.length === 0) {
    html += '<div class="sp-empty">暂无本周数据</div>';
    el.innerHTML = html + '</div>';
    return;
  }

  // Find max reportCount for scaling
  const maxReports = Math.max(1, ...days.map(d => d.reportCount || 0));
  const maxBarH = 48;

  html += '<div class="sp-bars">';
  for (let i = 0; i < 7 && i < days.length; i++) {
    const day = days[i] || {};
    const isToday = i === todayIdx;
    const reports = day.reportCount || 0;
    const hasMemo = Boolean(day.hasMemo);

    // Bar height: proportional to reports, minimum 4px if has activity
    const hasActivity = hasMemo || reports > 0;
    const barH = hasActivity ? Math.max(6, (reports / maxReports) * maxBarH) : 3;

    // Color
    let barColor;
    if (isToday) {
      barColor = hasActivity ? '#3b82f6' : '#1e3a5f';
    } else {
      barColor = hasActivity ? '#374151' : '#1f2937';
    }

    // Gradient for active days
    const barStyle = hasActivity && reports > 0
      ? `background:linear-gradient(180deg,${isToday ? '#60a5fa' : '#4b5563'},${barColor});`
      : `background:${barColor};`;

    const labelColor = isToday ? '#e5e7eb' : '#6b7280';
    const dateStr = day.date || '';

    html += '<div class="sp-bar-col">';
    html += `<div class="sp-bar" style="height:${barH}px;${barStyle}" title="${dateStr}${hasMemo ? ' · 有日记' : ''}${reports ? ' · ' + reports + '份报告' : ''}">`;
    if (reports > 0) {
      html += `<div class="sp-tip">${dateStr}<br>${reports}份报告${hasMemo ? ' · 有日记' : ''}</div>`;
    }
    html += '</div>';
    // Memo indicator dot
    if (hasMemo) {
      html += '<div style="width:4px;height:4px;border-radius:50%;background:#22c55e;"></div>';
    } else {
      html += '<div style="width:4px;height:4px;"></div>';
    }
    html += `<span class="sp-bar-label" style="color:${labelColor};${isToday ? 'font-weight:bold;' : ''}">${weekLabels[i]}</span>`;
    html += '</div>';
  }
  html += '</div>';

  // Summary row
  const totalReports = days.reduce((s, d) => s + (d.reportCount || 0), 0);
  const memoDays = days.filter(d => d.hasMemo).length;
  html += `<div style="display:flex;justify-content:space-between;margin-top:6px;color:#6b7280;font-size:9px;">`;
  html += `<span>📝 ${memoDays}天有日记</span>`;
  html += `<span>📋 ${totalReports}份报告</span>`;
  html += `<span style="color:#22c55e;">●</span> = 有日记`;
  html += '</div>';

  html += '</div>';
  el.innerHTML = html;
}

// ─── Cron Health ─────────────────────────────────────────

function renderCronHealth(el) {
  if (!el) return;
  const data = (typeof window.openclawData !== 'undefined' && window.openclawData) ? window.openclawData : null;

  let html = '<div class="sp-section">';
  html += '<div class="sp-title">⏰ <b>Cron 健康度</b></div>';

  if (!data || !data.cronJobs || data.cronJobs.length === 0) {
    html += '<div class="sp-empty">暂无任务数据</div>';
    el.innerHTML = html + '</div>';
    return;
  }

  const jobs = data.cronJobs;
  const total = jobs.length;
  const okCount = jobs.filter(j => j.lastStatus === 'ok').length;
  const errCount = jobs.filter(j => j.lastStatus === 'error').length;
  const runCount = jobs.filter(j => j.lastStatus === 'running').length;
  const rate = total > 0 ? Math.round((okCount / total) * 100) : 0;

  let rateColor = '#22c55e';
  if (rate < 70) rateColor = '#ef4444';
  else if (rate < 90) rateColor = '#eab308';

  // Ring + info layout
  html += '<div class="sp-health">';

  // Circular gauge using conic-gradient
  const okDeg = (okCount / total) * 360;
  const errDeg = okDeg + (errCount / total) * 360;
  html += `<div class="sp-health-ring" style="background:conic-gradient(#22c55e 0deg ${okDeg}deg, #ef4444 ${okDeg}deg ${errDeg}deg, #374151 ${errDeg}deg 360deg);">`;
  html += `<div style="width:32px;height:32px;border-radius:50%;background:#0f0f1a;display:flex;align-items:center;justify-content:center;">`;
  html += `<span class="sp-health-pct" style="color:${rateColor};">${rate}%</span>`;
  html += '</div></div>';

  // Info text
  html += '<div class="sp-health-info">';
  html += `<div style="display:flex;gap:10px;font-size:10px;flex-wrap:wrap;">`;
  html += `<span style="color:#22c55e;">✅ ${okCount} 正常</span>`;
  if (errCount > 0) html += `<span style="color:#ef4444;">❌ ${errCount} 异常</span>`;
  if (runCount > 0) html += `<span style="color:#f59e0b;">⏳ ${runCount} 运行</span>`;
  html += '</div>';
  html += `<div style="color:#6b7280;font-size:9px;margin-top:3px;">共 ${total} 个定时任务</div>`;

  // Mini bar
  html += '<div class="sp-health-bar">';
  html += `<div style="width:${(okCount / total) * 100}%;height:100%;background:#22c55e;"></div>`;
  if (errCount > 0) html += `<div style="width:${(errCount / total) * 100}%;height:100%;background:#ef4444;"></div>`;
  html += '</div>';
  html += '</div></div>';

  // Placeholder for 7-day trend mini
  html += '<div id="sp-cron-trend-mini" style="margin-top:6px;"></div>';

  html += '</div>';
  el.innerHTML = html;
}

// ─── Cron 7-day Trend Mini ───────────────────────────────────
function renderCronTrendMini(el, weeklyData) {
  if (!el) return;

  const days = (weeklyData && weeklyData.cron_stats) || [];

  let html = '';
  if (days.length === 0) {
    // No historical data available
    html = '<div style="font-size:9px;color:#6b7280;margin-bottom:3px;">7日成功率趋势</div>';
    html += '<div style="color:#4b5563;font-size:9px;padding:6px 0;">暂无7日历史数据</div>';
  } else {
    // Render from weekly data if available
    html = '<div style="font-size:9px;color:#6b7280;margin-bottom:3px;">7日成功率趋势</div>';
    html += '<div style="display:flex;gap:3px;">';
    for (let i = 0; i < Math.min(7, days.length); i++) {
      const day = days[i];
      const rate = (day.ok_count / Math.max(1, day.ok_count + day.err_count)) || 0;
      const color = rate >= 0.9 ? '#22c55e' : rate >= 0.7 ? '#eab308' : rate >= 0.5 ? '#f59e0b' : '#ef4444';
      html += `<div style="flex:1;height:8px;border-radius:2px;background:${color};" title="${day.date || ''} ${Math.round(rate * 100)}%"></div>`;
    }
    html += '</div>';
  }

  el.innerHTML = html;
}

// ─── Agent Leaderboard ───────────────────────────────────

function renderAgentLeaderboard(el) {
  if (!el) return;
  const data = (typeof window.openclawData !== 'undefined' && window.openclawData) ? window.openclawData : null;
  const agents = (data && data.agentDetails) ? data.agentDetails : [];

  let html = '<div class="sp-section">';
  html += '<div class="sp-title">🏆 <b>Agent 排行</b>';
  if (agents.length > 0) {
    html += `<span style="margin-left:auto;color:#6b7280;font-size:9px;">Token消耗</span>`;
  }
  html += '</div>';

  if (agents.length === 0) {
    html += '<div class="sp-empty">暂无 Agent 数据</div>';
    el.innerHTML = html + '</div>';
    return;
  }

  const sorted = [...agents]
    .map(a => ({
      ...a,
      _tokens: (a.totalInputTokens !== undefined && a.totalOutputTokens !== undefined)
        ? (a.totalInputTokens || 0) + (a.totalOutputTokens || 0)
        : (a.totalTokens || 0)
    }))
    .filter(a => a._tokens > 0)
    .sort((a, b) => b._tokens - a._tokens)
    .slice(0, 5);

  const rankIcons = ['🥇', '🥈', '🥉'];

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const rank = i < 3 ? rankIcons[i] : `<span style="color:#4b5563;">${i + 1}</span>`;
    const statusDot = a.status === 'active' ? '🟢' : a.status === 'idle' ? '🟡' : '';

    html += '<div class="sp-lb-row">';
    html += `<span class="sp-lb-rank">${rank}</span>`;
    html += `<span>${a.emoji || '🤖'}</span>`;
    html += `<span class="sp-lb-name">${a.name || 'Unknown'} ${statusDot}</span>`;
    html += `<span class="sp-lb-val">🪙 ${statsFmtTokens(a._tokens)}</span>`;
    html += '</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

// ─── Orchestration ───────────────────────────────────────

async function fetchAndRenderStats() {
  const dashboard = document.getElementById('stats-dashboard');
  if (!dashboard) return;

  // Ensure section containers
  for (const id of ['stats-timeline', 'stats-weekly', 'stats-cron', 'stats-leaderboard']) {
    if (!document.getElementById(id)) {
      const div = document.createElement('div');
      div.id = id;
      dashboard.appendChild(div);
    }
  }

  // Ensure openclawData is initialized (for Cron health rendering)
  if (typeof window.openclawData === 'undefined' || !window.openclawData) {
    try {
      const base = statsGetApiBase();
      const resp = await fetch(base + '/openclaw/status?t=' + Date.now(), { cache: 'no-store' });
      const data = await resp.json();
      if (data.ok) {
        window.openclawData = data;
      }
    } catch (e) {
      console.error('Failed to initialize openclawData:', e);
    }
  }

  // Render sections using global openclawData
  renderCronHealth(document.getElementById('stats-cron'));
  renderAgentLeaderboard(document.getElementById('stats-leaderboard'));

  // Fetch API data in parallel
  const base = statsGetApiBase();
  const results = await Promise.allSettled([
    fetch(base + '/stats/today-timeline?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
    fetch(base + '/stats/weekly?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json())
  ]);

  const tData = results[0].status === 'fulfilled' ? results[0].value : null;
  const wData = results[1].status === 'fulfilled' ? results[1].value : null;

  renderTodayTimeline(
    document.getElementById('stats-timeline'),
    tData && tData.ok ? tData : null
  );
  renderWeeklyChart(
    document.getElementById('stats-weekly'),
    wData && wData.ok ? wData.days : null
  );

  // Update Cron trend mini with weekly data if available
  const trendEl = document.getElementById('sp-cron-trend-mini');
  renderCronTrendMini(trendEl, wData && wData.ok ? wData : null);
}

function refreshStatsPanel() {
  fetchAndRenderStats().catch(e => console.error('Stats refresh failed:', e));
}

function initStatsPanel() {
  injectStatsStyles();
  const d = document.getElementById('stats-dashboard');
  if (!d) return;
  fetchAndRenderStats().catch(e => console.error('Stats init failed:', e));
}

window.refreshStatsPanel = refreshStatsPanel;
document.addEventListener('DOMContentLoaded', initStatsPanel);
