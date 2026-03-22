// Snoopy小龙虾办公室 - 生产力周报
// 数据洞察：最佳工作时段、心情关联、效率趋势

const weeklyReportState = {
  data: null,
  generated: false
};

// ─── Data Collection ───────────────────────────────────────

function collectWeeklyData() {
  const data = {
    pomodoro: collectPomodoroData(),
    moods: collectMoodData(),
    goals: collectGoalsData(),
    focus: collectFocusData(),
    health: collectHealthData(),
    heatmap: collectHeatmapData()
  };
  return data;
}

function collectPomodoroData() {
  if (typeof pomodoroState === 'undefined') return { rounds: 0, minutes: 0 };
  return {
    rounds: pomodoroState.completedRounds || 0,
    minutes: Math.floor((pomodoroState.totalWorkSeconds || 0) / 60)
  };
}

function collectMoodData() {
  if (typeof moodState === 'undefined') return { current: null, history: [] };
  return {
    current: moodState.current || null,
    changes: moodState.changes || 0
  };
}

function collectGoalsData() {
  try {
    const raw = localStorage.getItem('snoopy_goals_history');
    return raw ? JSON.parse(raw).slice(-7) : [];
  } catch (_) { return []; }
}

function collectFocusData() {
  try {
    const raw = localStorage.getItem('snoopy_focus');
    if (!raw) return { sessions: [], totalToday: 0 };
    const data = JSON.parse(raw);
    return {
      sessions: (data.sessions || []).slice(-30),
      totalToday: data.totalToday || 0
    };
  } catch (_) { return { sessions: [], totalToday: 0 }; }
}

function collectHealthData() {
  try {
    const raw = localStorage.getItem('snoopy_health_data');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_) { return {}; }
}

function collectHeatmapData() {
  try {
    const raw = localStorage.getItem('snoopy_heatmap_cache');
    if (!raw) return [];
    return JSON.parse(raw).slice(-7);
  } catch (_) { return []; }
}

// ─── Analysis ──────────────────────────────────────────────

function analyzeProductivity(data) {
  const insights = [];
  const tips = [];

  // Pomodoro analysis
  const pomo = data.pomodoro;
  if (pomo.rounds > 0) {
    if (pomo.rounds >= 8) {
      insights.push({ emoji: '🔥', text: `完成${pomo.rounds}个番茄钟，超级高产！`, type: 'positive' });
    } else if (pomo.rounds >= 4) {
      insights.push({ emoji: '👍', text: `完成${pomo.rounds}个番茄钟，稳定输出`, type: 'positive' });
    } else {
      insights.push({ emoji: '🍅', text: `完成${pomo.rounds}个番茄钟`, type: 'neutral' });
      tips.push('尝试连续完成4个番茄钟，形成高效工作节奏');
    }
  }

  // Focus analysis
  const focus = data.focus;
  const focusSessions = focus.sessions.filter(s => {
    const d = new Date(s.start);
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return d.getTime() > weekAgo;
  });

  if (focusSessions.length > 0) {
    const totalFocusMins = Math.floor(focusSessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    const avgSession = Math.floor(totalFocusMins / focusSessions.length);
    insights.push({ emoji: '🎯', text: `${focusSessions.length}次深度专注，共${totalFocusMins}分钟`, type: 'positive' });

    if (avgSession < 25) {
      tips.push('平均专注时长不足25分钟，尝试更长的深度工作');
    }

    // Best focus hour
    const hourCounts = {};
    for (const s of focusSessions) {
      const h = new Date(s.start).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
    const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestHour) {
      insights.push({ emoji: '⏰', text: `最佳专注时段: ${bestHour[0]}:00`, type: 'info' });
    }
  }

  // Goals analysis
  const goals = data.goals;
  if (goals.length > 0) {
    const totalGoals = goals.reduce((sum, d) => sum + d.total, 0);
    const totalDone = goals.reduce((sum, d) => sum + d.done, 0);
    const completionRate = totalGoals > 0 ? Math.round((totalDone / totalGoals) * 100) : 0;

    insights.push({ emoji: '📋', text: `目标完成率: ${completionRate}% (${totalDone}/${totalGoals})`, type: completionRate >= 80 ? 'positive' : 'neutral' });

    if (completionRate < 60) {
      tips.push('目标完成率偏低，尝试设定更具体、可达成的小目标');
    }
    if (completionRate === 100) {
      tips.push('连续全部完成！可以挑战更有难度的目标');
    }
  }

  // Mood analysis
  const mood = data.moods;
  if (mood.current) {
    const moodLabels = {
      energetic: '精力充沛', happy: '开心', focused: '专注',
      tired: '疲惫', creative: '灵感爆发', chill: '摸鱼中'
    };
    insights.push({ emoji: '😊', text: `当前心情: ${moodLabels[mood.current] || mood.current}`, type: 'info' });
  }

  // Health analysis
  const health = data.health;
  if (health.todayCount) {
    const total = Object.values(health.todayCount).reduce((a, b) => a + b, 0);
    if (total > 0) {
      insights.push({ emoji: '💪', text: `今日${total}次健康提醒`, type: 'positive' });
    }
  }

  // Generate summary score
  let score = 50;
  if (pomo.rounds >= 4) score += 15;
  if (pomo.rounds >= 8) score += 10;
  if (focusSessions.length >= 3) score += 15;
  if (goals.length > 0) {
    const rate = goals.reduce((s, d) => s + (d.total > 0 ? d.done / d.total : 0), 0) / goals.length;
    score += Math.round(rate * 20);
  }
  score = Math.min(100, score);

  if (tips.length === 0) {
    tips.push('继续保持良好的工作节奏！');
  }

  return { insights, tips, score };
}

// ─── Render ────────────────────────────────────────────────

function renderWeeklyReport() {
  const container = document.getElementById('weekly-report-container');
  if (!container) return;

  const data = collectWeeklyData();
  const analysis = analyzeProductivity(data);

  let html = '';

  // Score circle
  const scoreColor = analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#06b6d4' : '#fbbf24';
  html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">';
  html += `<div style="width:56px;height:56px;border-radius:50%;border:3px solid ${scoreColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${scoreColor}11;">`;
  html += `<span style="color:${scoreColor};font-size:18px;font-weight:bold;">${analysis.score}</span>`;
  html += '</div>';
  html += '<div>';
  html += `<div style="color:#e5e7eb;font-size:13px;font-weight:bold;">生产力指数</div>`;
  const scoreLabel = analysis.score >= 80 ? '表现优秀' : analysis.score >= 60 ? '稳步前进' : '需要加油';
  html += `<div style="color:${scoreColor};font-size:11px;">${scoreLabel}</div>`;
  html += '</div>';
  html += '</div>';

  // Insights
  if (analysis.insights.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">';
    for (const insight of analysis.insights) {
      const bg = insight.type === 'positive' ? 'rgba(34,197,94,0.08)' :
                 insight.type === 'info' ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.03)';
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:4px;background:${bg};">`;
      html += `<span style="font-size:14px;">${insight.emoji}</span>`;
      html += `<span style="color:#d1d5db;font-size:11px;">${insight.text}</span>`;
      html += '</div>';
    }
    html += '</div>';
  }

  // Tips
  if (analysis.tips.length > 0) {
    html += '<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;">';
    html += '<div style="color:#fbbf24;font-size:11px;font-weight:bold;margin-bottom:4px;">💡 建议</div>';
    for (const tip of analysis.tips) {
      html += `<div style="color:#9ca3af;font-size:10px;padding:2px 0;padding-left:12px;position:relative;">`;
      html += `<span style="position:absolute;left:0;color:#fbbf2466;">·</span>${tip}`;
      html += '</div>';
    }
    html += '</div>';
  }

  // Daily trend mini chart (last 7 days goals)
  const goals = data.goals;
  if (goals.length >= 3) {
    html += '<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;margin-top:8px;">';
    html += '<div style="color:#a78bfa;font-size:11px;font-weight:bold;margin-bottom:6px;">📈 近7天目标完成趋势</div>';
    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:40px;">';
    for (const day of goals) {
      const pct = day.total > 0 ? (day.done / day.total) * 100 : 0;
      const h = Math.max(4, (pct / 100) * 36);
      const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#06b6d4' : '#fbbf24';
      html += `<div style="flex:1;height:${h}px;background:${color}44;border-radius:2px;border-top:2px solid ${color};" title="${day.date}: ${Math.round(pct)}%"></div>`;
    }
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

// ─── Init ──────────────────────────────────────────────────

window.renderWeeklyReport = renderWeeklyReport;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(renderWeeklyReport, 1500);
});
