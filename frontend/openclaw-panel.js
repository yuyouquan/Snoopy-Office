// Snoopy小龙虾办公室 - OpenClaw 实时状态面板
// 轮询 /openclaw/status 端点，显示 Agent 和 Cron 任务状态

const OPENCLAW_POLL_INTERVAL = 5000;
let openclawData = null;
let openclawPollTimer = null;

const AGENT_STATUS_COLORS = { active: '#22c55e', idle: '#eab308', offline: '#6b7280' };
const AGENT_STATUS_LABELS = { active: '活跃', idle: '待命', offline: '离线' };

async function fetchOpenClawStatus() {
  try {
    const resp = await fetch('/openclaw/status?t=' + Date.now(), { cache: 'no-store' });
    const data = await resp.json();
    if (data.ok) {
      openclawData = data;
      renderOpenClawPanel(data);
      renderAgentGrid(data.agentDetails || []);
      if (typeof renderCronPanel === 'function') renderCronPanel(data);
      const dot = document.getElementById('openclaw-conn-dot');
      if (dot) dot.style.background = '#22c55e';
    }
  } catch (e) {
    console.error('OpenClaw status fetch failed:', e);
    const dot = document.getElementById('openclaw-conn-dot');
    if (dot) dot.style.background = '#ef4444';
  }
}

function renderOpenClawPanel(data) {
  const container = document.getElementById('openclaw-dashboard');
  if (!container) return;

  const summary = data.summary || {};
  const officeState = data.officeState || {};
  const cronJobs = data.cronJobs || [];
  const recentRuns = data.recentRuns || [];

  const stateColors = {
    idle: '#22c55e', writing: '#3b82f6', executing: '#f59e0b',
    error: '#ef4444', syncing: '#8b5cf6', researching: '#06b6d4'
  };
  const stateColor = stateColors[officeState.state] || '#9ca3af';
  const stateEmojis = {
    idle: '😴', writing: '✍️', executing: '🚀',
    error: '🚨', syncing: '☁️', researching: '🔍'
  };
  const stateEmoji = stateEmojis[officeState.state] || '❓';

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
      const jobName = findJobName(data.cronJobs || [], run.jobId);
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

  // Upcoming jobs
  const upcoming = (data.cronJobs || [])
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

// ─── Agent Grid ───────────────────────────────────────────

function formatTokenCount(n) {
  if (!n || n <= 0) return '0';
  if (n < 1000) return String(n);
  if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

function renderAgentCard(agent) {
  const color = AGENT_STATUS_COLORS[agent.status] || '#6b7280';
  const label = AGENT_STATUS_LABELS[agent.status] || agent.status;
  const isMain = agent.isOrchestrator;
  const borderColor = isMain ? '#06b6d4' : color;
  const bgColor = isMain ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.03)';

  const lastTime = agent.lastActivityAt ? formatTime(agent.lastActivityAt) : '从未';
  const tokens = formatTokenCount(agent.totalInputTokens + agent.totalOutputTokens);

  // Pulse animation for active status
  const dotStyle = agent.status === 'active'
    ? `width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};animation:ocPulse 1.5s infinite;`
    : `width:8px;height:8px;border-radius:50%;background:${color};`;

  let html = `<div class="agent-card" style="background:${bgColor};border:1px solid ${borderColor}33;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;transition:border-color 0.2s;min-width:160px;max-width:200px;flex-shrink:0;overflow:hidden;" onmouseenter="this.style.borderColor='${borderColor}88'" onmouseleave="this.style.borderColor='${borderColor}33'">`;

  // Header: emoji + name + status dot
  html += `<div style="display:flex;align-items:center;gap:6px;">`;
  html += `<span style="font-size:18px;">${agent.emoji}</span>`;
  html += `<div style="flex:1;min-width:0;">`;
  html += `<div style="color:#e5e7eb;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${agent.name}</div>`;
  if (isMain) {
    html += `<div style="color:#06b6d4;font-size:9px;letter-spacing:0.5px;">ORCHESTRATOR</div>`;
  }
  html += `</div>`;
  html += `<div style="${dotStyle}" title="${label}"></div>`;
  html += `</div>`;

  // Role description
  if (agent.role) {
    html += `<div style="color:#9ca3af;font-size:10px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${agent.role}">${agent.role}</div>`;
  }

  // Stats row
  html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;">`;
  html += `<span style="color:#6b7280;font-size:9px;" title="会话数">📂 ${agent.totalSessions}</span>`;
  html += `<span style="color:#6b7280;font-size:9px;" title="Token 用量">🪙 ${tokens}</span>`;
  html += `</div>`;

  // Last active
  html += `<div style="color:#4b5563;font-size:9px;border-top:1px solid rgba(255,255,255,0.05);padding-top:4px;">`;
  html += `<span style="color:${color};">${label}</span> · ${lastTime}`;
  html += `</div>`;

  html += `</div>`;
  return html;
}

function renderAgentGrid(agentDetails) {
  const container = document.getElementById('agent-grid');
  if (!container) return;
  if (!agentDetails || agentDetails.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Inject pulse animation style once
  if (!document.getElementById('oc-agent-styles')) {
    const style = document.createElement('style');
    style.id = 'oc-agent-styles';
    style.textContent = `
      @keyframes ocPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      #agent-grid::-webkit-scrollbar { height: 6px; }
      #agent-grid::-webkit-scrollbar-track { background: transparent; }
      #agent-grid::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      #agent-grid::-webkit-scrollbar-thumb:hover { background: #555; }
    `;
    document.head.appendChild(style);
  }

  // Section title (placed before the scroll container)
  let titleEl = document.getElementById('agent-grid-title');
  const activeCount = agentDetails.filter(a => a.status === 'active').length;
  const idleCount = agentDetails.filter(a => a.status === 'idle').length;
  const offlineCount = agentDetails.length - activeCount - idleCount;
  const titleHtml = `<span>🤖 团队角色状态</span>` +
    `<span style="color:#22c55e;font-size:10px;">${activeCount} 活跃</span>` +
    `<span style="color:#eab308;font-size:10px;">${idleCount} 待命</span>` +
    `<span style="color:#6b7280;font-size:10px;">${offlineCount} 离线</span>`;

  if (!titleEl) {
    titleEl = document.createElement('div');
    titleEl.id = 'agent-grid-title';
    titleEl.style.cssText = 'color:#9ca3af;font-size:11px;display:flex;align-items:center;gap:6px;margin-top:10px;';
    container.parentNode.insertBefore(titleEl, container);
  }
  titleEl.innerHTML = titleHtml;

  // Agent cards
  let html = '';
  for (const agent of agentDetails) {
    html += renderAgentCard(agent);
  }

  container.innerHTML = html;
}

// ─── Utilities ────────────────────────────────────────────

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
