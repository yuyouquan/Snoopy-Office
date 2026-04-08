// Snoopy小龙虾办公室 - Cron 任务看板
// 三列看板展示任务流转：即将执行 / 最近运行 / 已完成

const TaskKanban = (() => {
  // 状态图标
  const STATUS_ICONS = {
    ok: '✅',
    error: '❌',
    running: '⚙️',
    pending: '⏰'
  };

  const STATUS_COLORS = {
    ok: '#22c55e',
    error: '#ef4444',
    running: '#f59e0b',
    pending: '#06b6d4'
  };

  // 格式化时间为相对时间
  function formatRelativeTime(isoDateStr) {
    if (!isoDateStr) return '未知';

    const now = new Date();
    const then = new Date(isoDateStr);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return '更早';
  }

  // 格式化耗时（毫秒 → 秒或分钟）
  function formatDuration(ms) {
    if (!ms) return '-';
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.round(sec / 60);
    return `${min}m`;
  }

  // 获取 Agent 的显示名称和 emoji
  function getAgentInfo(agentId) {
    const agentMeta = {
      'main': { name: '主控', emoji: '🧠' },
      'architect': { name: '架构师', emoji: '🏗️' },
      'frontend-dev': { name: '前端', emoji: '🎨' },
      'backend-dev': { name: '后端', emoji: '⚙️' },
      'product-manager': { name: '产品', emoji: '📋' },
      'project-manager': { name: '项目', emoji: '📊' },
      'qa-engineer': { name: '测试', emoji: '🧪' },
      'news-miner': { name: '新闻', emoji: '📰' },
      'daily-reporter': { name: '日报', emoji: '📝' },
      'security-expert': { name: '安全', emoji: '🔒' }
    };
    return agentMeta[agentId] || { name: agentId, emoji: '🤖' };
  }

  // 构建任务卡片 HTML
  function renderTaskCard(task, type) {
    if (!task) return '';

    const agentInfo = getAgentInfo(task.agentId);
    let statusIcon = '⏰';
    let statusColor = '#06b6d4';
    let statusText = '待执行';

    if (type === 'running') {
      if (task.status === 'running') {
        statusIcon = '⚙️';
        statusColor = '#f59e0b';
        statusText = '执行中';
      } else {
        statusIcon = STATUS_ICONS[task.lastStatus] || '❓';
        statusColor = STATUS_COLORS[task.lastStatus] || '#6b7280';
        statusText = task.lastStatus === 'ok' ? '成功' : task.lastStatus === 'error' ? '失败' : '待定';
      }
    } else if (type === 'completed') {
      statusIcon = task.lastStatus === 'ok' ? '✅' : '❌';
      statusColor = task.lastStatus === 'ok' ? '#22c55e' : '#ef4444';
      statusText = task.lastStatus === 'ok' ? '成功' : '失败';
    }

    const duration = task.lastDurationMs ? formatDuration(task.lastDurationMs) : '-';
    const time = type === 'upcoming'
      ? new Date(task.nextRunAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : formatRelativeTime(task.timestamp || task.lastRunAt);

    let html = `<div style="min-width:200px;max-width:220px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:6px;flex-shrink:0;">`;

    // 任务名（截断）
    html += `<div style="font-size:11px;font-weight:600;color:#e5e7eb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${task.name}">${task.name}</div>`;

    // Agent 和状态
    html += `<div style="display:flex;align-items:center;gap:4px;font-size:10px;">`;
    html += `<span>${agentInfo.emoji}</span>`;
    html += `<span style="color:#9ca3af;flex:1;">${agentInfo.name}</span>`;
    html += `<span style="color:${statusColor};font-weight:600;">${statusIcon}</span>`;
    html += `</div>`;

    // 时间和耗时
    html += `<div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#6b7280;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px;">`;
    html += `<span title="${type === 'upcoming' ? '下次运行' : '执行时间'}">${time}</span>`;
    html += `<span title="耗时">${duration}</span>`;
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  // 主渲染函数
  function renderTaskKanban(cronJobs, recentRuns) {
    if (!cronJobs || !recentRuns) return '';

    // 即将执行：enabled 任务，按 nextRunAt 排序，取最近 5 个
    const upcoming = cronJobs
      .filter(j => j.enabled && j.nextRunAt)
      .sort((a, b) => (a.nextRunAt || '').localeCompare(b.nextRunAt || ''))
      .slice(0, 5);

    // 最近运行：recentRuns 最新 5 条
    const recent = recentRuns.slice(0, 5);

    // 已完成：ok/error 状态，最近 5 条
    const completed = recentRuns
      .filter(r => r.status === 'ok' || r.status === 'error')
      .slice(0, 5);

    let html = `<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-behavior:smooth;">`;

    // 即将执行列
    html += `<div style="flex-shrink:0;">`;
    html += `<div style="font-size:11px;color:#06b6d4;font-weight:600;margin-bottom:8px;padding:0 4px;">⏰ 即将执行</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
    if (upcoming.length > 0) {
      upcoming.forEach(task => {
        html += renderTaskCard(task, 'upcoming');
      });
    } else {
      html += `<div style="color:#4b5563;font-size:10px;padding:20px 10px;text-align:center;">暂无任务</div>`;
    }
    html += `</div></div>`;

    // 最近运行列
    html += `<div style="flex-shrink:0;">`;
    html += `<div style="font-size:11px;color:#f59e0b;font-weight:600;margin-bottom:8px;padding:0 4px;">⚡ 最近运行</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
    if (recent.length > 0) {
      recent.forEach(run => {
        html += renderTaskCard(run, 'running');
      });
    } else {
      html += `<div style="color:#4b5563;font-size:10px;padding:20px 10px;text-align:center;">暂无记录</div>`;
    }
    html += `</div></div>`;

    // 已完成列
    html += `<div style="flex-shrink:0;">`;
    html += `<div style="font-size:11px;color:#22c55e;font-weight:600;margin-bottom:8px;padding:0 4px;">✅ 已完成</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
    if (completed.length > 0) {
      completed.forEach(run => {
        html += renderTaskCard(run, 'completed');
      });
    } else {
      html += `<div style="color:#4b5563;font-size:10px;padding:20px 10px;text-align:center;">暂无记录</div>`;
    }
    html += `</div></div>`;

    html += `</div>`;
    return html;
  }

  // 外部调用入口
  function refreshTaskKanban() {
    const data = window.openclawData;
    const container = document.getElementById('task-kanban-container');

    if (!container || !data) {
      if (container) {
        container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:20px;">加载中...</div>';
      }
      return;
    }

    const html = renderTaskKanban(data.cronJobs || [], data.recentRuns || []);
    container.innerHTML = html;
  }

  return {
    refreshTaskKanban
  };
})();

// 暴露到全局
window.refreshTaskKanban = TaskKanban.refreshTaskKanban;
