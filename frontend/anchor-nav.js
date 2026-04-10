// Snoopy小龙虾办公室 - 右侧锚点导航
// 快速跳转到页面各个功能区域

const ANCHOR_SECTIONS = [
  { id: 'game-container',      emoji: '🦞', label: '办公室',     color: '#e94560' },
  { id: 'memo-panel',          emoji: '📝', label: '小记',       color: '#9ca3af' },
  { id: 'control-bar',         emoji: '🎮', label: '状态',       color: '#ffd700' },
  { id: 'pomodoro-panel',      emoji: '🍅', label: '番茄钟',     color: '#ff6b6b' },
  { id: 'mood-panel',          emoji: '😊', label: '心情',       color: '#a78bfa' },
  { id: 'achievement-panel',   emoji: '🏆', label: '成就',       color: '#fbbf24' },
  { id: 'openclaw-panel',      emoji: '🤖', label: 'OpenClaw',  color: '#06b6d4' },
  { id: 'section-cron',        emoji: '⏰', label: '定时任务',   color: '#f59e0b' },
  { id: 'section-stats',       emoji: '📊', label: '工作数据',   color: '#a78bfa' },
  { id: 'section-heatmap',     emoji: '🟩', label: '热力图',     color: '#39d353' },
  { id: 'section-fortune',     emoji: '🎋', label: '虾签',       color: '#fbbf24' },
  { id: 'section-goals',       emoji: '📋', label: '目标',       color: '#06b6d4' },
  { id: 'section-health',      emoji: '🏃', label: '健康',       color: '#22c55e' },
  { id: 'section-report',      emoji: '📈', label: '洞察',       color: '#e879f9' }
];

const anchorState = {
  activeId: null,
  collapsed: false,
  observer: null
};

// ─── Build Nav ─────────────────────────────────────────────

function buildAnchorNav() {
  if (document.getElementById('anchor-nav')) return;

  const nav = document.createElement('div');
  nav.id = 'anchor-nav';

  let html = '';

  // Toggle button
  html += `<div id="anchor-nav-toggle" onclick="toggleAnchorNav()" title="收起/展开导航">
    <span id="anchor-toggle-icon">◀</span>
  </div>`;

  // Nav items
  html += '<div id="anchor-nav-items">';
  for (const section of ANCHOR_SECTIONS) {
    html += `<div class="anchor-item" data-target="${section.id}" onclick="scrollToAnchor('${section.id}')" title="${section.label}">`;
    html += `<span class="anchor-emoji">${section.emoji}</span>`;
    html += `<span class="anchor-label">${section.label}</span>`;
    html += `<span class="anchor-dot" style="background:${section.color};"></span>`;
    html += '</div>';
  }
  html += '</div>';

  // Back to top
  html += `<div class="anchor-item anchor-top" onclick="scrollToAnchor('game-container')" title="回到顶部">
    <span class="anchor-emoji">⬆</span>
    <span class="anchor-label">顶部</span>
  </div>`;

  nav.innerHTML = html;
  document.body.appendChild(nav);
}

// ─── Scroll ────────────────────────────────────────────────

function scrollToAnchor(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  highlightAnchorItem(id);
}

function highlightAnchorItem(id) {
  const items = document.querySelectorAll('.anchor-item');
  for (const item of items) {
    const isActive = item.dataset.target === id;
    item.classList.toggle('active', isActive);
  }
  anchorState.activeId = id;
}

function toggleAnchorNav() {
  anchorState.collapsed = !anchorState.collapsed;
  const nav = document.getElementById('anchor-nav');
  const icon = document.getElementById('anchor-toggle-icon');
  if (nav) {
    nav.classList.toggle('collapsed', anchorState.collapsed);
  }
  if (icon) {
    icon.textContent = anchorState.collapsed ? '▶' : '◀';
  }
}

// ─── Intersection Observer ─────────────────────────────────

function setupAnchorObserver() {
  if (anchorState.observer) anchorState.observer.disconnect();

  const options = {
    rootMargin: '-10% 0px -70% 0px',
    threshold: 0
  };

  anchorState.observer = new IntersectionObserver((entries) => {
    // When multiple sections are visible, highlight the one closest to viewport top
    const intersectingEntries = entries.filter(e => e.isIntersecting);
    if (intersectingEntries.length === 0) return;

    // Select entry with smallest positive top offset (closest to top)
    const topmost = intersectingEntries.reduce((closest, entry) => {
      const rect = entry.target.getBoundingClientRect();
      const closestRect = closest.target.getBoundingClientRect();
      const isEntryCloser = rect.top >= 0 && (closestRect.top < 0 || rect.top < closestRect.top);
      return isEntryCloser ? entry : closest;
    });

    highlightAnchorItem(topmost.target.id);
  }, options);

  for (const section of ANCHOR_SECTIONS) {
    const el = document.getElementById(section.id);
    if (el) anchorState.observer.observe(el);
  }
}

// ─── Styles ────────────────────────────────────────────────

function injectAnchorStyles() {
  if (document.getElementById('anchor-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'anchor-nav-styles';
  style.textContent = `
    #anchor-nav {
      position: fixed;
      right: 8px;
      top: 42%;
      transform: translateY(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      transition: opacity 0.3s ease;
    }

    #anchor-nav.collapsed #anchor-nav-items {
      display: none;
    }
    #anchor-nav.collapsed .anchor-top {
      display: none;
    }

    #anchor-nav-toggle {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: rgba(20, 23, 34, 0.9);
      border: 1px solid #333;
      color: #6b7280;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
      transition: all 0.2s ease;
    }
    #anchor-nav-toggle:hover {
      border-color: #06b6d4;
      color: #06b6d4;
    }

    #anchor-nav-items {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .anchor-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px 4px 6px;
      border-radius: 6px;
      background: rgba(20, 23, 34, 0.9);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-height: 28px;
    }
    .anchor-item:hover {
      background: rgba(20, 23, 34, 0.98);
      border-color: #333;
      transform: translateX(-4px);
    }
    .anchor-item.active {
      border-color: #06b6d4;
      background: rgba(6, 182, 212, 0.08);
    }
    .anchor-item.active .anchor-label {
      color: #06b6d4;
    }

    .anchor-emoji {
      font-size: 12px;
      width: 16px;
      text-align: center;
      flex-shrink: 0;
    }

    .anchor-label {
      font-family: 'ArkPixel', monospace;
      font-size: 10px;
      color: #6b7280;
      transition: color 0.2s ease;
      max-width: 56px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .anchor-item:hover .anchor-label {
      color: #d1d5db;
    }

    .anchor-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      flex-shrink: 0;
      opacity: 0.5;
    }
    .anchor-item.active .anchor-dot {
      opacity: 1;
      box-shadow: 0 0 6px currentColor;
    }

    .anchor-top {
      margin-top: 4px;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 5px;
    }

    /* Mobile: hide labels, only show emoji dots */
    @media (max-width: 1400px) {
      .anchor-label { display: none; }
      .anchor-item { padding: 4px 5px; min-height: 24px; }
      .anchor-emoji { font-size: 11px; }
      #anchor-nav { right: 4px; }
    }

    /* Very small screens: collapse by default */
    @media (max-width: 768px) {
      #anchor-nav { display: none; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Init ──────────────────────────────────────────────────

window.scrollToAnchor = scrollToAnchor;
window.toggleAnchorNav = toggleAnchorNav;

document.addEventListener('DOMContentLoaded', () => {
  injectAnchorStyles();
  // Wait for panels to render before building nav
  setTimeout(() => {
    buildAnchorNav();
    setupAnchorObserver();
  }, 1500);
});
