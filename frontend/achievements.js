// Snoopy小龙虾办公室 - 成就徽章系统

const ACHIEVEMENTS = [
  { id: 'first_work',     name: '初出茅庐',   icon: '🌱', desc: '第一次进入工作状态',          check: (s) => s.totalStateChanges >= 1 },
  { id: 'pomo_1',         name: '番茄新手',   icon: '🍅', desc: '完成第一个番茄钟',            check: (s) => s.pomodoroCompleted >= 1 },
  { id: 'pomo_4',         name: '番茄达人',   icon: '🏆', desc: '一天内完成4个番茄钟',          check: (s) => s.pomodoroCompleted >= 4 },
  { id: 'pomo_8',         name: '虾力全开',   icon: '🦞', desc: '一天内完成8个番茄钟',          check: (s) => s.pomodoroCompleted >= 8 },
  { id: 'mood_setter',    name: '心情记录者', icon: '📝', desc: '第一次设置心情',              check: (s) => s.moodChanges >= 1 },
  { id: 'mood_variety',   name: '情绪丰富',   icon: '🎭', desc: '体验过3种以上心情',            check: (s) => s.uniqueMoods >= 3 },
  { id: 'all_moods',      name: '百味人生',   icon: '🌈', desc: '体验过所有6种心情',            check: (s) => s.uniqueMoods >= 6 },
  { id: 'error_fixer',    name: 'Bug猎人',    icon: '🐛', desc: '从error状态恢复',              check: (s) => s.errorRecoveries >= 1 },
  { id: 'sync_master',    name: '同步大师',   icon: '☁️', desc: '完成5次同步操作',               check: (s) => s.syncCount >= 5 },
  { id: 'night_owl',      name: '夜猫子',     icon: '🦉', desc: '在深夜(23:00-5:00)工作',       check: (s) => s.nightWork },
  { id: 'early_bird',     name: '早起的虾',   icon: '🌅', desc: '在清晨(5:00-7:00)工作',        check: (s) => s.earlyWork },
  { id: 'streak_3',       name: '三天打鱼',   icon: '🎣', desc: '连续3天使用办公室',             check: (s) => s.streakDays >= 3 },
  { id: 'work_60min',     name: '一小时钳工', icon: '⏰', desc: '累计工作60分钟',               check: (s) => s.totalWorkMinutes >= 60 },
  { id: 'work_8h',        name: '全勤虾',     icon: '💪', desc: '累计工作8小时',                 check: (s) => s.totalWorkMinutes >= 480 },
  { id: 'visitor_host',   name: '好客的虾',   icon: '🏠', desc: '有访客加入过办公室',            check: (s) => s.hadVisitors }
];

const achievementState = {
  unlocked: new Set(),
  stats: {
    totalStateChanges: 0,
    pomodoroCompleted: 0,
    moodChanges: 0,
    uniqueMoods: new Set(),
    errorRecoveries: 0,
    syncCount: 0,
    nightWork: false,
    earlyWork: false,
    streakDays: 0,
    totalWorkMinutes: 0,
    hadVisitors: false,
    lastActiveDate: null
  }
};

function loadAchievements() {
  try {
    const saved = localStorage.getItem('snoopy_achievements');
    if (saved) {
      const parsed = JSON.parse(saved);
      achievementState.unlocked = new Set(parsed.unlocked || []);
      const stats = parsed.stats || {};
      Object.assign(achievementState.stats, stats);
      if (stats.uniqueMoods) {
        achievementState.stats.uniqueMoods = new Set(stats.uniqueMoods);
      }
    }
  } catch (e) {
    // ignore
  }
}

function saveAchievements() {
  try {
    const toSave = {
      unlocked: [...achievementState.unlocked],
      stats: {
        ...achievementState.stats,
        uniqueMoods: [...achievementState.stats.uniqueMoods]
      }
    };
    localStorage.setItem('snoopy_achievements', JSON.stringify(toSave));
  } catch (e) {
    // ignore
  }
}

function checkAndUnlockAchievements() {
  const stats = {
    ...achievementState.stats,
    uniqueMoods: achievementState.stats.uniqueMoods.size
  };

  let newUnlocks = [];
  for (const ach of ACHIEVEMENTS) {
    if (!achievementState.unlocked.has(ach.id) && ach.check(stats)) {
      achievementState.unlocked.add(ach.id);
      newUnlocks = [...newUnlocks, ach];
    }
  }

  if (newUnlocks.length > 0) {
    saveAchievements();
    renderAchievements();
    for (const ach of newUnlocks) {
      showAchievementToast(ach);
    }
  }
}

function showAchievementToast(ach) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#1f2937;color:#fbbf24;padding:12px 20px;border-radius:8px;border:2px solid #fbbf24;font-family:ArkPixel,monospace;font-size:14px;z-index:100001;animation:slideIn 0.5s ease;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  toast.textContent = `${ach.icon} 成就解锁: ${ach.name}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function renderAchievements() {
  const listEl = document.getElementById('achievement-list');
  const statsEl = document.getElementById('achievement-stats');
  if (!listEl) return;

  const unlockedCount = achievementState.unlocked.size;
  const totalCount = ACHIEVEMENTS.length;
  if (statsEl) {
    statsEl.textContent = `已解锁 ${unlockedCount} / ${totalCount}`;
  }

  listEl.innerHTML = '';
  for (const ach of ACHIEVEMENTS) {
    const isUnlocked = achievementState.unlocked.has(ach.id);
    const item = document.createElement('div');
    item.style.cssText = `width:70px;height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:8px;border:2px solid ${isUnlocked ? '#fbbf24' : '#333'};background:${isUnlocked ? 'rgba(251,191,36,0.1)' : 'rgba(0,0,0,0.2)'};cursor:default;transition:all 0.2s;`;
    item.title = ach.desc;

    const icon = document.createElement('div');
    icon.style.cssText = `font-size:24px;${isUnlocked ? '' : 'filter:grayscale(1);opacity:0.4;'}`;
    icon.textContent = ach.icon;

    const name = document.createElement('div');
    name.style.cssText = `font-size:9px;color:${isUnlocked ? '#fbbf24' : '#555'};text-align:center;font-family:ArkPixel,monospace;line-height:1.2;`;
    name.textContent = ach.name;

    item.appendChild(icon);
    item.appendChild(name);
    listEl.appendChild(item);
  }
}

// Hook into pomodoro
function checkPomodoroAchievements() {
  if (typeof pomodoroState !== 'undefined') {
    achievementState.stats.pomodoroCompleted = pomodoroState.completedRounds;
    achievementState.stats.totalWorkMinutes = Math.floor(pomodoroState.totalWorkSeconds / 60);
  }
  checkAndUnlockAchievements();
}

// Hook into mood
function checkMoodAchievements(moodKey) {
  achievementState.stats.moodChanges += 1;
  achievementState.stats.uniqueMoods.add(moodKey);
  saveAchievements();
  checkAndUnlockAchievements();
}

// Track state changes for achievements
function trackStateChange(newState, prevState) {
  achievementState.stats.totalStateChanges += 1;

  if (newState === 'syncing') {
    achievementState.stats.syncCount += 1;
  }
  if (prevState === 'error' && newState !== 'error') {
    achievementState.stats.errorRecoveries += 1;
  }

  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) {
    achievementState.stats.nightWork = true;
  }
  if (hour >= 5 && hour < 7) {
    achievementState.stats.earlyWork = true;
  }

  // Track daily streak
  const today = new Date().toISOString().split('T')[0];
  if (achievementState.stats.lastActiveDate !== today) {
    const lastDate = achievementState.stats.lastActiveDate;
    if (lastDate) {
      const diff = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        achievementState.stats.streakDays += 1;
      } else if (diff > 1) {
        achievementState.stats.streakDays = 1;
      }
    } else {
      achievementState.stats.streakDays = 1;
    }
    achievementState.stats.lastActiveDate = today;
  }

  saveAchievements();
  checkAndUnlockAchievements();
}

// CSS animation for toast
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes slideIn {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`;
document.head.appendChild(styleSheet);

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadAchievements();
  renderAchievements();
  checkAndUnlockAchievements();
});
