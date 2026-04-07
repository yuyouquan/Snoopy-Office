// Snoopy小龙虾办公室 - 团队活动墙
// 实时展示所有 Agent 的活动状态，像团队动态流

const ActivityWall = (() => {
  const ROLE_EMOJIS = {
    'main': '🧠',
    'architect': '🏗️',
    'frontend-dev': '🎨',
    'backend-dev': '⚙️',
    'product-manager': '📋',
    'project-manager': '📊',
    'qa-engineer': '🧪',
    'news-miner': '📰',
    'daily-reporter': '📝',
    'security-expert': '🔒'
  };

  function getRelativeTime(isoDateStr) {
    if (!isoDateStr) return '离线';

    const now = new Date();
    const then = new Date(isoDateStr);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 30) return `${diffDay}天前`;
    return '很久前';
  }

  function formatTokens(n) {
    if (!n || n <= 0) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active':
        return '#22c55e'; // 绿色
      case 'idle':
        return '#eab308'; // 黄色
      default:
        return '#6b7280'; // 灰色
    }
  }

  function getStatusDot(status, isRecent) {
    const color = getStatusColor(status);
    const pulse = isRecent && status === 'active' ? 'ocPulse' : '';
    return `<span class="${pulse}" style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 4px ${color};"></span>`;
  }

  function render(agentDetails) {
    const container = document.getElementById('activity-wall-container');
    if (!container || !agentDetails || agentDetails.length === 0) {
      if (container) {
        container.innerHTML = '<div style="color:#6b7280;font-size:11px;text-align:center;padding:12px;">暂无活动</div>';
      }
      return;
    }

    // 按 lastActivityAt 排序（最近的在前），offline 放在后面
    const sorted = [...agentDetails].sort((a, b) => {
      if (a.status === 'offline' && b.status !== 'offline') return 1;
      if (a.status !== 'offline' && b.status === 'offline') return -1;
      const timeA = new Date(a.lastActivityAt || 0).getTime();
      const timeB = new Date(b.lastActivityAt || 0).getTime();
      return timeB - timeA;
    });

    const now = Date.now();
    let html = '';

    sorted.forEach(agent => {
      const emoji = ROLE_EMOJIS[agent.agentId] || '🤖';
      const relTime = getRelativeTime(agent.lastActivityAt);
      const isRecent = agent.lastActivityAt && (now - new Date(agent.lastActivityAt).getTime()) < 15000;
      const orchestratorBadge = agent.isOrchestrator ? ' 👑' : '';
      const tokens = formatTokens((agent.totalInputTokens || 0) + (agent.totalOutputTokens || 0));
      const statusDot = getStatusDot(agent.status, isRecent);

      const highlightClass = isRecent ? 'activity-wall-highlight' : '';
      const highlightStyle = isRecent
        ? `background:linear-gradient(90deg,rgba(34,197,94,0.1),transparent);animation:fadeInOut 2s ease-in-out;`
        : '';

      html += `
        <div class="${highlightClass}" style="display:flex;align-items:center;gap:8px;padding:8px 6px;font-size:11px;color:#d1d5db;border-bottom:1px solid rgba(255,255,255,0.05);${highlightStyle}">
          ${statusDot}
          <span style="font-size:13px;min-width:16px;">${emoji}</span>
          <span style="flex:1;font-weight:500;">${agent.name}${orchestratorBadge}</span>
          <span style="color:#9ca3af;min-width:48px;">${relTime}</span>
          <span style="color:#6b7280;min-width:44px;text-align:right;">·</span>
          <span style="color:#9ca3af;min-width:36px;">${agent.totalSessions || 0}次</span>
          <span style="color:#6b7280;min-width:44px;text-align:right;">·</span>
          <span style="color:#06b6d4;min-width:50px;text-align:right;">${tokens}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async function refresh() {
    const data = window.openclawData;
    if (data && data.agentDetails) {
      render(data.agentDetails);
    }
  }

  return {
    refresh
  };
})();

// 暴露到全局，供外部调用
window.refreshActivityWall = () => {
  ActivityWall.refresh();
};

// 确保样式被加载（高亮动画）
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('activity-wall-styles')) {
    const style = document.createElement('style');
    style.id = 'activity-wall-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { background: linear-gradient(90deg, rgba(34, 197, 94, 0.2), transparent); }
        50% { background: linear-gradient(90deg, rgba(34, 197, 94, 0.1), transparent); }
        100% { background: linear-gradient(90deg, rgba(34, 197, 94, 0), transparent); }
      }
      .ocPulse {
        animation: ocPulse 2s infinite;
      }
      @keyframes ocPulse {
        0% { opacity: 1; box-shadow: 0 0 4px #22c55e; }
        50% { opacity: 0.7; box-shadow: 0 0 8px #22c55e; }
        100% { opacity: 1; box-shadow: 0 0 4px #22c55e; }
      }
    `;
    document.head.appendChild(style);
  }
});
