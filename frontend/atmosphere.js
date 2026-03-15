// Snoopy小龙虾办公室 - 办公室氛围系统
// 日夜循环色调 + 状态粒子效果

const ATMOSPHERE_CONFIG = {
  // 时段色调 (Phaser tint values)
  timeOfDay: [
    { start: 0,  end: 6,  tint: 0x3344aa, alpha: 0.25, label: '深夜' },
    { start: 6,  end: 8,  tint: 0xffcc66, alpha: 0.12, label: '晨光' },
    { start: 8,  end: 17, tint: 0xffffff, alpha: 0.00, label: '白天' },
    { start: 17, end: 19, tint: 0xff9944, alpha: 0.15, label: '黄昏' },
    { start: 19, end: 24, tint: 0x3344aa, alpha: 0.20, label: '夜晚' }
  ],
  // 状态粒子配置
  particles: {
    writing: {
      emoji: '📝',
      count: 3,
      speed: 0.3,
      drift: 0.5,
      fadeLife: 4000
    },
    error: {
      emoji: '⚠️',
      count: 2,
      speed: 0.1,
      drift: 0.2,
      fadeLife: 2000,
      pulse: true
    },
    syncing: {
      emoji: '⚡',
      count: 4,
      speed: 0.8,
      drift: 0.3,
      fadeLife: 2500
    },
    researching: {
      emoji: '🔍',
      count: 2,
      speed: 0.2,
      drift: 0.4,
      fadeLife: 3500
    }
  }
};

// ─── Atmosphere State ──────────────────────────────────────

const atmosphereState = {
  overlayEl: null,
  currentPeriod: null,
  particleEls: [],
  particleTimer: null,
  currentAgentState: null,
  enabled: true
};

// ─── Day/Night Overlay ─────────────────────────────────────

function getTimePeriod() {
  const hour = new Date().getHours();
  for (const period of ATMOSPHERE_CONFIG.timeOfDay) {
    if (hour >= period.start && hour < period.end) {
      return period;
    }
  }
  return ATMOSPHERE_CONFIG.timeOfDay[0]; // fallback to midnight
}

function tintToRgb(tint) {
  const r = (tint >> 16) & 0xff;
  const g = (tint >> 8) & 0xff;
  const b = tint & 0xff;
  return { r, g, b };
}

function createOverlay() {
  if (atmosphereState.overlayEl) return;

  const gameCanvas = document.querySelector('#game-container canvas');
  if (!gameCanvas) return;

  const container = document.getElementById('game-container');
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.id = 'atmosphere-overlay';
  overlay.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'transition:background-color 2s ease',
    'z-index:1',
    'border-radius:inherit'
  ].join(';');

  container.style.position = 'relative';
  container.appendChild(overlay);
  atmosphereState.overlayEl = overlay;
}

function updateDayNightCycle() {
  if (!atmosphereState.enabled) return;
  if (!atmosphereState.overlayEl) createOverlay();
  if (!atmosphereState.overlayEl) return;

  const period = getTimePeriod();
  if (atmosphereState.currentPeriod === period.label) return;

  atmosphereState.currentPeriod = period.label;
  const { r, g, b } = tintToRgb(period.tint);
  atmosphereState.overlayEl.style.backgroundColor =
    `rgba(${r},${g},${b},${period.alpha})`;
}

// ─── State Particles ───────────────────────────────────────

function createParticleContainer() {
  const existing = document.getElementById('atmosphere-particles');
  if (existing) return existing;

  const container = document.getElementById('game-container');
  if (!container) return null;

  const particleBox = document.createElement('div');
  particleBox.id = 'atmosphere-particles';
  particleBox.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'overflow:hidden',
    'z-index:2'
  ].join(';');

  container.appendChild(particleBox);
  return particleBox;
}

function spawnParticle(config) {
  const box = createParticleContainer();
  if (!box) return;

  const el = document.createElement('div');
  const startX = 20 + Math.random() * 60; // 20%-80% horizontal
  const startY = 15 + Math.random() * 50; // 15%-65% vertical

  el.textContent = config.emoji;
  el.style.cssText = [
    'position:absolute',
    `left:${startX}%`,
    `top:${startY}%`,
    'font-size:16px',
    'opacity:0',
    'transition:opacity 0.5s ease',
    'pointer-events:none',
    'user-select:none',
    'z-index:2'
  ].join(';');

  if (config.pulse) {
    el.style.animation = 'atmo-pulse 1s ease-in-out infinite';
  }

  box.appendChild(el);

  // Fade in
  requestAnimationFrame(() => {
    el.style.opacity = '0.7';
  });

  // Animate drift
  const driftX = (Math.random() - 0.5) * config.drift * 100;
  const driftY = -config.speed * 50;
  let elapsed = 0;
  const interval = 50;

  const moveTimer = setInterval(() => {
    elapsed += interval;
    const progress = elapsed / config.fadeLife;
    const currentX = startX + driftX * progress;
    const currentY = startY + driftY * progress;
    el.style.left = currentX + '%';
    el.style.top = currentY + '%';

    if (progress > 0.7) {
      el.style.opacity = String(0.7 * (1 - (progress - 0.7) / 0.3));
    }

    if (elapsed >= config.fadeLife) {
      clearInterval(moveTimer);
      el.remove();
    }
  }, interval);

  // Safety cleanup
  setTimeout(() => {
    clearInterval(moveTimer);
    if (el.parentNode) el.remove();
  }, config.fadeLife + 500);
}

function updateParticles(agentState) {
  if (!atmosphereState.enabled) return;
  if (agentState === atmosphereState.currentAgentState) return;

  atmosphereState.currentAgentState = agentState;

  // Clear existing particle timer
  if (atmosphereState.particleTimer) {
    clearInterval(atmosphereState.particleTimer);
    atmosphereState.particleTimer = null;
  }

  const config = ATMOSPHERE_CONFIG.particles[agentState];
  if (!config) return; // idle and other states: no particles

  // Spawn particles periodically
  const spawnInterval = config.fadeLife / config.count;
  atmosphereState.particleTimer = setInterval(() => {
    if (!atmosphereState.enabled) return;
    spawnParticle(config);
  }, spawnInterval);

  // Spawn first batch immediately
  spawnParticle(config);
}

// ─── Coffee Machine Steam ──────────────────────────────────

function createCoffeeSteam() {
  const box = createParticleContainer();
  if (!box) return;

  // Steam position relative to game container (coffee machine area)
  // Approximate position based on layout.js coffeMachine coords
  const steamEl = document.createElement('div');
  steamEl.id = 'coffee-steam';
  steamEl.style.cssText = [
    'position:absolute',
    'right:12%',
    'top:28%',
    'font-size:12px',
    'opacity:0',
    'pointer-events:none',
    'user-select:none'
  ].join(';');
  steamEl.textContent = '♨️';
  box.appendChild(steamEl);

  let visible = false;
  setInterval(() => {
    if (!atmosphereState.enabled) {
      steamEl.style.opacity = '0';
      return;
    }
    if (atmosphereState.currentAgentState === 'idle') {
      visible = !visible;
      steamEl.style.opacity = visible ? '0.5' : '0.2';
      steamEl.style.transition = 'opacity 1.5s ease';
    } else {
      steamEl.style.opacity = '0';
    }
  }, 2000);
}

// ─── Inject Styles ─────────────────────────────────────────

function injectAtmosphereStyles() {
  if (document.getElementById('atmosphere-styles')) return;
  const style = document.createElement('style');
  style.id = 'atmosphere-styles';
  style.textContent = `
    @keyframes atmo-pulse {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Public API ────────────────────────────────────────────

// Hook for game loop to update atmosphere based on current state
window.updateAtmosphere = function(agentState) {
  updateParticles(agentState);
};

window.toggleAtmosphere = function(enabled) {
  atmosphereState.enabled = enabled;
  if (!enabled) {
    if (atmosphereState.overlayEl) {
      atmosphereState.overlayEl.style.backgroundColor = 'transparent';
    }
    if (atmosphereState.particleTimer) {
      clearInterval(atmosphereState.particleTimer);
      atmosphereState.particleTimer = null;
    }
    const particleBox = document.getElementById('atmosphere-particles');
    if (particleBox) particleBox.innerHTML = '';
  }
};

// ─── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectAtmosphereStyles();

  // Wait a bit for game canvas to be ready
  setTimeout(() => {
    createOverlay();
    updateDayNightCycle();
    createCoffeeSteam();

    // Update day/night every 5 minutes
    setInterval(updateDayNightCycle, 300000);
  }, 3000);
});
