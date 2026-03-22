// Snoopy小龙虾办公室 - 久坐提醒 & 健康助手
// 定时提醒喝水、站立、眼部休息，守护程序员健康

const HEALTH_REMINDERS = [
  { type: 'water',    interval: 30, emoji: '💧', title: '喝水提醒', messages: ['该喝水啦！保持水分摄入~', '虾仔提醒你：来一杯水吧', '程序员的续命不只靠咖啡，喝杯水吧'] },
  { type: 'stand',    interval: 45, emoji: '🧍', title: '站立休息', messages: ['站起来活动一下！', '久坐伤身，起来走走吧', '伸个懒腰，做几个深蹲'] },
  { type: 'eyes',     interval: 20, emoji: '👀', title: '护眼休息', messages: ['20-20-20法则：看20米外20秒', '眨眨眼睛，让眼睛休息一下', '闭眼放松10秒，保护视力'] },
  { type: 'stretch',  interval: 60, emoji: '🤸', title: '拉伸运动', messages: ['转转脖子，活动肩膀', '做几个手腕旋转，预防腱鞘炎', '扭扭腰，活动下脊柱'] }
];

const healthState = {
  enabled: true,
  timers: {},
  lastRemind: {},
  todayCount: { water: 0, stand: 0, eyes: 0, stretch: 0 },
  panelVisible: false,
  customIntervals: {}
};

// ─── Core ──────────────────────────────────────────────────

function startHealthReminders() {
  stopHealthReminders();
  if (!healthState.enabled) return;

  for (const reminder of HEALTH_REMINDERS) {
    const interval = (healthState.customIntervals[reminder.type] || reminder.interval) * 60 * 1000;
    healthState.timers[reminder.type] = setInterval(() => {
      triggerHealthReminder(reminder);
    }, interval);
  }
}

function stopHealthReminders() {
  for (const key of Object.keys(healthState.timers)) {
    clearInterval(healthState.timers[key]);
    clearTimeout(healthState.timers[key]);
  }
  healthState.timers = {};
}

function toggleHealthReminders() {
  healthState.enabled = !healthState.enabled;
  if (healthState.enabled) {
    startHealthReminders();
  } else {
    stopHealthReminders();
  }
  saveHealthSettings();
  renderHealthPanel();
}

function triggerHealthReminder(reminder) {
  // Skip if in focus mode
  if (typeof focusState !== 'undefined' && focusState.active) return;

  const messages = reminder.messages;
  const msg = messages[Math.floor(Math.random() * messages.length)];

  healthState.todayCount[reminder.type] = (healthState.todayCount[reminder.type] || 0) + 1;
  healthState.lastRemind[reminder.type] = Date.now();
  saveHealthData();

  showHealthPopup(reminder.emoji, reminder.title, msg, reminder.type);
}

// ─── UI ────────────────────────────────────────────────────

function showHealthPopup(emoji, title, message, type) {
  // Remove existing
  const existing = document.getElementById('health-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'health-popup';

  const colors = {
    water: '#3b82f6', stand: '#22c55e',
    eyes: '#a78bfa', stretch: '#f59e0b'
  };
  const color = colors[type] || '#06b6d4';

  popup.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%',
    'transform:translateX(-50%) translateY(20px)',
    'background:rgba(10,10,20,0.95)',
    `border:1px solid ${color}44`,
    'border-radius:12px', 'padding:14px 20px',
    'z-index:10004', 'font-family:ArkPixel,monospace',
    'min-width:260px', 'max-width:360px', 'text-align:center',
    `box-shadow:0 4px 24px ${color}22`,
    'opacity:0', 'transition:all 0.3s ease'
  ].join(';');

  popup.innerHTML = `
    <div style="font-size:28px;margin-bottom:4px;">${emoji}</div>
    <div style="color:${color};font-size:13px;font-weight:bold;margin-bottom:4px;">${title}</div>
    <div style="color:#d1d5db;font-size:11px;line-height:1.5;">${message}</div>
    <div style="margin-top:10px;display:flex;gap:8px;justify-content:center;">
      <button onclick="dismissHealthPopup()" style="background:${color}22;border:1px solid ${color}44;color:${color};padding:4px 14px;border-radius:4px;cursor:pointer;font-family:ArkPixel,monospace;font-size:11px;">知道了</button>
      <button onclick="snoozeHealthReminder('${type}')" style="background:rgba(255,255,255,0.05);border:1px solid #333;color:#6b7280;padding:4px 14px;border-radius:4px;cursor:pointer;font-family:ArkPixel,monospace;font-size:11px;">稍后提醒</button>
    </div>
  `;

  document.body.appendChild(popup);
  requestAnimationFrame(() => {
    popup.style.opacity = '1';
    popup.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Auto dismiss after 15s
  setTimeout(() => {
    if (popup.parentNode) dismissHealthPopup();
  }, 15000);
}

function dismissHealthPopup() {
  const popup = document.getElementById('health-popup');
  if (!popup) return;
  popup.style.opacity = '0';
  popup.style.transform = 'translateX(-50%) translateY(20px)';
  setTimeout(() => popup.remove(), 300);
}

function snoozeHealthReminder(type) {
  dismissHealthPopup();
  // Snooze 10 min for this type
  if (healthState.timers[type]) {
    clearInterval(healthState.timers[type]);
  }
  const reminder = HEALTH_REMINDERS.find(r => r.type === type);
  if (reminder) {
    healthState.timers[type] = setTimeout(() => {
      triggerHealthReminder(reminder);
      // Restart normal interval
      const interval = (healthState.customIntervals[type] || reminder.interval) * 60 * 1000;
      healthState.timers[type] = setInterval(() => triggerHealthReminder(reminder), interval);
    }, 10 * 60 * 1000);
  }
}

// ─── Panel ─────────────────────────────────────────────────

function renderHealthPanel() {
  const container = document.getElementById('health-container');
  if (!container) return;

  let html = '';

  // Toggle
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html += `<span style="color:${healthState.enabled ? '#22c55e' : '#6b7280'};font-size:11px;">${healthState.enabled ? '✅ 已开启' : '❌ 已关闭'}</span>`;
  html += `<button onclick="toggleHealthReminders()" style="background:${healthState.enabled ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'};border:1px solid ${healthState.enabled ? '#ef444433' : '#22c55e33'};color:${healthState.enabled ? '#ef4444' : '#22c55e'};border-radius:4px;padding:3px 10px;cursor:pointer;font-family:ArkPixel,monospace;font-size:10px;">${healthState.enabled ? '关闭' : '开启'}</button>`;
  html += '</div>';

  // Reminder cards
  const colors = { water: '#3b82f6', stand: '#22c55e', eyes: '#a78bfa', stretch: '#f59e0b' };

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
  for (const reminder of HEALTH_REMINDERS) {
    const color = colors[reminder.type];
    const count = healthState.todayCount[reminder.type] || 0;
    const interval = healthState.customIntervals[reminder.type] || reminder.interval;
    const lastTime = healthState.lastRemind[reminder.type];
    const lastStr = lastTime ? formatTimeAgo(lastTime) : '暂无';

    html += `<div style="background:rgba(255,255,255,0.03);border:1px solid ${color}22;border-radius:6px;padding:8px;text-align:center;">`;
    html += `<div style="font-size:20px;">${reminder.emoji}</div>`;
    html += `<div style="color:${color};font-size:11px;font-weight:bold;margin:2px 0;">${reminder.title}</div>`;
    html += `<div style="color:#6b7280;font-size:9px;">每${interval}分钟 · 今日${count}次</div>`;
    html += `<div style="color:#4b5563;font-size:9px;margin-top:2px;">上次: ${lastStr}</div>`;
    html += '</div>';
  }
  html += '</div>';

  // Today summary
  const totalReminders = Object.values(healthState.todayCount).reduce((a, b) => a + b, 0);
  html += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">`;
  html += `<span style="color:#6b7280;font-size:10px;">今日健康提醒: </span>`;
  html += `<span style="color:#22c55e;font-size:10px;font-weight:bold;">${totalReminders}次</span>`;
  html += '</div>';

  container.innerHTML = html;
}

function formatTimeAgo(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  return Math.floor(diff / 3600) + '小时前';
}

// ─── Persistence ───────────────────────────────────────────

function saveHealthSettings() {
  try {
    localStorage.setItem('snoopy_health_settings', JSON.stringify({
      enabled: healthState.enabled,
      customIntervals: healthState.customIntervals
    }));
  } catch (_) { /* noop */ }
}

function saveHealthData() {
  try {
    localStorage.setItem('snoopy_health_data', JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      todayCount: healthState.todayCount,
      lastRemind: healthState.lastRemind
    }));
  } catch (_) { /* noop */ }
}

function loadHealthData() {
  try {
    const settings = localStorage.getItem('snoopy_health_settings');
    if (settings) {
      const s = JSON.parse(settings);
      healthState.enabled = s.enabled !== false;
      healthState.customIntervals = s.customIntervals || {};
    }

    const data = localStorage.getItem('snoopy_health_data');
    if (data) {
      const d = JSON.parse(data);
      const today = new Date().toISOString().slice(0, 10);
      if (d.date === today) {
        healthState.todayCount = d.todayCount || {};
        healthState.lastRemind = d.lastRemind || {};
      }
    }
  } catch (_) { /* noop */ }
}

// ─── Init ──────────────────────────────────────────────────

window.toggleHealthReminders = toggleHealthReminders;
window.dismissHealthPopup = dismissHealthPopup;
window.snoozeHealthReminder = snoozeHealthReminder;

document.addEventListener('DOMContentLoaded', () => {
  loadHealthData();
  setTimeout(() => {
    startHealthReminders();
    renderHealthPanel();
  }, 2000);
});
