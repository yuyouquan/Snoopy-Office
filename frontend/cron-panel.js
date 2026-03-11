// Snoopy小龙虾办公室 - Cron 定时任务面板
// 展示所有定时任务列表及其执行状态，支持点击查看执行历史

let cronPanelData = null;
let cronDetailOpen = null; // 当前展开的 job id

function renderCronPanel(data) {
  const container = document.getElementById('cron-jobs-panel');
  if (!container) return;

  const cronJobs = data.cronJobs || [];
  if (cronJobs.length === 0) {
    container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:8px;">暂无定时任务</div>';
    return;
  }

  cronPanelData = data;

  // Stats summary
  const total = cronJobs.length;
  const okCount = cronJobs.filter(j => j.lastStatus === 'ok').length;
  const errCount = cronJobs.filter(j => j.lastStatus === 'error').length;
  const runningCount = cronJobs.filter(j => j.lastStatus === 'running').length;

  let html = '';

  // Header stats
  html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">`;
  html += `<span style="color:#9ca3af;font-size:11px;">共 ${total} 个任务</span>`;
  html += cronStatDot('#22c55e', `${okCount} 正常`);
  if (errCount > 0) html += cronStatDot('#ef4444', `${errCount} 异常`);
  if (runningCount > 0) html += cronStatDot('#f59e0b', `${runningCount} 运行中`);
  html += `</div>`;

  // Job list
  html += `<div style="display:flex;flex-direction:column;gap:4px;max-height:400px;overflow-y:auto;" id="cron-job-list">`;

  // Sort: running first, then error, then ok, then unknown
  const statusOrder = { running: 0, error: 1, ok: 2, unknown: 3 };
  const sorted = [...cronJobs].sort((a, b) =>
    (statusOrder[a.lastStatus] ?? 3) - (statusOrder[b.lastStatus] ?? 3)
  );

  for (const job of sorted) {
    html += renderCronJobRow(job);
  }

  html += `</div>`;

  // Detail panel (shown when a job is clicked)
  html += `<div id="cron-detail-panel" style="margin-top:8px;"></div>`;

  container.innerHTML = html;

  // Re-open detail if was previously open
  if (cronDetailOpen) {
    loadCronJobDetail(cronDetailOpen);
  }
}

function cronStatDot(color, text) {
  return `<span style="display:flex;align-items:center;gap:4px;">` +
    `<span style="width:6px;height:6px;border-radius:50%;background:${color};"></span>` +
    `<span style="color:${color};font-size:10px;">${text}</span></span>`;
}

function renderCronJobRow(job) {
  const statusConfig = {
    ok: { icon: '✅', color: '#22c55e', label: '正常' },
    error: { icon: '❌', color: '#ef4444', label: '异常' },
    running: { icon: '⏳', color: '#f59e0b', label: '运行中' },
    unknown: { icon: '❓', color: '#6b7280', label: '未知' },
  };
  const st = statusConfig[job.lastStatus] || statusConfig.unknown;

  const isOpen = cronDetailOpen === job.id;
  const bgColor = isOpen ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)';
  const borderColor = isOpen ? '#06b6d4' : 'transparent';

  const duration = job.lastDurationMs > 0
    ? formatDuration(job.lastDurationMs)
    : '-';

  const schedule = job.schedule || '手动触发';
  const lastRun = job.lastRunAt ? formatCronTime(job.lastRunAt) : '从未';
  const nextRun = job.nextRunAt ? formatCronTime(job.nextRunAt) : '-';
  const errBadge = job.consecutiveErrors > 0
    ? `<span style="background:#ef444433;color:#ef4444;padding:1px 5px;border-radius:3px;font-size:9px;margin-left:4px;">连续${job.consecutiveErrors}次失败</span>`
    : '';

  return `<div onclick="toggleCronDetail('${job.id}')" style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='${bgColor}'">` +
    `<div style="display:flex;align-items:center;gap:8px;">` +
    `<span style="font-size:12px;flex-shrink:0;">${st.icon}</span>` +
    `<div style="flex:1;min-width:0;">` +
    `<div style="display:flex;align-items:center;gap:4px;">` +
    `<span style="color:#e5e7eb;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${job.name}</span>` +
    errBadge +
    `</div>` +
    `<div style="display:flex;gap:10px;margin-top:2px;flex-wrap:wrap;">` +
    `<span style="color:#6b7280;font-size:9px;" title="调度规则">🕐 ${schedule}</span>` +
    `<span style="color:#6b7280;font-size:9px;" title="上次执行">⏮ ${lastRun}</span>` +
    `<span style="color:#6b7280;font-size:9px;" title="耗时">⏱ ${duration}</span>` +
    `<span style="color:#6b7280;font-size:9px;" title="下次执行">⏭ ${nextRun}</span>` +
    `</div>` +
    `</div>` +
    `<span style="color:${st.color};font-size:9px;flex-shrink:0;padding:2px 6px;border:1px solid ${st.color}33;border-radius:4px;">${st.label}</span>` +
    `</div>` +
    `</div>`;
}

function toggleCronDetail(jobId) {
  if (cronDetailOpen === jobId) {
    cronDetailOpen = null;
    const panel = document.getElementById('cron-detail-panel');
    if (panel) panel.innerHTML = '';
    // Re-render to update highlight
    if (cronPanelData) renderCronPanel(cronPanelData);
  } else {
    cronDetailOpen = jobId;
    if (cronPanelData) renderCronPanel(cronPanelData);
    loadCronJobDetail(jobId);
  }
}

async function loadCronJobDetail(jobId) {
  const panel = document.getElementById('cron-detail-panel');
  if (!panel) return;

  // Find job info
  const jobs = (cronPanelData && cronPanelData.cronJobs) || [];
  const job = jobs.find(j => j.id === jobId);
  const jobName = job ? job.name : jobId.substring(0, 12);

  panel.innerHTML = `<div style="color:#9ca3af;font-size:11px;padding:8px;text-align:center;">加载 "${jobName}" 执行历史...</div>`;

  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';
    const resp = await fetch(`${base}/openclaw/cron/${jobId}/runs?t=${Date.now()}`, { cache: 'no-store' });
    const data = await resp.json();
    if (!data.ok) {
      panel.innerHTML = `<div style="color:#ef4444;font-size:11px;padding:8px;">加载失败: ${data.error || '未知错误'}</div>`;
      return;
    }
    renderCronDetail(panel, job, data.runs || []);
  } catch (e) {
    panel.innerHTML = `<div style="color:#ef4444;font-size:11px;padding:8px;">网络错误: ${e.message}</div>`;
  }
}

function renderCronDetail(panel, job, runs) {
  let html = `<div style="background:rgba(6,182,212,0.05);border:1px solid #06b6d433;border-radius:8px;padding:12px;">`;

  // Header
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">`;
  html += `<span style="color:#06b6d4;font-size:12px;font-weight:600;">${job ? job.name : '任务详情'}</span>`;
  html += `<span onclick="toggleCronDetail('${job ? job.id : ''}')" style="color:#6b7280;cursor:pointer;font-size:12px;padding:2px 6px;" title="关闭">✕</span>`;
  html += `</div>`;

  // Task description
  if (job && job.description) {
    html += `<div style="color:#9ca3af;font-size:10px;margin-bottom:8px;line-height:1.4;background:rgba(0,0,0,0.2);padding:6px 8px;border-radius:4px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(job.description)}</div>`;
  }

  // Error info
  if (job && job.lastError) {
    html += `<div style="color:#ef4444;font-size:10px;margin-bottom:8px;background:rgba(239,68,68,0.1);padding:6px 8px;border-radius:4px;">⚠️ ${escapeHtml(job.lastError)}</div>`;
  }

  // Run history
  if (runs.length === 0) {
    html += `<div style="color:#6b7280;font-size:11px;text-align:center;padding:12px;">暂无执行记录</div>`;
  } else {
    html += `<div style="color:#9ca3af;font-size:10px;margin-bottom:4px;">最近 ${runs.length} 次执行</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;">`;
    for (const run of runs) {
      html += renderRunEntry(run);
    }
    html += `</div>`;
  }

  html += `</div>`;
  panel.innerHTML = html;
}

function renderRunEntry(run) {
  const isOk = run.status === 'ok';
  const icon = isOk ? '✅' : '❌';
  const borderColor = isOk ? '#22c55e22' : '#ef444422';
  const timeStr = run.timestamp ? formatCronTime(run.timestamp) : '';
  const duration = run.durationMs > 0 ? formatDuration(run.durationMs) : '-';

  let html = `<div style="background:rgba(0,0,0,0.2);border:1px solid ${borderColor};border-radius:6px;padding:8px;">`;

  // Status line
  html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">`;
  html += `<span>${icon}</span>`;
  html += `<span style="color:#d1d5db;font-size:11px;flex:1;">${timeStr}</span>`;
  html += `<span style="color:#6b7280;font-size:10px;">⏱ ${duration}</span>`;
  html += `</div>`;

  // Error message
  if (run.error) {
    html += `<div style="color:#ef4444;font-size:10px;margin-bottom:4px;">❗ ${escapeHtml(run.error)}</div>`;
  }

  // Summary (collapsible)
  if (run.summary) {
    const summaryId = 'run-' + Math.random().toString(36).substring(2, 8);
    html += `<div>`;
    html += `<div onclick="document.getElementById('${summaryId}').style.display=document.getElementById('${summaryId}').style.display==='none'?'block':'none'" style="color:#06b6d4;font-size:10px;cursor:pointer;user-select:none;">📄 查看摘要 ▸</div>`;
    html += `<div id="${summaryId}" style="display:none;color:#d1d5db;font-size:10px;margin-top:4px;line-height:1.5;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;white-space:pre-wrap;word-break:break-all;max-height:200px;overflow-y:auto;">${escapeHtml(run.summary)}</div>`;
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ─── Utilities ────────────────────────────────────────────

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m${remainSecs}s`;
}

function formatCronTime(isoStr) {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;

    if (diffMs < 0) {
      const mins = Math.round(-diffMs / 60000);
      if (mins < 60) return `${mins}分后`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `${hours}小时后`;
      return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    if (diffMs < 60000) return '刚刚';
    if (diffMs < 3600000) return `${Math.round(diffMs / 60000)}分前`;
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours}小时前`;
    }
    const days = Math.floor(diffMs / 86400000);
    if (days < 7) return `${days}天前`;
    return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
