// Snoopy小龙虾办公室 - 日记浏览器增强
// 支持日期翻页、日记列表、基础markdown渲染

const memoBrowserState = {
  dates: [],          // 可用日期列表
  currentDate: null,  // 当前显示的日期
  currentIndex: 0,    // 当前在dates中的索引
  loading: false
};

// ─── API ───────────────────────────────────────────────────

async function fetchMemoList() {
  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';
    const resp = await fetch(base + '/memo/list?t=' + Date.now(), { cache: 'no-store' });
    const data = await resp.json();
    if (data.ok && Array.isArray(data.dates)) {
      return data.dates;
    }
  } catch (e) {
    console.error('fetchMemoList failed:', e);
  }
  return [];
}

async function fetchMemoByDate(date) {
  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';
    const resp = await fetch(base + '/memo/' + date + '?t=' + Date.now(), { cache: 'no-store' });
    const data = await resp.json();
    if (data.ok) {
      return { date: data.date, memo: data.memo };
    }
  } catch (e) {
    console.error('fetchMemoByDate failed:', e);
  }
  return null;
}

// ─── Simple Markdown Renderer ──────────────────────────────

function renderSimpleMarkdown(text) {
  if (!text) return '';

  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```)
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.slice(3, -3).replace(/^\w*\n/, '');
    return '<pre style="background:rgba(0,0,0,0.08);padding:6px 8px;border-radius:4px;font-size:10px;overflow-x:auto;margin:4px 0;color:#333;">' + code + '</pre>';
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g,
    '<code style="background:rgba(0,0,0,0.08);padding:1px 4px;border-radius:2px;font-size:10px;color:#333;">$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#000;">$1</strong>');

  // Headers (## and #)
  html = html.replace(/^### (.+)$/gm,
    '<div style="color:#1a1a1a;font-size:11px;font-weight:bold;margin:6px 0 2px;">$1</div>');
  html = html.replace(/^## (.+)$/gm,
    '<div style="color:#1a1a1a;font-size:12px;font-weight:bold;margin:8px 0 3px;">$1</div>');
  html = html.replace(/^# (.+)$/gm,
    '<div style="color:#1a1a1a;font-size:13px;font-weight:bold;margin:8px 0 4px;">$1</div>');

  // Unordered list items
  html = html.replace(/^[\-\*] (.+)$/gm,
    '<div style="padding-left:12px;">· $1</div>');

  // Ordered list items
  html = html.replace(/^\d+\. (.+)$/gm,
    '<div style="padding-left:12px;">• $1</div>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// ─── Render ────────────────────────────────────────────────

function renderMemoBrowser() {
  const container = document.getElementById('memo-content');
  const dateEl = document.getElementById('memo-date');
  if (!container) return;

  // Add navigation if not already present
  let nav = document.getElementById('memo-nav');
  if (!nav) {
    nav = document.createElement('div');
    nav.id = 'memo-nav';
    nav.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin-bottom:6px;gap:4px;';

    const memoCard = container.closest('.memo-card') || container.parentElement;
    if (dateEl) {
      memoCard.insertBefore(nav, container);
    }
  }

  const dates = memoBrowserState.dates;
  const idx = memoBrowserState.currentIndex;
  const hasPrev = idx < dates.length - 1;
  const hasNext = idx > 0;

  const currentDate = dates[idx] || '';
  const displayDate = currentDate ? formatMemoDate(currentDate) : '暂无日记';

  // Row 1: ◀ date ▶
  let html = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;">';
  html += `<button onclick="memoNavPrev()" style="background:rgba(0,0,0,0.2);border:1px solid rgba(0,0,0,0.3);color:${hasPrev ? '#333' : '#999'};cursor:${hasPrev ? 'pointer' : 'default'};padding:2px 8px;border-radius:4px;font-family:ArkPixel,monospace;font-size:12px;" ${hasPrev ? '' : 'disabled'}>◀</button>`;
  html += `<span style="color:#333;font-size:11px;text-align:center;">${displayDate}</span>`;
  html += `<button onclick="memoNavNext()" style="background:rgba(0,0,0,0.2);border:1px solid rgba(0,0,0,0.3);color:${hasNext ? '#333' : '#999'};cursor:${hasNext ? 'pointer' : 'default'};padding:2px 8px;border-radius:4px;font-family:ArkPixel,monospace;font-size:12px;" ${hasNext ? '' : 'disabled'}>▶</button>`;
  html += '</div>';

  // Row 2: dots
  if (dates.length > 1) {
    html += '<div style="display:flex;justify-content:center;gap:4px;">';
    const visibleDates = dates.slice(0, 7);
    for (let i = 0; i < visibleDates.length; i++) {
      const isActive = i === idx;
      const dotColor = isActive ? '#d97706' : 'rgba(0,0,0,0.2)';
      html += `<span onclick="memoNavTo(${i})" style="width:6px;height:6px;border-radius:50%;background:${dotColor};cursor:pointer;transition:background 0.2s;" title="${visibleDates[i]}"></span>`;
    }
    html += '</div>';
  }

  nav.innerHTML = html;
}

function formatMemoDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === todayStr) return '今天 ' + dateStr;
    if (dateStr === yesterdayStr) return '昨天 ' + dateStr;

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `周${weekdays[d.getDay()]} ${dateStr}`;
  } catch (e) {
    return dateStr;
  }
}

async function loadMemoForCurrentDate() {
  const container = document.getElementById('memo-content');
  if (!container) return;

  const date = memoBrowserState.dates[memoBrowserState.currentIndex];
  if (!date) {
    container.innerHTML = '<div style="color:#666;font-size:11px;text-align:center;padding:12px;">暂无日记</div>';
    return;
  }

  if (memoBrowserState.loading) return;
  memoBrowserState.loading = true;
  container.innerHTML = '<div style="color:#666;font-size:11px;text-align:center;padding:8px;">加载中...</div>';

  const result = await fetchMemoByDate(date);
  memoBrowserState.loading = false;

  if (result && result.memo) {
    container.innerHTML = `<div style="color:#1a1a1a;font-size:11px;line-height:1.6;max-height:200px;overflow-y:auto;text-align:center;">${renderSimpleMarkdown(result.memo)}</div>`;
  } else {
    container.innerHTML = '<div style="color:#666;font-size:11px;text-align:center;padding:12px;">该日期暂无日记内容</div>';
  }

  memoBrowserState.currentDate = date;
}

// ─── Navigation Functions (global) ─────────────────────────

window.memoNavPrev = function() {
  if (memoBrowserState.currentIndex < memoBrowserState.dates.length - 1) {
    memoBrowserState.currentIndex++;
    renderMemoBrowser();
    loadMemoForCurrentDate();
  }
};

window.memoNavNext = function() {
  if (memoBrowserState.currentIndex > 0) {
    memoBrowserState.currentIndex--;
    renderMemoBrowser();
    loadMemoForCurrentDate();
  }
};

window.memoNavTo = function(index) {
  if (index >= 0 && index < memoBrowserState.dates.length) {
    memoBrowserState.currentIndex = index;
    renderMemoBrowser();
    loadMemoForCurrentDate();
  }
};

// ─── Init ──────────────────────────────────────────────────

async function initMemoBrowser() {
  const dates = await fetchMemoList();
  if (dates.length === 0) return;

  memoBrowserState.dates = dates;
  memoBrowserState.currentIndex = 0; // newest first
  memoBrowserState.currentDate = dates[0];

  renderMemoBrowser();
  loadMemoForCurrentDate();
}

document.addEventListener('DOMContentLoaded', () => {
  // Delay to let existing loadMemo() run first, then enhance
  setTimeout(initMemoBrowser, 2000);
});
