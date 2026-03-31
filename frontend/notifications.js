// Notification Center Module - Snoopy Office Dashboard
// Pixel-art themed, frontend-only notification system
const NOTIF_TYPES = {
  cron_error: { icon: '\u274C', color: '#ef4444', label: 'Cron\u5931\u8D25' },
  cron_recover: { icon: '\u2705', color: '#22c55e', label: 'Cron\u6062\u590D' },
  agent_online: { icon: '\uD83D\uDFE2', color: '#22c55e', label: 'Agent\u4E0A\u7EBF' },
  agent_offline: { icon: '\u26AB', color: '#6b7280', label: 'Agent\u79BB\u7EBF' },
  pomo_complete: { icon: '\uD83C\uDF45', color: '#ff6b6b', label: '\u756A\u8304\u949F\u5B8C\u6210' },
  achievement: { icon: '\uD83C\uDFC6', color: '#fbbf24', label: '\u6210\u5C31\u89E3\u9501' },
  state_change: { icon: '\uD83D\uDD04', color: '#3b82f6', label: '\u72B6\u6001\u53D8\u66F4' }
};

const notifState = {
  items: [], unreadCount: 0, panelOpen: false,
  prevCronStatus: {}, prevAgentStatus: {},
  permissionRequested: false, autoReadTimer: null
};

const MAX_NOTIFICATIONS = 50;
let notifIdCounter = 0;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatNotifTime(timestamp) {
  var diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return '\u521A\u521A';
  if (diff < 3600) return Math.floor(diff / 60) + '\u5206\u524D';
  if (diff < 86400) return Math.floor(diff / 3600) + '\u5C0F\u65F6\u524D';
  return Math.floor(diff / 86400) + '\u5929\u524D';
}

function recalcUnread() {
  notifState.unreadCount = notifState.items.filter(function(n) { return !n.read; }).length;
}

function addNotification(type, title, detail) {
  var typeDef = NOTIF_TYPES[type];
  if (!typeDef) return;
  notifIdCounter += 1;
  var notification = {
    id: 'notif-' + Date.now() + '-' + notifIdCounter,
    type: type, title: title, detail: detail || '',
    timestamp: Date.now(), read: false
  };
  var updated = [notification].concat(notifState.items);
  notifState.items = updated.length > MAX_NOTIFICATIONS ? updated.slice(0, MAX_NOTIFICATIONS) : updated;
  recalcUnread();
  updateBellBadge();
  // Browser notification when tab is hidden
  if (document.visibilityState === 'hidden' && 'Notification' in window) {
    if (!notifState.permissionRequested) {
      notifState.permissionRequested = true;
      // Check if already granted from prior session
      if (Notification.permission === 'granted') {
        new Notification(typeDef.icon + ' ' + title, { body: detail || '' });
      } else if (Notification.permission !== 'denied') {
        // Request permission and resend on grant
        var titleCopy = typeDef.icon + ' ' + title;
        var bodyCopy = detail || '';
        Notification.requestPermission().then(function(perm) {
          if (perm === 'granted') {
            new Notification(titleCopy, { body: bodyCopy });
          }
        });
      }
    } else if (Notification.permission === 'granted') {
      new Notification(typeDef.icon + ' ' + title, { body: detail || '' });
    }
  }
  if (notifState.panelOpen) renderNotifPanelIntoDOM();
}

function detectCronChanges(cronJobs) {
  if (!cronJobs || !Array.isArray(cronJobs)) return;
  var prev = notifState.prevCronStatus;
  var next = {};
  cronJobs.forEach(function(job) {
    var name = job.name || job.id || 'unknown';
    var status = job.status || 'ok';
    next[name] = status;
    if (prev[name]) {
      if (prev[name] !== 'error' && status === 'error') {
        addNotification('cron_error', name + ' \u6267\u884C\u5931\u8D25', job.message || '');
      } else if (prev[name] === 'error' && status !== 'error') {
        addNotification('cron_recover', name + ' \u5DF2\u6062\u590D', '');
      }
    }
  });
  notifState.prevCronStatus = next;
}

function detectAgentChanges(agentDetails) {
  if (!agentDetails || !Array.isArray(agentDetails)) return;
  var prev = notifState.prevAgentStatus;
  var next = {};
  agentDetails.forEach(function(agent) {
    var name = agent.name || agent.id || 'unknown';
    var status = agent.status || 'offline';
    next[name] = status;
    if (prev[name]) {
      var wasOnline = prev[name] === 'active' || prev[name] === 'idle';
      var isOnline = status === 'active' || status === 'idle';
      if (!wasOnline && isOnline) addNotification('agent_online', name + ' \u5DF2\u4E0A\u7EBF', '');
      else if (wasOnline && !isOnline) addNotification('agent_offline', name + ' \u5DF2\u79BB\u7EBF', '');
    }
  });
  notifState.prevAgentStatus = next;
}

function renderNotifBell() {
  var badge = notifState.unreadCount > 0
    ? '<span id="notif-badge" style="position:absolute;top:-4px;right:-6px;'
      + 'background:#ef4444;color:#fff;font-size:10px;min-width:16px;height:16px;'
      + 'border-radius:8px;display:flex;align-items:center;justify-content:center;'
      + 'padding:0 3px;font-family:ArkPixel,monospace;">'
      + (notifState.unreadCount > 99 ? '99+' : notifState.unreadCount) + '</span>'
    : '';
  return '<div id="notif-bell" onclick="toggleNotifPanel()" style="'
    + 'position:relative;cursor:pointer;font-size:20px;user-select:none;padding:4px;'
    + '">\uD83D\uDD14' + badge + '</div>';
}

function renderNotifItem(n) {
  var t = NOTIF_TYPES[n.type] || { icon: '\u2753', color: '#999' };
  var border = n.read ? 'transparent' : t.color;
  return '<div class="notif-item" data-id="' + n.id + '" '
    + 'onclick="markNotifRead(\'' + n.id + '\')" style="'
    + 'display:flex;gap:8px;padding:8px 12px;border-left:3px solid ' + border + ';'
    + 'border-bottom:1px solid #222;cursor:pointer;opacity:' + (n.read ? '0.6' : '1') + ';'
    + 'transition:opacity 0.2s;animation:notifFadeIn 0.3s ease;">'
    + '<span style="font-size:16px;flex-shrink:0;">' + t.icon + '</span>'
    + '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:12px;color:#eee;white-space:nowrap;overflow:hidden;'
    + 'text-overflow:ellipsis;">' + escapeHtml(n.title) + '</div>'
    + (n.detail ? '<div style="font-size:10px;color:#888;margin-top:2px;white-space:nowrap;'
      + 'overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(n.detail) + '</div>' : '')
    + '</div>'
    + '<span style="font-size:10px;color:#666;white-space:nowrap;flex-shrink:0;">'
    + formatNotifTime(n.timestamp) + '</span></div>';
}

function renderNotifPanel() {
  var header = '<div style="display:flex;justify-content:space-between;align-items:center;'
    + 'padding:8px 12px;border-bottom:1px solid #333;">'
    + '<span style="font-size:13px;color:#ccc;">\u901A\u77E5\u4E2D\u5FC3</span>'
    + '<button onclick="markAllRead()" style="background:none;border:1px solid #555;'
    + 'color:#aaa;font-size:11px;padding:2px 8px;cursor:pointer;border-radius:3px;'
    + 'font-family:ArkPixel,monospace;">\u5168\u90E8\u5DF2\u8BFB</button></div>';
  var body = notifState.items.length === 0
    ? '<div style="padding:24px;text-align:center;color:#666;font-size:12px;">\u6682\u65E0\u901A\u77E5</div>'
    : notifState.items.map(renderNotifItem).join('');
  return '<div id="notif-panel" style="position:absolute;top:100%;right:0;width:300px;'
    + 'background:rgba(0,0,0,0.95);border:1px solid #333;border-radius:6px;overflow:hidden;'
    + 'z-index:9999;font-family:ArkPixel,monospace;box-shadow:0 4px 20px rgba(0,0,0,0.5);'
    + 'animation:notifSlideDown 0.2s ease;">'
    + header + '<div style="max-height:400px;overflow-y:auto;">' + body + '</div></div>';
}

function toggleNotifPanel() {
  notifState.panelOpen = !notifState.panelOpen;
  if (notifState.autoReadTimer) {
    clearTimeout(notifState.autoReadTimer);
    notifState.autoReadTimer = null;
  }
  var existing = document.getElementById('notif-panel');
  if (existing) { existing.remove(); return; }
  if (notifState.panelOpen) {
    renderNotifPanelIntoDOM();
    notifState.autoReadTimer = setTimeout(markAllRead, 2000);
  }
}

function renderNotifPanelIntoDOM() {
  var container = document.getElementById('notif-bell-container');
  if (!container) return;
  var existing = document.getElementById('notif-panel');
  if (existing) existing.remove();
  if (notifState.panelOpen) container.insertAdjacentHTML('beforeend', renderNotifPanel());
}

function updateBellBadge() {
  var bell = document.getElementById('notif-bell');
  if (bell) bell.outerHTML = renderNotifBell();
}

function markNotifRead(id) {
  notifState.items = notifState.items.map(function(n) {
    return n.id === id ? Object.assign({}, n, { read: true }) : n;
  });
  recalcUnread();
  updateBellBadge();
  renderNotifPanelIntoDOM();
}

function markAllRead() {
  notifState.items = notifState.items.map(function(n) {
    return n.read ? n : Object.assign({}, n, { read: true });
  });
  notifState.unreadCount = 0;
  updateBellBadge();
  renderNotifPanelIntoDOM();
}

// --- Integration hooks (global) ---
window.notifyPomodoroComplete = function() {
  addNotification('pomo_complete', '\u756A\u8304\u949F\u5B8C\u6210', '\u4F11\u606F\u4E00\u4E0B\u5427\uFF01');
};
window.notifyAchievement = function(name) {
  addNotification('achievement', '\u6210\u5C31\u89E3\u9501: ' + (name || ''), '');
};
window.notifyStateChange = function(newState, oldState) {
  if (newState === oldState) return;
  addNotification('state_change',
    '\u72B6\u6001\u53D8\u66F4: ' + (oldState || '?') + ' \u2192 ' + (newState || '?'), '');
};
window.detectCronChanges = detectCronChanges;
window.detectAgentChanges = detectAgentChanges;

// --- Inject styles and bell on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
  var style = document.createElement('style');
  style.textContent = '@keyframes notifSlideDown { from { opacity:0; transform:translateY(-8px); }'
    + ' to { opacity:1; transform:translateY(0); } }'
    + '@keyframes notifFadeIn { from { opacity:0; } to { opacity:1; } }'
    + '.notif-item:hover { background:rgba(255,255,255,0.05); }'
    + '#notif-panel ::-webkit-scrollbar { width:4px; }'
    + '#notif-panel ::-webkit-scrollbar-thumb { background:#444; border-radius:2px; }'
    + '#notif-bell-container { position:relative; display:inline-block; }';
  document.head.appendChild(style);
  // Create or find bell container
  var container = document.getElementById('notif-bell-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notif-bell-container';
    container.style.cssText = 'position:fixed;top:12px;right:12px;z-index:10000;';
    document.body.appendChild(container);
  }
  container.innerHTML = renderNotifBell();
});
