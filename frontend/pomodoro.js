// Snoopy小龙虾办公室 - 番茄钟工作法
// 25分钟工作 / 5分钟休息 / 4轮后长休息15分钟

const POMODORO_WORK_MINS = 25;
const POMODORO_SHORT_BREAK_MINS = 5;
const POMODORO_LONG_BREAK_MINS = 15;
const POMODORO_ROUNDS_BEFORE_LONG = 4;

const pomodoroState = {
  mode: 'idle',        // idle | work | shortBreak | longBreak
  secondsLeft: POMODORO_WORK_MINS * 60,
  completedRounds: 0,
  intervalId: null,
  totalWorkSeconds: 0
};

function pomodoroUpdateDisplay() {
  const timerEl = document.getElementById('pomodoro-timer');
  const statusEl = document.getElementById('pomodoro-status');
  const dots = document.querySelectorAll('.pomo-dot');
  const startBtn = document.getElementById('pomo-start-btn');
  const pauseBtn = document.getElementById('pomo-pause-btn');

  if (!timerEl) return;

  const mins = Math.floor(pomodoroState.secondsLeft / 60);
  const secs = pomodoroState.secondsLeft % 60;
  timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  const modeLabels = {
    idle: '准备开始',
    work: '专注工作中',
    shortBreak: '短休息',
    longBreak: '长休息'
  };
  const totalWorkMins = Math.floor(pomodoroState.totalWorkSeconds / 60);
  statusEl.textContent = modeLabels[pomodoroState.mode] + (totalWorkMins > 0 ? ` | 累计 ${totalWorkMins} 分钟` : '');

  // Update dots
  dots.forEach((dot, i) => {
    if (i < pomodoroState.completedRounds) {
      dot.style.background = '#e94560';
      dot.style.borderColor = '#ff6b6b';
    } else {
      dot.style.background = 'transparent';
      dot.style.borderColor = '#555';
    }
  });

  // Update timer color
  if (pomodoroState.mode === 'work') {
    timerEl.style.color = '#ff6b6b';
  } else if (pomodoroState.mode === 'shortBreak' || pomodoroState.mode === 'longBreak') {
    timerEl.style.color = '#22c55e';
  } else {
    timerEl.style.color = '#ffd700';
  }

  // Button states
  if (startBtn) {
    startBtn.disabled = pomodoroState.intervalId !== null;
    startBtn.style.opacity = pomodoroState.intervalId !== null ? '0.5' : '1';
  }
  if (pauseBtn) {
    pauseBtn.disabled = pomodoroState.intervalId === null;
    pauseBtn.style.opacity = pomodoroState.intervalId === null ? '0.5' : '1';
  }
}

function pomodoroTick() {
  if (pomodoroState.secondsLeft <= 0) {
    pomodoroPhaseComplete();
    return;
  }
  pomodoroState.secondsLeft -= 1;
  if (pomodoroState.mode === 'work') {
    pomodoroState.totalWorkSeconds += 1;
  }
  pomodoroUpdateDisplay();

  // Check achievements
  if (typeof checkPomodoroAchievements === 'function') {
    checkPomodoroAchievements();
  }
}

function pomodoroPhaseComplete() {
  clearInterval(pomodoroState.intervalId);
  pomodoroState.intervalId = null;

  if (pomodoroState.mode === 'work') {
    pomodoroState.completedRounds += 1;

    // Auto-set agent to idle for break
    if (typeof setState === 'function') {
      setState('idle', '番茄钟休息中');
    }

    if (pomodoroState.completedRounds % POMODORO_ROUNDS_BEFORE_LONG === 0) {
      pomodoroState.mode = 'longBreak';
      pomodoroState.secondsLeft = POMODORO_LONG_BREAK_MINS * 60;
    } else {
      pomodoroState.mode = 'shortBreak';
      pomodoroState.secondsLeft = POMODORO_SHORT_BREAK_MINS * 60;
    }

    pomodoroNotify('番茄时间结束！休息一下吧');
  } else {
    pomodoroState.mode = 'work';
    pomodoroState.secondsLeft = POMODORO_WORK_MINS * 60;

    // Auto-set agent to working
    if (typeof setState === 'function') {
      setState('writing', '番茄钟工作中');
    }

    pomodoroNotify('休息结束！开始新一轮专注');
  }

  pomodoroUpdateDisplay();
  // Auto-start next phase
  pomodoroState.intervalId = setInterval(pomodoroTick, 1000);
  pomodoroUpdateDisplay();
}

function pomodoroNotify(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Snoopy小龙虾办公室', { body: message, icon: '/static/star-idle-spritesheet.png' });
  }
}

function pomodoroStart() {
  if (pomodoroState.intervalId !== null) return;

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  if (pomodoroState.mode === 'idle') {
    pomodoroState.mode = 'work';
    pomodoroState.secondsLeft = POMODORO_WORK_MINS * 60;

    if (typeof setState === 'function') {
      setState('writing', '番茄钟工作中');
    }
  }

  pomodoroState.intervalId = setInterval(pomodoroTick, 1000);
  pomodoroUpdateDisplay();
}

function pomodoroPause() {
  if (pomodoroState.intervalId !== null) {
    clearInterval(pomodoroState.intervalId);
    pomodoroState.intervalId = null;
  }
  pomodoroUpdateDisplay();
}

function pomodoroReset() {
  if (pomodoroState.intervalId !== null) {
    clearInterval(pomodoroState.intervalId);
    pomodoroState.intervalId = null;
  }
  pomodoroState.mode = 'idle';
  pomodoroState.secondsLeft = POMODORO_WORK_MINS * 60;
  pomodoroState.completedRounds = 0;
  pomodoroState.totalWorkSeconds = 0;
  pomodoroUpdateDisplay();
}

// Initialize display on load
document.addEventListener('DOMContentLoaded', () => {
  pomodoroUpdateDisplay();
});
