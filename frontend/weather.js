// Snoopy小龙虾办公室 - 天气系统
// 基于定时任务健康状态的动态粒子天气层

const WeatherSystem = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let currentWeather = 'clear'; // 'clear' | 'rain' | 'storm'
  let targetWeather = 'clear';
  let transitionAlpha = 0;
  let lastLightningTime = 0;
  let isAnimating = false;

  const colors = {
    clear: { particle: '#ffd700', alpha: 0.6 },
    rain: { particle: '#4a90e2', alpha: 0.7 },
    storm: { particle: '#2c5282', alpha: 0.8 }
  };

  function init() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    // 创建天气 canvas 叠在游戏容器上
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'weather-canvas';
      canvas.width = 1280;
      canvas.height = 720;
      canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 1;
        background: transparent;
      `;
      gameContainer.style.position = 'relative';
      gameContainer.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }

    if (!isAnimating) {
      isAnimating = true;
      animate();
    }
  }

  function calculateHealthPercent(cronJobs) {
    if (!cronJobs || cronJobs.length === 0) return 100;
    const healthy = cronJobs.filter(j => j.lastStatus === 'ok').length;
    return Math.round((healthy / cronJobs.length) * 100);
  }

  function updateWeather(cronJobs) {
    const health = calculateHealthPercent(cronJobs);
    const errorCount = cronJobs ? cronJobs.filter(j => j.lastStatus === 'error').length : 0;

    // 确定目标天气状态
    if (health < 70 || errorCount >= 3) {
      targetWeather = 'storm';
    } else if (health < 90 || errorCount >= 1) {
      targetWeather = 'rain';
    } else {
      targetWeather = 'clear';
    }

    // 如果天气改变，启动过渡
    if (targetWeather !== currentWeather) {
      transitionAlpha = 0;
    }
  }

  function spawnParticles() {
    // 根据当前天气生成粒子
    const particleCount = {
      clear: 2,
      rain: 8,
      storm: 16
    }[currentWeather] || 0;

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * 1280;
      const y = -10;

      if (currentWeather === 'clear') {
        // 晴天：金色缓慢漂落的圆点
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: Math.random() * 0.5 + 0.2,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.3,
          type: 'clear',
          life: 8000
        });
      } else if (currentWeather === 'rain') {
        // 小雨：细长的水滴
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1,
          vy: Math.random() * 2 + 3,
          length: Math.random() * 8 + 4,
          width: 1,
          opacity: Math.random() * 0.4 + 0.4,
          type: 'rain',
          life: 4000
        });
      } else if (currentWeather === 'storm') {
        // 暴风雨：粗雨滴
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.5,
          vy: Math.random() * 4 + 5,
          length: Math.random() * 12 + 8,
          width: 2,
          opacity: Math.random() * 0.5 + 0.5,
          type: 'storm',
          life: 2500
        });
      }
    }
  }

  function updateParticles(dt) {
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.opacity = (p.life / (currentWeather === 'clear' ? 8000 : currentWeather === 'rain' ? 4000 : 2500)) * (
        currentWeather === 'clear' ? 0.6 : currentWeather === 'rain' ? 0.7 : 0.8
      );
      return p.y < 720 && p.life > 0;
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = p.opacity * (1 - transitionAlpha * 0.5);
      ctx.fillStyle = colors[currentWeather]?.particle || '#999';
      ctx.strokeStyle = colors[currentWeather]?.particle || '#999';

      if (p.type === 'clear') {
        // 圆形光点
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 雨滴（倾斜线）
        ctx.lineWidth = p.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.length);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawLightning() {
    if (currentWeather !== 'storm') return;

    const now = Date.now();
    if (now - lastLightningTime > 2000 + Math.random() * 3000) {
      // 触发闪电
      lastLightningTime = now;

      const flashDuration = 100;
      const startTime = now;

      const flashFrame = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > flashDuration) {
          clearInterval(flashFrame);
          return;
        }
        const intensity = Math.sin((elapsed / flashDuration) * Math.PI);
        ctx.globalAlpha = intensity * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      });
    }
  }

  function animate() {
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 天气过渡动画
    if (targetWeather !== currentWeather && transitionAlpha < 1) {
      transitionAlpha += 0.02;
    } else if (transitionAlpha >= 1) {
      currentWeather = targetWeather;
      transitionAlpha = 1;
    }

    // 更新和绘制粒子
    updateParticles(16); // 假设 60fps，dt ≈ 16ms
    spawnParticles();
    drawParticles();

    // 绘制闪电（仅风暴）
    if (currentWeather === 'storm') {
      drawLightning();
    }

    requestAnimationFrame(animate);
  }

  return {
    init,
    updateWeather,
    getWeather: () => currentWeather
  };
})();

// 初始化天气系统
document.addEventListener('DOMContentLoaded', () => {
  WeatherSystem.init();
});

// 暴露到全局作用域，供外部调用
window.updateWeather = (cronJobs) => {
  WeatherSystem.updateWeather(cronJobs);
};
