// Snoopy小龙虾办公室 - 每日目标系统
// 简单待办清单，可视化完成度，每日自动重置

const GOALS_MAX = 8;

const goalsState = {
  date: '',
  goals: [],
  loaded: false
};

// ─── Core ──────────────────────────────────────────────────

function loadGoals() {
  try {
    const raw = localStorage.getItem('snoopy_goals');
    if (!raw) return;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (data.date === today) {
      goalsState.date = data.date;
      goalsState.goals = data.goals || [];
    } else {
      // Archive yesterday and reset
      archiveGoals(data);
      goalsState.date = today;
      goalsState.goals = [];
    }
  } catch (_) { /* noop */ }
  goalsState.loaded = true;
}

function saveGoals() {
  const data = {
    date: goalsState.date || new Date().toISOString().slice(0, 10),
    goals: goalsState.goals
  };
  try { localStorage.setItem('snoopy_goals', JSON.stringify(data)); } catch (_) { /* noop */ }
}

function archiveGoals(data) {
  try {
    const raw = localStorage.getItem('snoopy_goals_history') || '[]';
    const history = JSON.parse(raw);
    if (data.goals && data.goals.length > 0) {
      history.push({
        date: data.date,
        total: data.goals.length,
        done: data.goals.filter(g => g.done).length
      });
    }
    // Keep last 30 days
    const trimmed = history.slice(-30);
    localStorage.setItem('snoopy_goals_history', JSON.stringify(trimmed));
  } catch (_) { /* noop */ }
}

function addGoal(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || goalsState.goals.length >= GOALS_MAX) return;

  goalsState.goals = [...goalsState.goals, { text: trimmed, done: false, id: Date.now() }];
  goalsState.date = new Date().toISOString().slice(0, 10);
  saveGoals();
  renderGoalsPanel();
}

function toggleGoal(id) {
  goalsState.goals = goalsState.goals.map(g =>
    g.id === id ? { ...g, done: !g.done } : g
  );
  saveGoals();
  renderGoalsPanel();

  // Check if all done
  const allDone = goalsState.goals.length > 0 && goalsState.goals.every(g => g.done);
  if (allDone && typeof showShortcutToast === 'function') {
    showShortcutToast('🎉 今日目标全部完成！');
    if (typeof notifyAchievement === 'function') {
      notifyAchievement('目标全达成', '完成了今天所有目标');
    }
  }
}

function removeGoal(id) {
  goalsState.goals = goalsState.goals.filter(g => g.id !== id);
  saveGoals();
  renderGoalsPanel();
}

// ─── Render ────────────────────────────────────────────────

function renderGoalsPanel() {
  const container = document.getElementById('goals-container');
  if (!container) return;

  if (!goalsState.loaded) loadGoals();

  const total = goalsState.goals.length;
  const done = goalsState.goals.filter(g => g.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  let html = '';

  // Progress bar
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
  html += '<div style="flex:1;height:6px;background:#1f2937;border-radius:3px;overflow:hidden;">';
  const barColor = pct === 100 ? '#22c55e' : pct > 50 ? '#06b6d4' : '#fbbf24';
  html += `<div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width 0.3s ease;"></div>`;
  html += '</div>';
  html += `<span style="color:${barColor};font-size:11px;min-width:36px;text-align:right;">${done}/${total}</span>`;
  html += '</div>';

  // Input
  html += '<div style="display:flex;gap:6px;margin-bottom:8px;">';
  html += `<input id="goal-input" type="text" placeholder="添加今日目标..." maxlength="50" style="flex:1;background:#1f2937;border:1px solid #333;border-radius:4px;padding:5px 8px;color:#e5e7eb;font-family:ArkPixel,monospace;font-size:11px;outline:none;" onkeydown="if(event.key==='Enter'){addGoal(this.value);this.value='';}" ${total >= GOALS_MAX ? 'disabled' : ''}>`;
  html += `<button onclick="const i=document.getElementById('goal-input');addGoal(i.value);i.value='';" style="background:#06b6d422;border:1px solid #06b6d433;color:#06b6d4;border-radius:4px;padding:4px 10px;cursor:pointer;font-family:ArkPixel,monospace;font-size:11px;" ${total >= GOALS_MAX ? 'disabled' : ''}>+</button>`;
  html += '</div>';

  // Goals list
  if (total === 0) {
    html += '<div style="color:#4b5563;font-size:11px;text-align:center;padding:12px 0;">还没有设定目标，开始新的一天吧 ✨</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto;">';
    for (const goal of goalsState.goals) {
      const doneStyle = goal.done
        ? 'text-decoration:line-through;color:#6b7280;'
        : 'color:#d1d5db;';
      const checkColor = goal.done ? '#22c55e' : '#555';
      const checkBg = goal.done ? 'rgba(34,197,94,0.15)' : 'transparent';

      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:4px;background:rgba(255,255,255,0.02);">`;
      html += `<span onclick="toggleGoal(${goal.id})" style="cursor:pointer;width:16px;height:16px;border:2px solid ${checkColor};border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${checkBg};font-size:10px;">${goal.done ? '✓' : ''}</span>`;
      html += `<span style="flex:1;font-size:11px;${doneStyle}">${escapeGoalHtml(goal.text)}</span>`;
      html += `<span onclick="removeGoal(${goal.id})" style="cursor:pointer;color:#4b5563;font-size:10px;padding:2px 4px;">✕</span>`;
      html += '</div>';
    }
    html += '</div>';
  }

  // History summary
  const history = getGoalsHistory();
  if (history.length > 0) {
    const recentDays = history.slice(-7);
    const avgPct = Math.round(recentDays.reduce((sum, d) => sum + (d.total > 0 ? (d.done / d.total) * 100 : 0), 0) / recentDays.length);
    html += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;">`;
    html += `<span style="color:#6b7280;font-size:10px;">近7天平均完成率</span>`;
    html += `<span style="color:#06b6d4;font-size:10px;font-weight:bold;">${avgPct}%</span>`;
    html += '</div>';
  }

  container.innerHTML = html;
}

function getGoalsHistory() {
  try {
    const raw = localStorage.getItem('snoopy_goals_history');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function escapeGoalHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Init ──────────────────────────────────────────────────

window.addGoal = addGoal;
window.toggleGoal = toggleGoal;
window.removeGoal = removeGoal;

document.addEventListener('DOMContentLoaded', () => {
  loadGoals();
  setTimeout(renderGoalsPanel, 500);
});
