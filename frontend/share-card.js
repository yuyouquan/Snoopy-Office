// Snoopy小龙虾办公室 - 状态分享卡片
// 一键生成当前办公室状态的精美分享图片

const SHARE_STATE_NAMES = {
  idle: '休息中', writing: '写作中', researching: '研究中',
  executing: '执行中', syncing: '同步中', error: '排错中'
};

const SHARE_STATE_EMOJIS = {
  idle: '😴', writing: '✍️', researching: '🔍',
  executing: '🚀', syncing: '☁️', error: '🚨'
};

// ─── Generate Card ─────────────────────────────────────────

async function generateShareCard() {
  const canvas = document.createElement('canvas');
  const w = 600;
  const h = 340;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0f0f1a');
  grad.addColorStop(0.5, '#1a1a2e');
  grad.addColorStop(1, '#16213e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative border
  ctx.strokeStyle = 'rgba(6,182,212,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Corner decorations
  const corners = [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]];
  ctx.fillStyle = '#06b6d4';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#e5e7eb';
  ctx.textAlign = 'left';
  ctx.fillText('🦞 Snoopy 小龙虾办公室', 30, 50);

  // Date + Time
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  ctx.font = '13px monospace';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`${dateStr} ${timeStr}`, 30, 75);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 88);
  ctx.lineTo(w - 30, 88);
  ctx.stroke();

  // Current state
  const currentState = (typeof window.currentState !== 'undefined') ? window.currentState : 'idle';
  const stateEmoji = SHARE_STATE_EMOJIS[currentState] || '❓';
  const stateName = SHARE_STATE_NAMES[currentState] || currentState;

  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText(stateEmoji, 30, 140);
  ctx.fillText(stateName, 80, 140);

  // Mood
  const moodKey = (typeof moodState !== 'undefined') ? moodState.current : null;
  if (moodKey && typeof MOOD_CONFIG !== 'undefined' && MOOD_CONFIG[moodKey]) {
    const mood = MOOD_CONFIG[moodKey];
    ctx.font = '14px monospace';
    ctx.fillStyle = mood.color;
    ctx.fillText(`${mood.emoji} ${mood.label}`, 30, 170);
  }

  // Pomodoro stats
  if (typeof pomodoroState !== 'undefined') {
    ctx.font = '13px monospace';
    ctx.fillStyle = '#9ca3af';
    const rounds = pomodoroState.completedRounds || 0;
    const mins = Math.floor((pomodoroState.totalWorkSeconds || 0) / 60);
    if (rounds > 0 || mins > 0) {
      ctx.fillText(`🍅 番茄钟: ${rounds}轮 · ${mins}分钟`, 30, 195);
    }
  }

  // OpenClaw stats (right side)
  if (typeof openclawData !== 'undefined' && openclawData) {
    const summary = openclawData.summary || {};
    const details = openclawData.agentDetails || [];

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.textAlign = 'right';
    ctx.fillText('🤖 AI 团队', w - 30, 115);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#9ca3af';

    const activeCount = details.filter(a => a.status === 'active').length;
    const totalCount = details.length;
    ctx.fillText(`${activeCount}/${totalCount} 活跃`, w - 30, 138);

    const cronTotal = summary.totalCronJobs || 0;
    const cronHealthy = summary.healthyCronJobs || 0;
    if (cronTotal > 0) {
      ctx.fillText(`⏰ ${cronHealthy}/${cronTotal} 任务正常`, w - 30, 158);
    }

    // Top 3 agents
    const topAgents = [...details]
      .sort((a, b) => ((b.totalInputTokens || 0) + (b.totalOutputTokens || 0)) - ((a.totalInputTokens || 0) + (a.totalOutputTokens || 0)))
      .slice(0, 3);

    let agentY = 185;
    for (const agent of topAgents) {
      const statusDot = agent.status === 'active' ? '🟢' : agent.status === 'idle' ? '🟡' : '⚫';
      ctx.fillText(`${agent.emoji} ${agent.name} ${statusDot}`, w - 30, agentY);
      agentY += 18;
    }
  }

  ctx.textAlign = 'left';

  // Fortune (if drawn today)
  if (typeof fortuneState !== 'undefined' && fortuneState.data) {
    const f = fortuneState.data;
    ctx.font = '13px monospace';
    ctx.fillStyle = f.color || '#fbbf24';
    ctx.fillText(`🎋 今日运势: ${f.emoji} ${f.fortune}`, 30, 230);
  }

  // Bottom divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(30, h - 60);
  ctx.lineTo(w - 30, h - 60);
  ctx.stroke();

  // Footer
  ctx.font = '11px monospace';
  ctx.fillStyle = '#4b5563';
  ctx.fillText('Snoopy Office · Powered by OpenClaw', 30, h - 35);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4b5563';
  ctx.fillText(window.location.hostname, w - 30, h - 35);
  ctx.textAlign = 'left';

  // Decorative dots at bottom
  ctx.fillStyle = 'rgba(6,182,212,0.15)';
  for (let i = 0; i < 20; i++) {
    const dx = 30 + (i / 20) * (w - 60);
    ctx.beginPath();
    ctx.arc(dx, h - 15, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// ─── Share Actions ─────────────────────────────────────────

window.openShareCard = async function() {
  // Show loading overlay
  const overlay = document.createElement('div');
  overlay.id = 'share-card-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10002;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';

  const inner = document.createElement('div');
  inner.style.cssText = 'background:rgba(15,15,26,0.98);border:1px solid #333;border-radius:16px;padding:20px;text-align:center;max-width:640px;transform:scale(0.9);transition:transform 0.3s;';
  inner.innerHTML = '<div style="color:#9ca3af;font-size:12px;font-family:ArkPixel,monospace;">生成分享卡片中...</div>';
  overlay.appendChild(inner);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    inner.style.transform = 'scale(1)';
  });

  try {
    const canvas = await generateShareCard();

    inner.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.style.cssText = 'color:#06b6d4;font-size:13px;font-weight:bold;margin-bottom:12px;font-family:ArkPixel,monospace;';
    title.textContent = '📸 状态分享卡片';
    inner.appendChild(title);

    // Canvas preview
    canvas.style.cssText = 'width:100%;max-width:600px;border-radius:8px;border:1px solid #333;';
    inner.appendChild(canvas);

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:14px;';

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '💾 保存图片';
    downloadBtn.style.cssText = 'background:rgba(6,182,212,0.15);border:1px solid #06b6d433;color:#06b6d4;padding:6px 16px;border-radius:6px;cursor:pointer;font-family:ArkPixel,monospace;font-size:12px;';
    downloadBtn.onclick = () => downloadShareCard(canvas);
    btnRow.appendChild(downloadBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 复制图片';
    copyBtn.style.cssText = 'background:rgba(251,191,36,0.15);border:1px solid #fbbf2433;color:#fbbf24;padding:6px 16px;border-radius:6px;cursor:pointer;font-family:ArkPixel,monospace;font-size:12px;';
    copyBtn.onclick = () => copyShareCard(canvas);
    btnRow.appendChild(copyBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ 关闭';
    closeBtn.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid #333;color:#6b7280;padding:6px 16px;border-radius:6px;cursor:pointer;font-family:ArkPixel,monospace;font-size:12px;';
    closeBtn.onclick = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); };
    btnRow.appendChild(closeBtn);

    inner.appendChild(btnRow);
  } catch (e) {
    inner.innerHTML = `<div style="color:#ef4444;font-size:12px;font-family:ArkPixel,monospace;">生成失败: ${e.message}</div>`;
  }

  // Click overlay to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
  });
};

function downloadShareCard(canvas) {
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `snoopy-office-${dateStr}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function copyShareCard(canvas) {
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showShareToast('图片已复制到剪贴板');
  } catch (e) {
    showShareToast('复制失败，请右键保存');
  }
}

function showShareToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#e5e7eb;padding:8px 20px;border-radius:6px;font-family:ArkPixel,monospace;font-size:12px;z-index:10003;border:1px solid #333;opacity:0;transition:opacity 0.2s;';
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
}
