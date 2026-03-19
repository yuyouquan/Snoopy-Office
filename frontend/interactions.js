// Snoopy小龙虾办公室 - 虾仔互动系统
// 点击办公室里的区域触发有趣反应和彩蛋

const INTERACTION_ZONES = [
  { id: 'star', x: 0.3, y: 0.5, w: 0.12, h: 0.3, reactions: 'character' },
  { id: 'sofa', x: 0.02, y: 0.45, w: 0.18, h: 0.25, reactions: 'sofa' },
  { id: 'desk', x: 0.25, y: 0.35, w: 0.2, h: 0.2, reactions: 'desk' },
  { id: 'coffee', x: 0.82, y: 0.28, w: 0.1, h: 0.18, reactions: 'coffee' },
  { id: 'plant', x: 0.6, y: 0.2, w: 0.08, h: 0.15, reactions: 'plant' },
  { id: 'poster', x: 0.4, y: 0.05, w: 0.12, h: 0.15, reactions: 'poster' },
  { id: 'cat', x: 0.7, y: 0.55, w: 0.08, h: 0.12, reactions: 'cat' },
  { id: 'server', x: 0.88, y: 0.4, w: 0.1, h: 0.25, reactions: 'server' }
];

const REACTIONS = {
  character: [
    { text: '别戳我啦！我在工作呢！', emoji: '😤' },
    { text: '虾仔今天也很努力哦~', emoji: '💪' },
    { text: '你好呀，要不要一起摸鱼？', emoji: '🐟' },
    { text: '我的钳子可不是摆设！', emoji: '🦞' },
    { text: '咔嚓咔嚓~', emoji: '✂️' },
    { text: '写Bug是不可能的，这辈子都不可能的', emoji: '🚫' },
    { text: '*伸了个懒腰*', emoji: '🥱' },
    { text: '嘿嘿，被你发现了', emoji: '😏' },
    { text: '给我来一杯咖啡！', emoji: '☕' },
    { text: '今天的代码特别丝滑', emoji: '✨' }
  ],
  sofa: [
    { text: '沙发好软...不想起来了...', emoji: '😴' },
    { text: '午休10分钟等于充电2小时', emoji: '🔋' },
    { text: '*沙发发出愉快的嘎吱声*', emoji: '🛋️' },
    { text: '这是我最喜欢的休息角', emoji: '❤️' },
    { text: '要不要来躺一会儿？', emoji: '🤗' }
  ],
  desk: [
    { text: '桌上全是未完成的需求...', emoji: '📋' },
    { text: '*键盘发出机械轴的声音*', emoji: '⌨️' },
    { text: '这个Bug我一定能找到！', emoji: '🔍' },
    { text: '代码就是我的画布', emoji: '🎨' },
    { text: '显示器上反射出虾仔的脸', emoji: '🖥️' }
  ],
  coffee: [
    { text: '滴~滴~滴~ 咖啡好了！', emoji: '☕' },
    { text: '程序员的燃料加注中...', emoji: '⛽' },
    { text: '第三杯了，今天有点上头', emoji: '🫨' },
    { text: '*咖啡机冒出阵阵香气*', emoji: '♨️' },
    { text: '续命水，生命之源', emoji: '💧' }
  ],
  plant: [
    { text: '*绿萝轻轻晃了晃*', emoji: '🌿' },
    { text: '在程序员的办公室活着不容易', emoji: '🥀' },
    { text: '我已经很久没被浇水了...', emoji: '💀' },
    { text: '光合作用中，请勿打扰', emoji: '☀️' },
    { text: '吸收电脑辐射是我的使命', emoji: '🛡️' }
  ],
  poster: [
    { text: 'Keep calm and debug on', emoji: '🪲' },
    { text: '"It works on my machine" - 名言', emoji: '💻' },
    { text: '这个海报是初代CTO留下的', emoji: '👴' },
    { text: '上面写着：永远不要在周五部署', emoji: '📌' },
    { text: 'Hello World! — 一切的起点', emoji: '🌍' }
  ],
  cat: [
    { text: '喵~', emoji: '🐱' },
    { text: '*猫猫翻了个身继续睡*', emoji: '😺' },
    { text: '办公室猫是最佳Debug伙伴', emoji: '🐈' },
    { text: '猫: 你的代码有Bug (看了一眼)', emoji: '🐈‍⬛' },
    { text: '*发出咕噜咕噜的声音*', emoji: '💤' },
    { text: '猫步调试法：走到哪算哪', emoji: '🐾' }
  ],
  server: [
    { text: '*服务器嗡嗡作响*', emoji: '🖥️' },
    { text: 'CPU温度正常，一切安好', emoji: '🌡️' },
    { text: '千万别碰这根线！', emoji: '⚡' },
    { text: '这台服务器从2019年就没重启过', emoji: '💀' },
    { text: '硬盘空间还剩...算了不看了', emoji: '😱' }
  ]
};

// Click combo tracking
const comboState = {
  count: 0,
  lastZone: null,
  lastTime: 0,
  easterEggShown: false
};

// ─── Core ──────────────────────────────────────────────────

function handleInteractionClick(e) {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;

  const canvas = gameContainer.querySelector('canvas');
  if (!canvas) return;

  // Get click position relative to game canvas
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  // Check if click is within any zone
  for (const zone of INTERACTION_ZONES) {
    if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
      triggerReaction(zone, e.clientX, e.clientY);
      trackCombo(zone.id);
      return;
    }
  }
}

function triggerReaction(zone, clientX, clientY) {
  const reactions = REACTIONS[zone.reactions];
  if (!reactions || reactions.length === 0) return;

  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  showReactionBubble(reaction, clientX, clientY);
}

function showReactionBubble(reaction, x, y) {
  // Remove any existing bubbles
  const existing = document.querySelectorAll('.interaction-bubble');
  existing.forEach(el => el.remove());

  const bubble = document.createElement('div');
  bubble.className = 'interaction-bubble';
  bubble.innerHTML = `<span style="font-size:16px;margin-right:4px;">${reaction.emoji}</span> ${escapeInteractionHtml(reaction.text)}`;

  // Position near click but ensure it stays on screen
  const bWidth = 220;
  const bx = Math.min(Math.max(x - bWidth / 2, 10), window.innerWidth - bWidth - 10);
  const by = Math.max(y - 60, 10);

  bubble.style.cssText = [
    'position:fixed',
    `left:${bx}px`,
    `top:${by}px`,
    `max-width:${bWidth}px`,
    'background:rgba(10,10,20,0.92)',
    'color:#e5e7eb',
    'padding:8px 14px',
    'border-radius:10px',
    'font-family:ArkPixel,monospace',
    'font-size:12px',
    'z-index:9999',
    'pointer-events:none',
    'border:1px solid rgba(255,255,255,0.1)',
    'box-shadow:0 4px 16px rgba(0,0,0,0.4)',
    'opacity:0',
    'transform:translateY(8px) scale(0.95)',
    'transition:all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis'
  ].join(';');

  document.body.appendChild(bubble);

  // Animate in
  requestAnimationFrame(() => {
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateY(0) scale(1)';
  });

  // Animate out
  setTimeout(() => {
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(-10px) scale(0.95)';
    setTimeout(() => bubble.remove(), 300);
  }, 2500);
}

// ─── Combo & Easter Eggs ───────────────────────────────────

function trackCombo(zoneId) {
  const now = Date.now();

  if (zoneId === comboState.lastZone && now - comboState.lastTime < 800) {
    comboState.count++;
  } else {
    comboState.count = 1;
  }

  comboState.lastZone = zoneId;
  comboState.lastTime = now;

  // Easter egg: click same spot 7 times fast
  if (comboState.count === 7 && !comboState.easterEggShown) {
    comboState.easterEggShown = true;
    showEasterEgg(zoneId);
    setTimeout(() => { comboState.easterEggShown = false; }, 30000);
  }

  // Show combo counter at 3+
  if (comboState.count >= 3 && comboState.count < 7) {
    showComboCounter(comboState.count);
  }
}

function showComboCounter(count) {
  let counter = document.getElementById('combo-counter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'combo-counter';
    counter.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-family:ArkPixel,monospace;z-index:10000;pointer-events:none;text-align:center;';
    document.body.appendChild(counter);
  }

  counter.innerHTML = `<div style="font-size:32px;color:#fbbf24;text-shadow:0 2px 8px rgba(251,191,36,0.5);animation:combo-pop 0.3s ease-out;">${count}x COMBO!</div>`;

  clearTimeout(counter._timer);
  counter._timer = setTimeout(() => { counter.innerHTML = ''; }, 800);
}

function showEasterEgg(zoneId) {
  const eggs = {
    character: { text: '🎉 你发现了隐藏成就：戳戳乐大师！虾仔表示很痒...', color: '#ff6b6b' },
    sofa: { text: '🛋️ 你把沙发戳出了一个洞...维修费从工资里扣', color: '#f59e0b' },
    coffee: { text: '☕ 咖啡机过载了！免费续杯一整天！', color: '#22c55e' },
    cat: { text: '🐱 猫猫被你戳醒了，决定帮你Review代码', color: '#a78bfa' },
    desk: { text: '⌨️ 你触发了传说中的 Ctrl+Z 大法，代码回到了上周', color: '#06b6d4' },
    plant: { text: '🌿 绿萝突然开花了！这是百年难遇的奇迹！', color: '#22c55e' },
    server: { text: '💥 服务器发出了不寻常的声音...开个玩笑，一切正常', color: '#ef4444' },
    poster: { text: '📜 你发现了海报背后的暗门...里面是一张便签："永远相信美好的事情即将发生"', color: '#fbbf24' }
  };

  const egg = eggs[zoneId] || { text: '🎊 恭喜发现彩蛋！', color: '#fbbf24' };

  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10001;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;cursor:pointer;`;
  overlay.onclick = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); };

  const card = document.createElement('div');
  card.style.cssText = `background:rgba(10,10,20,0.95);border:2px solid ${egg.color}44;border-radius:16px;padding:24px 32px;max-width:360px;text-align:center;transform:scale(0.8);transition:transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);`;
  card.innerHTML = `
    <div style="font-size:14px;color:${egg.color};margin-bottom:8px;font-weight:bold;font-family:ArkPixel,monospace;">🥚 彩蛋发现！</div>
    <div style="font-size:12px;color:#d1d5db;line-height:1.6;font-family:ArkPixel,monospace;">${egg.text}</div>
    <div style="color:#6b7280;font-size:10px;margin-top:12px;font-family:ArkPixel,monospace;">点击任意处关闭</div>`;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });

  // Emit confetti-like particles
  for (let i = 0; i < 12; i++) {
    setTimeout(() => spawnConfetti(overlay), i * 80);
  }
}

function spawnConfetti(container) {
  const emojis = ['🦞', '⭐', '🎉', '✨', '🐟', '🍤', '💎', '🔥'];
  const el = document.createElement('div');
  el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  const startX = 30 + Math.random() * 40;
  el.style.cssText = `position:absolute;left:${startX}%;top:40%;font-size:20px;pointer-events:none;opacity:1;transition:all 1.5s ease-out;`;
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.style.left = (startX + (Math.random() - 0.5) * 30) + '%';
    el.style.top = (10 + Math.random() * 30) + '%';
    el.style.opacity = '0';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
  });

  setTimeout(() => el.remove(), 1600);
}

function escapeInteractionHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Inject Styles ─────────────────────────────────────────

function injectInteractionStyles() {
  if (document.getElementById('interaction-styles')) return;
  const style = document.createElement('style');
  style.id = 'interaction-styles';
  style.textContent = `
    @keyframes combo-pop {
      0% { transform: scale(0.5); opacity: 0; }
      60% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectInteractionStyles();

  // Attach click listener to game container
  setTimeout(() => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.addEventListener('click', handleInteractionClick);
      gameContainer.style.cursor = 'pointer';
    }
  }, 3000);
});
