// Snoopy小龙虾办公室 - Agent 等级与成长系统
// 基于真实的会话数据计算 Agent 等级，提供游戏化的成长体验

const AgentLevel = (() => {
  // 等级定义（基于 totalSessions）
  const LEVELS = [
    { level: 1, title: '新人', icon: '🌱', minSessions: 0, maxSessions: 9 },
    { level: 2, title: '熟手', icon: '📈', minSessions: 10, maxSessions: 29 },
    { level: 3, title: '专家', icon: '🎖️', minSessions: 30, maxSessions: 79 },
    { level: 4, title: '大师', icon: '⭐', minSessions: 80, maxSessions: 199 },
    { level: 5, title: '传奇', icon: '🏆', minSessions: 200, maxSessions: Infinity }
  ];

  // 等级颜色（紫色系）
  const LEVEL_COLORS = {
    1: '#6366f1',  // indigo
    2: '#8b5cf6',  // violet
    3: '#a78bfa',  // purple
    4: '#c084fc',  // fuchsia
    5: '#d946ef'   // magenta
  };

  function calcAgentLevel(agent) {
    if (!agent) return null;

    const sessions = agent.totalSessions || 0;
    const tokens = (agent.totalInputTokens || 0) + (agent.totalOutputTokens || 0);

    // 查找当前等级
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = 0; i < LEVELS.length; i++) {
      if (sessions >= LEVELS[i].minSessions && sessions <= LEVELS[i].maxSessions) {
        currentLevel = LEVELS[i];
        nextLevel = i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
        break;
      }
    }

    // 计算当前等级的进度（0-100）
    let progress = 0;
    if (nextLevel) {
      const currentMin = currentLevel.minSessions;
      const nextMin = nextLevel.minSessions;
      const range = nextMin - currentMin;
      const current = sessions - currentMin;
      progress = Math.round((current / range) * 100);
    } else {
      // 已达最高等级
      progress = 100;
    }

    // 下一级所需的会话数
    const sessionsNeeded = nextLevel ? nextLevel.minSessions - sessions : 0;

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      icon: currentLevel.icon,
      color: LEVEL_COLORS[currentLevel.level],
      progress,
      sessions,
      tokens,
      nextLevel: nextLevel ? { level: nextLevel.level, title: nextLevel.title, icon: nextLevel.icon } : null,
      sessionsNeeded
    };
  }

  // 渲染 Agent 卡片中的等级小徽章
  function renderLevelBadge(agent) {
    const info = calcAgentLevel(agent);
    if (!info) return '';

    return `<span style="font-size:9px;font-weight:600;color:${info.color};background:rgba(${hexToRgb(info.color)},0.1);border:1px solid ${info.color}44;border-radius:4px;padding:2px 6px;white-space:nowrap;" title="${info.icon} ${info.title} Lv.${info.level}">Lv.${info.level}</span>`;
  }

  // 渲染工位弹窗中的完整等级详情
  function renderLevelDetail(agent) {
    const info = calcAgentLevel(agent);
    if (!info) return '';

    let html = `<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">`;

    // 当前等级和目标等级
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">`;
    html += `<span style="font-size:14px;">${info.icon}</span>`;
    html += `<span style="color:${info.color};font-size:12px;font-weight:600;">Lv.${info.level} ${info.title}</span>`;

    if (info.nextLevel) {
      html += `<span style="color:#6b7280;font-size:10px;">→</span>`;
      html += `<span style="color:#6b7280;font-size:11px;opacity:0.7;">Lv.${info.nextLevel.level} ${info.nextLevel.title}</span>`;
    }
    html += `</div>`;

    // 进度条
    if (info.nextLevel) {
      html += `<div style="background:#1e293b;border-radius:4px;height:5px;margin-bottom:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">`;
      html += `<div style="width:${info.progress}%;height:100%;background:linear-gradient(90deg,${info.color},${LEVEL_COLORS[Math.min(info.level + 1, 5)]});transition:width 0.3s ease;"></div>`;
      html += `</div>`;
      html += `<div style="font-size:10px;color:#9ca3af;">还需 <span style="color:${info.color};font-weight:600;">${info.sessionsNeeded}</span> 次会话升级到 <span style="color:#9ca3af;">Lv.${info.nextLevel.level}</span></div>`;
    } else {
      html += `<div style="font-size:10px;color:#22c55e;font-weight:600;">🎉 已达最高等级！</div>`;
    }

    html += `</div>`;
    return html;
  }

  // 十六进制颜色转 RGB（用于透明度计算）
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
    }
    return '167,139,250';
  }

  return {
    calcAgentLevel,
    renderLevelBadge,
    renderLevelDetail
  };
})();

// 暴露到全局
window.calcAgentLevel = AgentLevel.calcAgentLevel;
window.renderLevelBadge = AgentLevel.renderLevelBadge;
window.renderLevelDetail = AgentLevel.renderLevelDetail;
