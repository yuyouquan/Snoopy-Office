// Star Office UI - 综合分析仪表板
// 包含：团队对比、工作分析、效率建议、事件日志、仪表板配置

const analyticsState = {
  events: [],
  dashboardLayout: JSON.parse(localStorage.getItem('dashboardLayout') || 'null') || {
    stats: true,
    timeline: true,
    cron: true,
    heatmap: true,
    memo: true,
    leaderboard: true,
    atmosphere: true,
    fortune: true,
  },
  maxEvents: 100,
};

// ─── 事件日志 ──────────────────────────────

function addEvent(type, title, detail, level = 'INFO') {
  const event = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString('zh-CN'),
    type,
    title,
    detail,
    level,  // INFO, WARNING, ERROR
  };
  analyticsState.events.unshift(event);
  if (analyticsState.events.length > analyticsState.maxEvents) {
    analyticsState.events.pop();
  }
  updateEventLog();
}

function updateEventLog() {
  const logEl = document.getElementById('event-log-container');
  if (!logEl) return;

  const html = analyticsState.events.map(evt => {
    const levelColor = {
      'INFO': '#3b82f6',
      'WARNING': '#f59e0b',
      'ERROR': '#ef4444',
    }[evt.level] || '#3b82f6';

    const levelIcon = { 'INFO': 'ℹ️', 'WARNING': '⚠️', 'ERROR': '❌' }[evt.level] || 'ℹ️';

    return `
      <div style="padding: 8px; border-bottom: 1px solid #2a2a3e; font-size: 11px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="color: ${levelColor}; font-weight: bold;">${levelIcon}</span>
          <span style="color: #9ca3af; min-width: 70px;">${evt.timestamp}</span>
          <span style="color: #d1d5db; flex: 1;">${evt.title}</span>
        </div>
        ${evt.detail ? `<div style="margin-left: 32px; color: #6b7280; font-size: 10px;">${evt.detail}</div>` : ''}
      </div>
    `;
  }).join('');

  logEl.innerHTML = html || '<div style="padding: 15px; color: #4b5563; text-align: center;">暂无事件</div>';
}

// ─── 工作效率分析 ──────────────────────────────

function analyzeEfficiency() {
  const openclaw = window.openclawData || {};
  const cronJobs = openclaw.cronJobs || [];
  const heatmapData = window.heatmapStats || { days: [] };

  const analysis = {
    peakHours: calculatePeakHours(),
    frequentTasks: cronJobs.slice(0, 3).map(j => ({ name: j.name, status: j.lastStatus })),
    successRate: calculateSuccessRate(cronJobs),
    suggestions: generateSuggestions(cronJobs, heatmapData.days || []),
  };

  return analysis;
}

function calculatePeakHours() {
  const hours = {};
  for (let i = 0; i < 24; i++) {
    hours[i] = Math.floor(Math.random() * 100);  // 演示数据
  }
  const peak = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
  return peak ? peak[0] + ':00' : '09:00';
}

function calculateSuccessRate(jobs) {
  const total = jobs.length;
  const successful = jobs.filter(j => j.lastStatus === 'ok').length;
  return total > 0 ? ((successful / total) * 100).toFixed(1) : 0;
}

function generateSuggestions(jobs, heatmap) {
  const suggestions = [];

  const failedJobs = jobs.filter(j => j.lastStatus === 'error');
  if (failedJobs.length > 0) {
    suggestions.push(`🔧 发现 ${failedJobs.length} 个失败的任务，建议检查并修复`);
  }

  const activeDays = heatmap.filter(d => d.count > 0).length;
  if (activeDays >= 6) {
    suggestions.push('💪 工作很积极！近期有 ' + activeDays + ' 天活动');
  } else {
    suggestions.push('😴 建议增加活动频率，目标每周7天活动');
  }

  suggestions.push('⏰ 根据历史数据，建议将重要任务安排在 09:00-14:00 之间');
  suggestions.push('📊 定期导出报告以追踪工作进度');

  return suggestions;
}

// ─── 团队成员对比 ──────────────────────────────

function getTeamComparison() {
  const openclaw = window.openclawData || {};
  const agents = openclaw.agentDetails || [];

  return agents.map(agent => ({
    name: agent.name,
    tokens: (agent.totalInputTokens || 0) + (agent.totalOutputTokens || 0),
    sessions: agent.totalSessions || 0,
    status: agent.status,
  })).sort((a, b) => b.tokens - a.tokens);
}

// ─── 仪表板配置 ──────────────────────────────

function saveDashboardLayout(layout) {
  analyticsState.dashboardLayout = layout;
  localStorage.setItem('dashboardLayout', JSON.stringify(layout));
}

function showDashboardSettings() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 10001;
    display: flex; align-items: center; justify-content: center;
  `;

  const layout = analyticsState.dashboardLayout;
  let settingsHtml = '<div style="background: #1a1a2e; padding: 20px; border-radius: 8px; color: #fff; max-width: 400px;">';
  settingsHtml += '<h3 style="margin-top: 0; color: #3b82f6;">⚙️ 仪表板设置</h3>';
  settingsHtml += '<p style="color: #9ca3af; font-size: 12px;">选择要显示的模块：</p>';

  const modules = [
    { key: 'stats', label: '📊 统计面板' },
    { key: 'timeline', label: '📈 活动时间线' },
    { key: 'cron', label: '⏰ Cron面板' },
    { key: 'heatmap', label: '🔥 热力图' },
    { key: 'memo', label: '📝 日记' },
    { key: 'leaderboard', label: '🥇 排行榜' },
    { key: 'atmosphere', label: '🌙 氛围系统' },
    { key: 'fortune', label: '🎯 日签' },
  ];

  modules.forEach(module => {
    const checked = layout[module.key] ? 'checked' : '';
    settingsHtml += `
      <label style="display: block; margin: 10px 0; font-size: 12px;">
        <input type="checkbox" id="mod-${module.key}" ${checked} style="margin-right: 8px;">
        ${module.label}
      </label>
    `;
  });

  settingsHtml += `
    <div style="margin-top: 20px; display: flex; gap: 10px;">
      <button id="save-settings" style="flex: 1; padding: 10px; background: #3b82f6; border: none; border-radius: 4px; color: #fff; cursor: pointer;">保存</button>
      <button id="cancel-settings" style="flex: 1; padding: 10px; background: #444; border: none; border-radius: 4px; color: #fff; cursor: pointer;">取消</button>
    </div>
  </div>`;

  modal.innerHTML = settingsHtml;
  document.body.appendChild(modal);

  document.getElementById('save-settings').onclick = () => {
    const newLayout = {};
    modules.forEach(m => {
      newLayout[m.key] = document.getElementById(`mod-${m.key}`).checked;
    });
    saveDashboardLayout(newLayout);
    modal.remove();
    alert('✅ 仪表板配置已保存，刷新页面生效');
  };

  document.getElementById('cancel-settings').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ─── 显示分析仪表板 ──────────────────────────────

function showAnalyticsDashboard() {
  if (document.getElementById('analytics-modal')) {
    document.getElementById('analytics-modal').remove();
    return;
  }

  const analysis = analyzeEfficiency();
  const teamData = getTeamComparison();

  const modal = document.createElement('div');
  modal.id = 'analytics-modal';
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #1a1a2e; border: 2px solid #8b5cf6; border-radius: 8px;
    padding: 20px; width: 95%; max-width: 1000px; max-height: 85vh;
    overflow-y: auto; z-index: 10000; color: #fff;
    font-family: ArkPixel, monospace; box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
  `;

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #8b5cf6;">📊 工作分析仪表板</h2>
      <button id="close-analytics" style="background: #444; color: #fff; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">关闭</button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px;">
      <!-- 效率指标 -->
      <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e;">
        <h3 style="margin-top: 0; color: #9ca3af; font-size: 12px;">效率指标</h3>
        <div style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0;">${analysis.successRate}%</div>
        <div style="color: #6b7280; font-size: 11px;">任务成功率</div>
        <div style="margin-top: 10px; color: #9ca3af; font-size: 11px;">高峰时段: ${analysis.peakHours}</div>
      </div>

      <!-- 频繁任务 -->
      <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e;">
        <h3 style="margin-top: 0; color: #9ca3af; font-size: 12px;">频繁任务</h3>
        ${analysis.frequentTasks.map(t => `
          <div style="margin: 8px 0; font-size: 11px;">
            <span style="color: #d1d5db;">${t.name}</span>
            <span style="color: ${t.status === 'ok' ? '#22c55e' : '#ef4444'}; margin-left: 5px;">
              ${t.status === 'ok' ? '✓' : '✗'}
            </span>
          </div>
        `).join('')}
      </div>

      <!-- 团队排行 -->
      <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e;">
        <h3 style="margin-top: 0; color: #9ca3af; font-size: 12px;">团队排行 (Token消耗)</h3>
        ${teamData.slice(0, 3).map((agent, idx) => `
          <div style="margin: 8px 0; font-size: 11px;">
            <span>${'🥇🥈🥉'[idx]}</span>
            <span style="color: #d1d5db; margin-left: 5px;">${agent.name}</span>
            <span style="color: #9ca3af; margin-left: auto; display: inline-block; min-width: 60px; text-align: right;">
              ${(agent.tokens / 1e6).toFixed(1)}M
            </span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 改进建议 -->
    <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #9ca3af; font-size: 12px;">💡 智能建议</h3>
      ${analysis.suggestions.map(s => `
        <div style="margin: 8px 0; font-size: 11px; color: #d1d5db; padding: 8px; background: #1a1a2e; border-radius: 4px;">
          ${s}
        </div>
      `).join('')}
    </div>

    <!-- 事件日志 -->
    <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e;">
      <h3 style="margin-top: 0; color: #9ca3af; font-size: 12px;">📋 最近事件</h3>
      <div id="event-log-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #2a2a3e; border-radius: 4px;"></div>
    </div>
  `;

  modal.innerHTML = html;
  document.body.appendChild(modal);

  updateEventLog();

  document.getElementById('close-analytics').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ─── 初始化和集成 ──────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // 添加分析和配置按钮
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      position: fixed; bottom: 60px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 999;
    `;

    const analyticsBtn = document.createElement('button');
    analyticsBtn.textContent = '📊 分析';
    analyticsBtn.style.cssText = `
      padding: 12px 16px; background: #8b5cf6; color: #fff;
      border: none; border-radius: 4px; cursor: pointer;
      font-family: ArkPixel, monospace; font-size: 12px;
      transition: all 0.2s;
    `;
    analyticsBtn.onmouseover = () => analyticsBtn.style.background = '#7c3aed';
    analyticsBtn.onmouseout = () => analyticsBtn.style.background = '#8b5cf6';
    analyticsBtn.onclick = showAnalyticsDashboard;

    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '⚙️ 设置';
    settingsBtn.style.cssText = `
      padding: 12px 16px; background: #06b6d4; color: #fff;
      border: none; border-radius: 4px; cursor: pointer;
      font-family: ArkPixel, monospace; font-size: 12px;
      transition: all 0.2s;
    `;
    settingsBtn.onmouseover = () => settingsBtn.style.background = '#0891b2';
    settingsBtn.onmouseout = () => settingsBtn.style.background = '#06b6d4';
    settingsBtn.onclick = showDashboardSettings;

    btnContainer.appendChild(analyticsBtn);
    btnContainer.appendChild(settingsBtn);
    document.body.appendChild(btnContainer);
  }, 2000);

  // 定期添加示例事件
  setInterval(() => {
    const eventTypes = ['Cron执行', 'Agent上线', 'Agent离线', '任务完成'];
    if (Math.random() > 0.8) {
      addEvent('system', eventTypes[Math.floor(Math.random() * eventTypes.length)], '', 'INFO');
    }
  }, 30000);
});

window.showAnalyticsDashboard = showAnalyticsDashboard;
window.showDashboardSettings = showDashboardSettings;
window.addEvent = addEvent;
