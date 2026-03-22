// Snoopy小龙虾办公室 - 专注模式
// 屏蔽干扰，追踪深度工作时间，提升效率

const FOCUS_CONFIG = {
  dimOpacity: 0.7,
  minSessionMinutes: 5,
  breakRemindMinutes: 45,
  maxSessionMinutes: 120
};

const focusState = {
  active: false,
  startTime: null,
  elapsed: 0,
  intervalId: null,
  totalToday: 0,
  sessions: [],
  breakReminded: false
};

// ─── Core ──────────────────────────────────────────────────

function focusStart() {
  if (focusState.active) return;

  focusState.active = true;
  focusState.startTime = Date.now();
  focusState.elapsed = 0;
  focusState.breakReminded = false;
  focusState.intervalId = setInterval(focusTick, 1000);

  applyFocusOverlay(true);
  updateFocusDisplay();
  suppressNotifications(true);

  if (typeof showShortcutToast === 'function') {
    showShortcutToast('🎯 专注模式已开启');
  }
}

function focusStop() {
  if (!focusState.active) return;

  const duration = Math.floor((Date.now() - focusState.startTime) / 1000);
  focusState.active = false;

  if (focusState.intervalId) {
    clearInterval(focusState.intervalId);
    focusState.intervalId = null;
  }

  // Record session if significant
  if (duration >= FOCUS_CONFIG.minSessionMinutes * 60) {
    const session = {
      start: focusState.startTime,
      duration: duration,
      date: new Date().toISOString().slice(0, 10)
    };
    focusState.sessions.push(session);
    focusState.totalToday += duration;
    saveFocusData();
  }

  applyFocusOverlay(false);
  updateFocusDisplay();
  suppressNotifications(false);

  const mins = Math.floor(duration / 60);
  if (typeof showShortcutToast === 'function') {
    showShortcutToast(`🎯 专注结束 · ${mins}分钟`);
  }
}

function focusToggle() {
  if (focusState.active) {
    focusStop();
  } else {
    focusStart();
  }
}

function focusTick() {
  if (!focusState.active) return;
  focusState.elapsed = Math.floor((Date.now() - focusState.startTime) / 1000);
  updateFocusDisplay();

  // Break reminder at 45 min
  const mins = focusState.elapsed / 60;
  if (mins >= FOCUS_CONFIG.breakRemindMinutes && !focusState.breakReminded) {
    focusState.breakReminded = true;
    showFocusReminder('已专注' + Math.floor(mins) + '分钟，适当休息一下吧');
  }

  // Auto-stop at max
  if (mins >= FOCUS_CONFIG.maxSessionMinutes) {
    focusStop();
    showFocusReminder('专注已达' + FOCUS_CONFIG.maxSessionMinutes + '分钟上限，自动结束');
  }
}

// ─── UI ────────────────────────────────────────────────────

function applyFocusOverlay(show) {
  let overlay = document.getElementById('focus-overlay');

  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'focus-overlay';
      overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(0,0,0,0)', 'z-index:9998', 'pointer-events:none',
        'transition:background 0.5s ease'
      ].join(';');
      document.body.appendChild(overlay);
    }
    requestAnimationFrame(() => {
      overlay.style.background = 'rgba(0,0,0,0.15)';
    });

    // Add focus indicator
    let indicator = document.getElementById('focus-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'focus-indicator';
      indicator.style.cssText = [
        'position:fixed', 'top:12px', 'right:12px',
        'background:rgba(239,68,68,0.9)', 'color:#fff',
        'padding:6px 14px', 'border-radius:20px',
        'font-family:ArkPixel,monospace', 'font-size:12px',
        'z-index:10003', 'display:flex', 'align-items:center', 'gap:6px',
        'cursor:pointer', 'border:1px solid rgba(255,255,255,0.2)',
        'box-shadow:0 2px 12px rgba(239,68,68,0.3)',
        'animation:focus-pulse 2s ease-in-out infinite'
      ].join(';');
      indicator.onclick = focusStop;
      document.body.appendChild(indicator);
    }
  } else {
    if (overlay) {
      overlay.style.background = 'rgba(0,0,0,0)';
      setTimeout(() => overlay.remove(), 500);
    }
    const indicator = document.getElementById('focus-indicator');
    if (indicator) indicator.remove();
  }
}

function updateFocusDisplay() {
  const indicator = document.getElementById('focus-indicator');
  if (indicator && focusState.active) {
    const mins = Math.floor(focusState.elapsed / 60);
    const secs = focusState.elapsed % 60;
    const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    indicator.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:focus-dot-blink 1s ease infinite;"></span> 🎯 专注中 ${timeStr} <span style="font-size:10px;opacity:0.7;">点击结束</span>`;
  }

  // Update panel if exists
  const panelTimer = document.getElementById('focus-panel-timer');
  if (panelTimer) {
    if (focusState.active) {
      const mins = Math.floor(focusState.elapsed / 60);
      const secs = focusState.elapsed % 60;
      panelTimer.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      panelTimer.style.color = '#ef4444';
    } else {
      panelTimer.textContent = '00:00';
      panelTimer.style.color = '#6b7280';
    }
  }

  updateFocusPanelStats();
}

function updateFocusPanelStats() {
  const todayEl = document.getElementById('focus-today-total');
  if (todayEl) {
    const total = focusState.totalToday + (focusState.active ? focusState.elapsed : 0);
    todayEl.textContent = formatFocusDuration(total);
  }

  const countEl = document.getElementById('focus-session-count');
  if (countEl) {
    const count = focusState.sessions.filter(s =>
      s.date === new Date().toISOString().slice(0, 10)
    ).length + (focusState.active ? 1 : 0);
    countEl.textContent = count + '次';
  }
}

function formatFocusDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + 'h' + m + 'm';
  return m + '分钟';
}

function showFocusReminder(msg) {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'top:50%', 'left:50%',
    'transform:translate(-50%,-50%) scale(0.9)',
    'background:rgba(10,10,20,0.95)', 'color:#fbbf24',
    'padding:16px 28px', 'border-radius:12px',
    'font-family:ArkPixel,monospace', 'font-size:14px',
    'z-index:10005', 'border:1px solid #fbbf2444',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
    'transition:all 0.3s ease', 'text-align:center'
  ].join(';');
  el.textContent = '⏰ ' + msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-50%) scale(1)'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ─── Notification Suppression ──────────────────────────────

function suppressNotifications(suppress) {
  // Hide notification bell during focus
  const bell = document.getElementById('notif-bell');
  if (bell) {
    bell.style.opacity = suppress ? '0.2' : '1';
    bell.style.pointerEvents = suppress ? 'none' : 'auto';
  }
}

// ─── Persistence ───────────────────────────────────────────

function saveFocusData() {
  const data = {
    totalToday: focusState.totalToday,
    sessions: focusState.sessions.slice(-50),
    lastDate: new Date().toISOString().slice(0, 10)
  };
  try { localStorage.setItem('snoopy_focus', JSON.stringify(data)); } catch (_) { /* noop */ }
}

function loadFocusData() {
  try {
    const raw = localStorage.getItem('snoopy_focus');
    if (!raw) return;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    focusState.sessions = data.sessions || [];
    focusState.totalToday = data.lastDate === today ? (data.totalToday || 0) : 0;
  } catch (_) { /* noop */ }
}

// ─── Styles ────────────────────────────────────────────────

function injectFocusStyles() {
  if (document.getElementById('focus-styles')) return;
  const style = document.createElement('style');
  style.id = 'focus-styles';
  style.textContent = `
    @keyframes focus-pulse {
      0%, 100% { box-shadow: 0 2px 12px rgba(239,68,68,0.3); }
      50% { box-shadow: 0 2px 20px rgba(239,68,68,0.6); }
    }
    @keyframes focus-dot-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Init ──────────────────────────────────────────────────

window.focusToggle = focusToggle;
window.focusStart = focusStart;
window.focusStop = focusStop;

document.addEventListener('DOMContentLoaded', () => {
  injectFocusStyles();
  loadFocusData();
});
