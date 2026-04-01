// Snoopy小龙虾办公室 - 快捷键系统
// 键盘快速操作，提升效率

const SHORTCUT_MAP = {
  '1': { action: 'state', value: 'idle', label: '待命' },
  '2': { action: 'state', value: 'writing', label: '写作' },
  '3': { action: 'state', value: 'researching', label: '研究' },
  '4': { action: 'state', value: 'executing', label: '执行' },
  '5': { action: 'state', value: 'syncing', label: '同步' },
  '6': { action: 'state', value: 'error', label: '报错' },
  'p': { action: 'pomodoro', label: '番茄钟 开始/暂停' },
  'm': { action: 'mood', label: '心情选择器' },
  'n': { action: 'notifications', label: '通知面板' },
  'd': { action: 'drawer', label: '装修抽屉' },
  's': { action: 'share', label: '生成分享卡片' },
  'f': { action: 'focus', label: '专注模式 开/关' },
  'a': { action: 'sound', label: '环境音效面板' },
  '?': { action: 'help', label: '快捷键帮助' }
};

const shortcutState = {
  helpVisible: false,
  enabled: true
};

// ─── Shortcut Handler ──────────────────────────────────────

function handleShortcut(e) {
  if (!shortcutState.enabled) return;

  // Ignore when typing in inputs
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (e.target.isContentEditable) return;

  // Ignore with modifier keys (except shift for ?)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();
  const mapping = SHORTCUT_MAP[key] || (e.key === '?' ? SHORTCUT_MAP['?'] : null);
  if (!mapping) return;

  e.preventDefault();

  switch (mapping.action) {
    case 'state':
      if (typeof setState === 'function') {
        setState(mapping.value, mapping.label);
        showShortcutToast(`状态切换: ${mapping.label}`);
      }
      break;

    case 'pomodoro':
      if (typeof pomodoroStart === 'function' && typeof pomodoroState !== 'undefined') {
        if (pomodoroState.mode === 'idle') {
          pomodoroStart();
          showShortcutToast('番茄钟已开始');
        } else if (pomodoroState.intervalId) {
          if (typeof pomodoroPause === 'function') pomodoroPause();
          showShortcutToast('番茄钟已暂停');
        } else {
          if (typeof pomodoroResume === 'function') pomodoroResume();
          else pomodoroStart();
          showShortcutToast('番茄钟已继续');
        }
      }
      break;

    case 'mood': {
      const selector = document.getElementById('mood-selector');
      if (selector) {
        const isHidden = selector.style.display === 'none' || !selector.style.display;
        selector.style.display = isHidden ? 'flex' : 'none';
        showShortcutToast(isHidden ? '心情选择器已打开' : '心情选择器已关闭');
      }
      break;
    }

    case 'notifications':
      if (typeof toggleNotifPanel === 'function') {
        toggleNotifPanel();
      }
      break;

    case 'drawer': {
      const drawer = document.getElementById('asset-drawer');
      if (drawer) {
        // Unified state check: use classList which is the canonical source
        const isOpen = drawer.classList.contains('open');
        if (typeof toggleAssetDrawer === 'function') {
          toggleAssetDrawer();
          showShortcutToast(isOpen ? 'Drawer已关闭' : 'Drawer已打开');
        } else {
          // Fallback: try clicking the drawer toggle button
          const btn = document.querySelector('[onclick*="toggleAssetDrawer"]') ||
                      document.querySelector('[onclick*="drawer"]');
          if (btn) btn.click();
        }
        showShortcutToast(isOpen ? '抽屉已关闭' : '抽屉已打开');
      }
      break;
    }

    case 'share':
      if (typeof openShareCard === 'function') {
        openShareCard();
      }
      break;

    case 'focus':
      if (typeof focusToggle === 'function') {
        focusToggle();
      }
      break;

    case 'sound':
      if (typeof toggleSoundPanel === 'function') {
        toggleSoundPanel();
      }
      break;

    case 'help':
      toggleShortcutHelp();
      break;
  }
}

// ─── Toast Notification ────────────────────────────────────

function showShortcutToast(message) {
  const existing = document.getElementById('shortcut-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'shortcut-toast';
  toast.textContent = message;
  toast.style.cssText = [
    'position:fixed',
    'top:20px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:rgba(0,0,0,0.85)',
    'color:#e5e7eb',
    'padding:8px 20px',
    'border-radius:6px',
    'font-family:ArkPixel,monospace',
    'font-size:13px',
    'z-index:10000',
    'pointer-events:none',
    'border:1px solid #333',
    'opacity:0',
    'transition:opacity 0.2s ease'
  ].join(';');

  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}

// ─── Help Panel ────────────────────────────────────────────

function toggleShortcutHelp() {
  shortcutState.helpVisible = !shortcutState.helpVisible;

  let panel = document.getElementById('shortcut-help-panel');

  if (!shortcutState.helpVisible) {
    if (panel) panel.remove();
    return;
  }

  if (panel) return;

  panel = document.createElement('div');
  panel.id = 'shortcut-help-panel';
  panel.style.cssText = [
    'position:fixed',
    'top:50%',
    'left:50%',
    'transform:translate(-50%,-50%)',
    'background:rgba(10,10,20,0.95)',
    'border:2px solid #444',
    'border-radius:12px',
    'padding:20px 28px',
    'z-index:10001',
    'font-family:ArkPixel,monospace',
    'min-width:280px',
    'max-width:360px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.6)'
  ].join(';');

  let html = '<div style="color:#06b6d4;font-size:14px;font-weight:bold;margin-bottom:12px;text-align:center;">⌨️ 快捷键</div>';
  html += '<div style="display:flex;flex-direction:column;gap:6px;">';

  for (const [key, mapping] of Object.entries(SHORTCUT_MAP)) {
    const displayKey = key === '?' ? '?' : key.toUpperCase();
    html += `<div style="display:flex;align-items:center;gap:10px;">`;
    html += `<span style="background:#333;color:#fbbf24;padding:2px 8px;border-radius:4px;font-size:13px;min-width:24px;text-align:center;border:1px solid #555;">${displayKey}</span>`;
    html += `<span style="color:#d1d5db;font-size:12px;">${mapping.label}</span>`;
    html += `</div>`;
  }

  html += '</div>';
  html += '<div style="color:#6b7280;font-size:10px;text-align:center;margin-top:12px;">按任意键关闭</div>';

  panel.innerHTML = html;
  document.body.appendChild(panel);

  // Close on any key press
  const closeHandler = (e) => {
    if (e.key === '?') return; // Don't close on the trigger key
    shortcutState.helpVisible = false;
    panel.remove();
    document.removeEventListener('keydown', closeHandler);
  };
  setTimeout(() => {
    document.addEventListener('keydown', closeHandler);
  }, 200);

  // Close on click outside
  panel.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', function closeOnClick() {
    shortcutState.helpVisible = false;
    if (panel.parentNode) panel.remove();
    document.removeEventListener('click', closeOnClick);
  }, { once: true });
}

// ─── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', handleShortcut);
});
