// Snoopy小龙虾办公室 - OpenClaw 实时状态面板
// 轮询 /openclaw/status 端点，显示 Agent 和 Cron 任务状态

const OPENCLAW_POLL_INTERVAL = 5000; // 5秒轮询
let openclawData = null;
let openclawPollTimer = null;

async function fetchOpenClawStatus() {
  try {
    const resp = await fetch('/openclaw/status?t=' + Date.now(), { cache: 'no-store' });
    const data = await resp.json();
    if (data.ok) {
      openclawData = data;
      renderOpenClawPanel(data);
    }
  } catch (e) {
    console.error('OpenClaw status fetch failed:', e);
  }
}

function renderOpenClawPanel(data) {
  const container = document.getElementById('openclaw-dashboard');
  if (!container) return;

  const summary = data.summary || {};
  const officeState = data.officeState || {};
  const cronJobs = data.cronJobs || [];
  const recentRuns = data.recentRuns || [];
  const agents = data.agents || [];

  // State indicator color
  const stateColors = {
    idle: '#22c55e',
    writing: '#3b82f6',
    executing: '#f59e0b',
    error: '#ef4444',
    syncing: '#8b5cf6',
    researching: '#06b6d4'
  };
  const stateColor = stateColors[officeState.state] || '#9ca3af';
  const stateEmojis = {
    idle: '😴', writing: '✍️', executing: '🚀',
    error: '🚨', syncing: '☁️', researching: '🔍'
  };
  const stateEmoji = stateEmojis[officeState.state] || '❓';

  // Build HTML
  let html = '';

  // Status header
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">`;
  html += `<div style="width:10px;height:10px;border-radius:50%;background:${stateColor};box-shadow:0 0 6px ${stateColor};"></div>`;
  html += `<span style="color:${stateColor};font-size:13px;">${stateEmoji} ${officeState.detail || officeState.state}</span>`;
  html += `</div>`;

  // Stats row
  html += `<div style="display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap;">`;
  html += renderStatBadge('Agent', `${summary.activeAgents || 0}/${summary.totalAgents || 0}`, summary.activeAgents > 0 ? '#22c55e' : '#555');
  html += renderStatBadge('Cron', `${summary.healthyCronJobs || 0}/${summary.totalCronJobs || 0}`, summary.errorCronJobs > 0 ? '#ef4444' : '#22c55e');
  if (summary.errorCronJobs > 0) {
    html += renderStatBadge('异常', `${summary.errorCronJobs}`, '#ef4444');
  }
  html += `</div>`;

  // Recent runs
  if (recentRuns.length > 0) {
    html += `<div style="color:#9ca3af;font-size:10px;margin-bottom:4px;">最近执行</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:3px;max-height:90px;overflow-y:auto;">`;
    for (const run of recentRuns.slice(0, 5)) {
      const statusIcon = run.status === 'ok' ? '✅' : '❌';
      const jobName = findJobName(cronJobs, run.jobId);
      const timeStr = run.timestamp ? formatTime(run.timestamp) : '';
      const durationStr = run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : '';
      html += `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#d1d5db;">`;
      html += `<span>${statusIcon}</span>`;
      html += `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${jobName}</span>`;
      html += `<span style="color:#6b7280;flex-shrink:0;">${durationStr}</span>`;
      html += `<span style="color:#6b7280;flex-shrink:0;">${timeStr}</span>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Active agents
  const activeAgents = agents.filter(a => a.isActive);
  if (activeAgents.length > 0) {
    html += `<div style="color:#9ca3af;font-size:10px;margin-top:8px;margin-bottom:4px;">活跃 Agent</div>`;
    html += `<div style="display:flex;gap:6px;flex-wrap:wrap;">`;
    for (const agent of activeAgents) {
      html += `<span style="background:#1e3a5f;color:#93c5fd;padding:2px 8px;border-radius:4px;font-size:10px;">${agent.agentId} (${agent.recentSessions})</span>`;
    }
    html += `</div>`;
  }

  // Upcoming jobs
  const upcoming = cronJobs
    .filter(j => j.enabled && j.nextRunAt)
    .sort((a, b) => (a.nextRunAt || '').localeCompare(b.nextRunAt || ''))
    .slice(0, 3);

  if (upcoming.length > 0) {
    html += `<div style="color:#9ca3af;font-size:10px;margin-top:8px;margin-bottom:4px;">即将执行</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:2px;">`;
    for (const job of upcoming) {
      const timeStr = job.nextRunAt ? formatTime(job.nextRunAt) : '';
      html += `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#d1d5db;">`;
      html += `<span>⏰</span>`;
      html += `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${job.name}</span>`;
      html += `<span style="color:#6b7280;flex-shrink:0;">${timeStr}</span>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;
}

function renderStatBadge(label, value, color) {
  return `<div style="background:rgba(0,0,0,0.3);border:1px solid ${color}33;border-radius:6px;padding:3px 8px;display:flex;align-items:center;gap:4px;">
    <span style="color:#9ca3af;font-size:10px;">${label}</span>
    <span style="color:${color};font-size:12px;font-weight:bold;">${value}</span>
  </div>`;
}

function findJobName(jobs, jobId) {
  const job = jobs.find(j => j.id === jobId);
  return job ? job.name : jobId.substring(0, 8);
}

function formatTime(isoStr) {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;

    if (diffMs < 0) {
      // Future time
      const mins = Math.round(-diffMs / 60000);
      if (mins < 60) return `${mins}分后`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `${hours}小时后`;
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    if (diffMs < 60000) return '刚刚';
    if (diffMs < 3600000) return `${Math.round(diffMs / 60000)}分前`;
    if (diffMs < 86400000) return `${Math.round(diffMs / 3600000)}小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

// Start polling
function startOpenClawPolling() {
  fetchOpenClawStatus();
  openclawPollTimer = setInterval(fetchOpenClawStatus, OPENCLAW_POLL_INTERVAL);
}

document.addEventListener('DOMContentLoaded', () => {
  startOpenClawPolling();
});
