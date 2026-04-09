// Snoopy小龙虾办公室 - Cron 任务看板
// 三列看板展示任务流转：即将执行 / 最近运行 / 已完成

const TaskKanban = (() => {
  // Agent 元数据缓存
  const AGENT_META_CACHE = {};

  // 状态映射（图标 + 颜色 + 文本）
  const STATUS_MAP = {
    ok: { icon: '✅', color: '#22c55e', text: '成功' },
    error: { icon: '❌', color: '#ef4444', text: '失败' },
    running: { icon: '⚙️', color: '#f59e0b', text: '执行中' },
    pending: { icon: '⏰', color: '#06b6d4', text: '待执行' }
  };

  const AGENT_META = {
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

  // 样式常量
  const STYLES = {
    columnHeader: 'font-size:11px;font-weight:600;margin-bottom:8px;padding:0 4px;',
    card: 'min-width:200px;max-width:220px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:6px;flex-shrink:0;',
    cardName: 'font-size:11px;font-weight:600;color:#e5e7eb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
    cardMeta: 'display:flex;align-items:center;gap:4px;font-size:10px;',
    cardFooter: 'display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#6b7280;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px;'
  };

  // 获取 Agent 的显示名称和 emoji（带缓存）
  function getAgentInfo(agentId) {
    if (!AGENT_META_CACHE[agentId]) {
      AGENT_META_CACHE[agentId] = AGENT_META[agentId] || { name: agentId, emoji: '🤖' };
    }
    return AGENT_META_CACHE[agentId];
  }

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
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return '更早';
  }

  // 格式化耗时（毫秒 → 秒或分钟）
  function formatDuration(ms) {
    if (!ms) return '-';
    const sec = Math.round(ms / 1000);
    return sec < 60 ? `${sec}s` : `${Math.round(sec / 60)}m`;
  }

  // 构建任务卡片 HTML
  function renderTaskCard(task, type) {
    if (!task) return '';

    // 确定状态信息
    let statusInfo = STATUS_MAP.pending;
    if (type === 'running') {
      statusInfo = task.status === 'running'
        ? STATUS_MAP.running
        : STATUS_MAP[task.lastStatus] || STATUS_MAP.pending;
    } else if (type === 'completed') {
      statusInfo = STATUS_MAP[task.lastStatus] || STATUS_MAP.pending;
    }

    const agentInfo = getAgentInfo(task.agentId);
    const duration = formatDuration(task.lastDurationMs);
    const time = type === 'upcoming'
      ? new Date(task.nextRunAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : formatRelativeTime(task.timestamp || task.lastRunAt);

    return `<div style="${STYLES.card}">
      <div style="${STYLES.cardName}" title="${task.name}">${task.name}</div>
      <div style="${STYLES.cardMeta}">
        <span>${agentInfo.emoji}</span>
        <span style="color:#9ca3af;flex:1;">${agentInfo.name}</span>
        <span style="color:${statusInfo.color};font-weight:600;">${statusInfo.icon}</span>
      </div>
      <div style="${STYLES.cardFooter}">
        <span title="${type === 'upcoming' ? '下次运行' : '执行时间'}">${time}</span>
        <span title="耗时">${duration}</span>
      </div>
    </div>`;
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

    // 列定义
    const columns = [
      { label: '⏰ 即将执行', color: '#06b6d4', data: upcoming, type: 'upcoming' },
      { label: '⚡ 最近运行', color: '#f59e0b', data: recent, type: 'running' },
      { label: '✅ 已完成', color: '#22c55e', data: completed, type: 'completed' }
    ];

    const emptyPlaceholder = '<div style="color:#4b5563;font-size:10px;padding:20px 10px;text-align:center;">暂无</div>';

    let html = '<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-behavior:smooth;">';

    for (const col of columns) {
      html += `<div style="flex-shrink:0;">`;
      html += `<div style="${STYLES.columnHeader}color:${col.color};">${col.label}</div>`;
      html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
      html += col.data.length > 0
        ? col.data.map(task => renderTaskCard(task, col.type)).join('')
        : emptyPlaceholder;
      html += `</div></div>`;
    }

    html += '</div>';
    return html;
  }

  // 防抖计时器和上次数据
  let debounceTimer = null;
  let lastData = null;

  // 外部调用入口（带防抖）
  function refreshTaskKanban() {
    const data = window.openclawData;
    const container = document.getElementById('task-kanban-container');

    if (!container) return;

    // 防抖：如果数据未变，300ms内不重新渲染
    if (lastData === JSON.stringify(data)) {
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!data) {
        container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:20px;">加载中...</div>';
        return;
      }

      const html = renderTaskKanban(data.cronJobs || [], data.recentRuns || []);
      container.innerHTML = html;
      lastData = JSON.stringify(data);
    }, 300);
  }

  return {
    refreshTaskKanban
  };
})();

// 暴露到全局
window.refreshTaskKanban = TaskKanban.refreshTaskKanban;
