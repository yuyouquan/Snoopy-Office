// Snoopy小龙虾办公室 - 环境音效系统
// 白噪音 + 状态音效，营造沉浸式工作氛围

const AMBIENT_SOUNDS = {
  rain:    { label: '雨声',   emoji: '🌧️', freq: [200, 300, 400], type: 'noise' },
  cafe:    { label: '咖啡馆', emoji: '☕', freq: [250, 350, 450], type: 'noise' },
  fire:    { label: '壁炉',   emoji: '🔥', freq: [150, 200, 250], type: 'crackle' },
  ocean:   { label: '海浪',   emoji: '🌊', freq: [100, 150, 200], type: 'wave' },
  forest:  { label: '森林',   emoji: '🌿', freq: [300, 500, 700], type: 'chirp' },
  typing:  { label: '打字机', emoji: '⌨️', freq: [800, 1200, 2000], type: 'click' }
};

const soundState = {
  active: null,
  volume: 0.3,
  audioCtx: null,
  nodes: [],
  panelVisible: false
};

// ─── Audio Engine (Web Audio API) ──────────────────────────

function getAudioCtx() {
  if (!soundState.audioCtx) {
    soundState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return soundState.audioCtx;
}

function createNoiseGenerator(frequencies, type) {
  const ctx = getAudioCtx();
  const nodes = [];

  if (type === 'noise') {
    // Brown noise via filtered white noise
    const bufSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + (0.02 * white)) / 1.02;
      data[i] = last * 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequencies[1] || 300;

    const gain = ctx.createGain();
    gain.gain.value = soundState.volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.push({ source, filter, gain });
  } else if (type === 'wave') {
    // Ocean: slow oscillating filtered noise
    const bufSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + (0.02 * white)) / 1.02;
      data[i] = last * 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1; // slow wave
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = soundState.volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.push({ source, filter, gain, lfo });
  } else if (type === 'crackle') {
    // Fire crackle: random impulses
    const bufSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() > 0.97 ? (Math.random() * 0.5 - 0.25) : 0;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = soundState.volume * 1.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.push({ source, filter, gain });
  } else if (type === 'chirp') {
    // Forest: gentle high-frequency tones
    for (const freq of frequencies) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3 + Math.random() * 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const gain = ctx.createGain();
      gain.gain.value = soundState.volume * 0.08;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      nodes.push({ source: osc, gain, lfo });
    }
  } else if (type === 'click') {
    // Typing: rhythmic clicks via noise bursts
    const bufSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const clickRate = 6; // clicks per second
    const clickLen = Math.floor(ctx.sampleRate * 0.008);
    for (let c = 0; c < clickRate; c++) {
      const start = Math.floor(Math.random() * (bufSize - clickLen));
      for (let i = 0; i < clickLen; i++) {
        data[start + i] = (Math.random() * 2 - 1) * 0.3 * (1 - i / clickLen);
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.value = soundState.volume * 0.6;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.push({ source, filter, gain });
  }

  return nodes;
}

// ─── Controls ──────────────────────────────────────────────

function playAmbient(key) {
  stopAmbient();

  const config = AMBIENT_SOUNDS[key];
  if (!config) return;

  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  soundState.active = key;
  soundState.nodes = createNoiseGenerator(config.freq, config.type);
  updateSoundPanel();
}

function stopAmbient() {
  for (const node of soundState.nodes) {
    try { if (node.source) node.source.stop(); } catch (_) { /* noop */ }
    try { if (node.lfo) node.lfo.stop(); } catch (_) { /* noop */ }
  }
  soundState.nodes = [];
  soundState.active = null;
  if (soundState.audioCtx) soundState.audioCtx.suspend();
  updateSoundPanel();
}

function setAmbientVolume(vol) {
  soundState.volume = Math.max(0, Math.min(1, vol));
  for (const node of soundState.nodes) {
    if (node.gain) {
      node.gain.gain.value = soundState.volume;
    }
  }
  updateSoundPanel();
}

function toggleSoundPanel() {
  soundState.panelVisible = !soundState.panelVisible;
  updateSoundPanel();
}

// ─── Panel UI ──────────────────────────────────────────────

function updateSoundPanel() {
  let panel = document.getElementById('sound-panel');

  if (!soundState.panelVisible) {
    if (panel) panel.remove();
    updateSoundButton();
    return;
  }

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'sound-panel';
    panel.style.cssText = [
      'position:fixed', 'bottom:60px', 'right:12px',
      'background:rgba(10,10,20,0.95)', 'border:1px solid #333',
      'border-radius:12px', 'padding:14px', 'z-index:10002',
      'font-family:ArkPixel,monospace', 'min-width:200px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.5)'
    ].join(';');
    document.body.appendChild(panel);
  }

  let html = '<div style="color:#06b6d4;font-size:13px;font-weight:bold;margin-bottom:10px;">🔊 环境音效</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';

  for (const [key, config] of Object.entries(AMBIENT_SOUNDS)) {
    const isActive = soundState.active === key;
    const bg = isActive ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)';
    const border = isActive ? '#06b6d4' : '#333';
    const color = isActive ? '#06b6d4' : '#9ca3af';
    html += `<div onclick="playAmbient('${key}')" style="background:${bg};border:1px solid ${border};border-radius:6px;padding:8px;cursor:pointer;text-align:center;">`;
    html += `<div style="font-size:18px;">${config.emoji}</div>`;
    html += `<div style="font-size:10px;color:${color};margin-top:2px;">${config.label}</div>`;
    html += '</div>';
  }

  html += '</div>';

  // Volume slider
  html += '<div style="margin-top:10px;display:flex;align-items:center;gap:8px;">';
  html += '<span style="color:#6b7280;font-size:10px;">🔈</span>';
  html += `<input type="range" min="0" max="100" value="${Math.round(soundState.volume * 100)}" `;
  html += 'oninput="setAmbientVolume(this.value/100)" ';
  html += 'style="flex:1;accent-color:#06b6d4;height:4px;">';
  html += '<span style="color:#6b7280;font-size:10px;">🔊</span>';
  html += '</div>';

  // Stop button
  if (soundState.active) {
    html += `<div onclick="stopAmbient()" style="margin-top:8px;text-align:center;color:#ef4444;font-size:11px;cursor:pointer;padding:4px;border:1px solid #ef444433;border-radius:4px;">⏹ 停止播放</div>`;
  }

  panel.innerHTML = html;
  updateSoundButton();
}

function updateSoundButton() {
  const btn = document.getElementById('sound-toggle-btn');
  if (!btn) return;
  if (soundState.active) {
    const config = AMBIENT_SOUNDS[soundState.active];
    btn.textContent = config.emoji;
    btn.style.background = 'rgba(6,182,212,0.2)';
    btn.style.borderColor = '#06b6d4';
  } else {
    btn.textContent = '🔇';
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.borderColor = '#333';
  }
}

// ─── Init ──────────────────────────────────────────────────

window.playAmbient = playAmbient;
window.stopAmbient = stopAmbient;
window.setAmbientVolume = setAmbientVolume;
window.toggleSoundPanel = toggleSoundPanel;
