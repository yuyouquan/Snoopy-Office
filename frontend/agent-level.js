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

  // 等级颜色（紫色系）+ RGB预计算
  const LEVEL_COLORS = {
    1: { hex: '#6366f1', rgb: '99,102,241' },      // indigo
    2: { hex: '#8b5cf6', rgb: '139,92,246' },      // violet
    3: { hex: '#a78bfa', rgb: '167,139,250' },     // purple
    4: { hex: '#c084fc', rgb: '192,132,252' },     // fuchsia
    5: { hex: '#d946ef', rgb: '217,70,239' }       // magenta
  };

  // 样式常量
  const STYLES = {
    badge: 'font-size:9px;font-weight:600;border-radius:4px;padding:2px 6px;white-space:nowrap;',
    detailContainer: 'margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;',
    detailHeader: 'display:flex;align-items:center;gap:6px;margin-bottom:6px;',
    progressBar: 'background:#1e293b;border-radius:4px;height:5px;margin-bottom:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);',
    progressFill: 'height:100%;transition:width 0.3s ease;',
    icon: 'font-size:14px;',
    levelText: 'font-size:12px;font-weight:600;',
    arrowText: 'color:#6b7280;font-size:10px;',
    nextLevelText: 'color:#6b7280;font-size:11px;opacity:0.7;',
    sessionsText: 'font-size:10px;color:#9ca3af;',
    maxLevelText: 'font-size:10px;color:#22c55e;font-weight:600;'
  };

  function calcAgentLevel(agent) {
    if (!agent) return null;

    const sessions = agent.totalSessions || 0;
    const tokens = (agent.totalInputTokens || 0) + (agent.totalOutputTokens || 0);

    // 二分查找当前等级（虽然数据小，但逻辑更清晰）
    const levelIndex = LEVELS.findIndex((lv, i) =>
      sessions >= lv.minSessions && (i === LEVELS.length - 1 || sessions < LEVELS[i + 1].minSessions)
    );

    const currentLevel = LEVELS[levelIndex] || LEVELS[0];
    const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null;

    // 计算进度条百分比
    const progress = nextLevel
      ? Math.round(((sessions - currentLevel.minSessions) / (nextLevel.minSessions - currentLevel.minSessions)) * 100)
      : 100;

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      icon: currentLevel.icon,
      color: LEVEL_COLORS[currentLevel.level].hex,
      colorRgb: LEVEL_COLORS[currentLevel.level].rgb,
      progress: Math.min(progress, 100),
      sessions,
      tokens,
      nextLevel: nextLevel ? { level: nextLevel.level, title: nextLevel.title, icon: nextLevel.icon } : null,
      sessionsNeeded: nextLevel ? nextLevel.minSessions - sessions : 0
    };
  }

  // 渲染 Agent 卡片中的等级小徽章
  function renderLevelBadge(agent) {
    const info = calcAgentLevel(agent);
    if (!info) return '';

    return `<span style="${STYLES.badge}color:${info.color};background:rgba(${info.colorRgb},0.1);border:1px solid ${info.color}44;" title="${info.icon} ${info.title} Lv.${info.level}">Lv.${info.level}</span>`;
  }

  // 渲染工位弹窗中的完整等级详情
  function renderLevelDetail(agent) {
    const info = calcAgentLevel(agent);
    if (!info) return '';

    const nextColor = info.nextLevel ? LEVEL_COLORS[info.nextLevel.level].hex : info.color;
    const html = info.nextLevel
      ? `<div style="${STYLES.detailContainer}">
          <div style="${STYLES.detailHeader}">
            <span style="${STYLES.icon}">${info.icon}</span>
            <span style="${STYLES.levelText}color:${info.color};">Lv.${info.level} ${info.title}</span>
            <span style="${STYLES.arrowText}">→</span>
            <span style="${STYLES.nextLevelText}">Lv.${info.nextLevel.level} ${info.nextLevel.title}</span>
          </div>
          <div style="${STYLES.progressBar}">
            <div style="${STYLES.progressFill}width:${info.progress}%;background:linear-gradient(90deg,${info.color},${nextColor});"></div>
          </div>
          <div style="${STYLES.sessionsText}">还需 <span style="color:${info.color};font-weight:600;">${info.sessionsNeeded}</span> 次会话升级到 <span style="color:#9ca3af;">Lv.${info.nextLevel.level}</span></div>
        </div>`
      : `<div style="${STYLES.detailContainer}">
          <div style="${STYLES.detailHeader}">
            <span style="${STYLES.icon}">${info.icon}</span>
            <span style="${STYLES.levelText}color:${info.color};">Lv.${info.level} ${info.title}</span>
          </div>
          <div style="${STYLES.maxLevelText}">🎉 已达最高等级！</div>
        </div>`;

    return html;
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
