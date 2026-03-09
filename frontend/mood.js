// Snoopy小龙虾办公室 - 心情系统
// 选择心情后影响办公室氛围和气泡文字

const MOOD_CONFIG = {
  energetic: { emoji: '🦞', label: '精力充沛', color: '#ff6b6b', bubbles: ['今天元气满满！', '虾力全开！', '钳子已充满能量', '准备大干一场'] },
  happy:     { emoji: '😊', label: '开心',     color: '#fbbf24', bubbles: ['心情超好！', '写代码也要笑着写', '快乐就是生产力', '阳光灿烂的一天'] },
  focused:   { emoji: '🔥', label: '专注',     color: '#f97316', bubbles: ['进入心流状态', '勿扰，正在燃烧', '专注是最好的效率', '全神贯注中'] },
  tired:     { emoji: '😪', label: '疲惫',     color: '#94a3b8', bubbles: ['好困...还能撑一会儿', '需要一杯咖啡', '打个盹再继续', '虾也需要休息'] },
  creative:  { emoji: '💡', label: '灵感爆发', color: '#a78bfa', bubbles: ['灵感来了！快记下来', '创意如虾涌来', '脑洞大开中', '这个想法太棒了'] },
  chill:     { emoji: '🐟', label: '摸鱼中',   color: '#22d3ee', bubbles: ['悄悄摸鱼中...', '看看有什么好玩的', '今天就放松一下吧', '虾也要劳逸结合'] }
};

const moodState = {
  current: null,
  history: []
};

function setMood(moodKey, label) {
  const config = MOOD_CONFIG[moodKey];
  if (!config) return;

  const previousMood = moodState.current;
  moodState.current = moodKey;
  moodState.history = [...moodState.history, {
    mood: moodKey,
    timestamp: new Date().toISOString()
  }];

  // Update display
  const displayEl = document.getElementById('mood-display');
  const labelEl = document.getElementById('mood-label');
  if (displayEl) displayEl.textContent = config.emoji;
  if (labelEl) {
    labelEl.textContent = config.label;
    labelEl.style.color = config.color;
  }

  // Highlight selected button
  const buttons = document.querySelectorAll('#mood-selector button');
  buttons.forEach(btn => {
    btn.style.borderColor = '#333';
    btn.style.background = 'transparent';
  });
  const activeBtn = document.querySelector(`#mood-selector button[onclick*="${moodKey}"]`);
  if (activeBtn) {
    activeBtn.style.borderColor = config.color;
    activeBtn.style.background = 'rgba(255,255,255,0.05)';
  }

  // Send mood to backend
  fetch('/mood', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood: moodKey, label: config.label })
  }).catch(() => {});

  // Check achievements
  if (typeof checkMoodAchievements === 'function') {
    checkMoodAchievements(moodKey, previousMood);
  }
}

function getMoodBubble() {
  if (!moodState.current) return null;
  const config = MOOD_CONFIG[moodState.current];
  if (!config) return null;
  const bubbles = config.bubbles;
  return bubbles[Math.floor(Math.random() * bubbles.length)];
}

// Load mood from backend on init
async function loadMoodState() {
  try {
    const resp = await fetch('/mood?t=' + Date.now(), { cache: 'no-store' });
    const data = await resp.json();
    if (data.mood && MOOD_CONFIG[data.mood]) {
      setMood(data.mood, MOOD_CONFIG[data.mood].label);
    }
  } catch (e) {
    // Mood endpoint may not exist yet
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMoodState();
});
