// Snoopy小龙虾办公室 - 每日虾签
// 每天一签的趣味运势系统

const fortuneState = {
  data: null,
  revealed: false,
  animating: false
};

// ─── Fetch ─────────────────────────────────────────────────

async function fetchFortune() {
  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';
    const resp = await fetch(base + '/fortune?t=' + Date.now(), { cache: 'no-store' });
    return await resp.json();
  } catch (e) {
    console.error('Fortune fetch failed:', e);
    return null;
  }
}

// ─── Render ────────────────────────────────────────────────

function renderFortunePanel(container) {
  if (!container) return;

  if (!fortuneState.data) {
    // 未抽签状态 - 显示签筒
    container.innerHTML = buildUnrevealedHTML();
    return;
  }

  if (fortuneState.animating) return;

  // 已抽签 - 显示结果
  container.innerHTML = buildFortuneResultHTML(fortuneState.data);
}

function buildUnrevealedHTML() {
  return `
    <div id="fortune-draw" onclick="drawFortune()" style="cursor:pointer;text-align:center;padding:16px 12px;transition:transform 0.2s;" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform='scale(1)'">
      <div style="font-size:36px;margin-bottom:8px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🎋</div>
      <div style="color:#fbbf24;font-size:13px;font-weight:bold;margin-bottom:4px;">今日虾签</div>
      <div style="color:#6b7280;font-size:10px;">点击抽取今日运势</div>
      <div style="margin-top:8px;display:inline-block;background:rgba(251,191,36,0.15);border:1px solid #fbbf2433;border-radius:6px;padding:4px 14px;color:#fbbf24;font-size:11px;">🎴 抽签</div>
    </div>`;
}

function buildFortuneResultHTML(data) {
  const f = data;
  return `
    <div style="text-align:center;padding:12px 10px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:24px;">${f.emoji}</span>
        <div>
          <div style="color:${f.color};font-size:18px;font-weight:bold;letter-spacing:2px;">${f.fortune}</div>
          <div style="color:#6b7280;font-size:9px;">${f.date}</div>
        </div>
      </div>
      <div style="color:#e5e7eb;font-size:12px;line-height:1.6;margin-bottom:10px;background:rgba(0,0,0,0.2);padding:8px 12px;border-radius:6px;border-left:3px solid ${f.color};">
        ${escapeFortuneHtml(f.message)}
      </div>
      <div style="color:#9ca3af;font-size:10px;line-height:1.5;margin-bottom:8px;">
        ${escapeFortuneHtml(f.tip)}
      </div>
      <div style="display:flex;justify-content:center;gap:16px;color:#6b7280;font-size:10px;">
        <span>🔢 幸运数字: <span style="color:#fbbf24;">${f.luckyNumber}</span></span>
        <span>✨ 幸运状态: <span style="color:#06b6d4;">${formatLuckyState(f.luckyState)}</span></span>
      </div>
      <div onclick="shareFortune()" style="margin-top:10px;display:inline-block;background:rgba(6,182,212,0.1);border:1px solid #06b6d433;border-radius:6px;padding:4px 12px;color:#06b6d4;font-size:10px;cursor:pointer;">📋 复制分享</div>
    </div>`;
}

function formatLuckyState(state) {
  const map = { idle: '休息', writing: '写作', researching: '研究', executing: '执行', syncing: '同步' };
  return map[state] || state;
}

function escapeFortuneHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Actions ───────────────────────────────────────────────

window.drawFortune = async function() {
  if (fortuneState.animating) return;

  const container = document.getElementById('fortune-container');
  if (!container) return;

  fortuneState.animating = true;

  // Shake animation
  const drawEl = document.getElementById('fortune-draw');
  if (drawEl) {
    drawEl.style.animation = 'fortune-shake 0.5s ease-in-out 3';
    drawEl.innerHTML = `
      <div style="font-size:36px;animation:fortune-shake 0.4s infinite;">🎋</div>
      <div style="color:#fbbf24;font-size:12px;margin-top:8px;">摇签中...</div>`;
  }

  // Fetch while animating
  const data = await fetchFortune();

  // Wait for animation
  await new Promise(r => setTimeout(r, 1500));

  fortuneState.animating = false;

  if (data && data.ok) {
    fortuneState.data = data;
    fortuneState.revealed = true;

    // Save to localStorage so refreshing page shows result
    try {
      localStorage.setItem('fortune_date', data.date);
      localStorage.setItem('fortune_data', JSON.stringify(data));
    } catch (e) { /* ignore */ }

    // Reveal with fade
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      renderFortunePanel(container);
      container.style.opacity = '1';
    }, 300);
  } else {
    renderFortunePanel(container);
  }
};

window.shareFortune = function() {
  if (!fortuneState.data) return;
  const f = fortuneState.data;
  const text = `🎋 今日虾签 [${f.date}]\n${f.emoji} ${f.fortune}\n${f.message}\n${f.tip}\n🔢 幸运数字: ${f.luckyNumber} ✨ 幸运状态: ${formatLuckyState(f.luckyState)}\n\n— Snoopy小龙虾办公室`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showFortuneToast('已复制到剪贴板');
    }).catch(() => {
      showFortuneToast('复制失败，请手动复制');
    });
  } else {
    showFortuneToast('浏览器不支持复制');
  }
};

function showFortuneToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#e5e7eb;padding:8px 20px;border-radius:6px;font-family:ArkPixel,monospace;font-size:12px;z-index:10000;border:1px solid #333;opacity:0;transition:opacity 0.2s;';
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
}

// ─── Styles ────────────────────────────────────────────────

function injectFortuneStyles() {
  if (document.getElementById('fortune-styles')) return;
  const style = document.createElement('style');
  style.id = 'fortune-styles';
  style.textContent = `
    @keyframes fortune-shake {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-8deg); }
      75% { transform: rotate(8deg); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectFortuneStyles();

  setTimeout(() => {
    const container = document.getElementById('fortune-container');
    if (!container) return;

    // Check if already drawn today
    const today = new Date().toISOString().slice(0, 10);
    try {
      const savedDate = localStorage.getItem('fortune_date');
      const savedData = localStorage.getItem('fortune_data');
      if (savedDate === today && savedData) {
        fortuneState.data = JSON.parse(savedData);
        fortuneState.revealed = true;
      }
    } catch (e) { /* ignore */ }

    renderFortunePanel(container);
  }, 1000);
});
