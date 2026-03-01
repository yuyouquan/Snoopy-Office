/**
 * Snoopy-Office 像素办公室游戏引擎
 * Phase 1 MVP + 实时数据集成
 */

// ==================== 音效系统 ====================
const AudioSystem = {
    context: null,
    enabled: true,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },
    
    playTone(frequency, duration, type = 'square') {
        if (!this.enabled || !this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },
    
    playClick() { this.playTone(800, 0.05); },
    playSelect() { this.playTone(600, 0.08); },
    playTaskComplete() { 
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.15), 200);
    },
    playError() { this.playTone(200, 0.2, 'sawtooth'); }
};

// 初始化音效（需要用户交互后）
document.addEventListener('click', () => {
    if (!AudioSystem.context) AudioSystem.init();
}, { once: true });

// ==================== 常量定义 ====================

// PICO-8 调色板
const COLORS = {
    black: '#000000',
    darkBlue: '#1d2b53',
    darkPurple: '#7e2553',
    darkGreen: '#008751',
    brown: '#ab5236',
    darkGray: '#5f574f',
    lightGray: '#c2c3c7',
    white: '#fff1e8',
    red: '#ff004d',
    orange: '#ffa300',
    yellow: '#ffec27',
    green: '#00e436',
    blue: '#29adff',
    indigo: '#83769c',
    pink: '#ff77a8',
    peach: '#ffccaa'
};

// 区域定义
const ZONES = {
    boss: { x: 50, y: 50, width: 150, height: 120, name: '老板办公室', color: COLORS.darkPurple },
    ai: { x: 250, y: 50, width: 120, height: 100, name: 'AI助手工位', color: COLORS.darkBlue },
    pm: { x: 420, y: 50, width: 100, height: 100, name: '产品区', color: COLORS.indigo },
    dev: { x: 570, y: 50, width: 200, height: 150, name: '开发区', color: COLORS.darkGreen },
    test: { x: 570, y: 250, width: 150, height: 100, name: '测试区', color: COLORS.blue },
    security: { x: 50, y: 250, width: 100, height: 100, name: '安全区', color: COLORS.red },
    search: { x: 200, y: 250, width: 120, height: 100, name: '查询区', color: COLORS.orange },
    meeting: { x: 370, y: 200, width: 150, height: 100, name: '会议室', color: COLORS.pink },
    break: { x: 50, y: 400, width: 200, height: 150, name: '休息区', color: COLORS.peach },
    server: { x: 300, y: 400, width: 150, height: 150, name: '服务器区', color: COLORS.darkGray }
};

// ==================== 主题系统 ====================
const ThemeSystem = {
    current: 'dark',
    themes: {
        dark: {
            name: '🌙 暗黑主题',
            bg: '#1d1d21',
            panel: '#2d2d35',
            border: '#3d3d4a',
            text: '#fff1e8',
            accent: '#00e436'
        },
        light: {
            name: '☀️ 明亮主题',
            bg: '#f0f0f0',
            panel: '#ffffff',
            border: '#cccccc',
            text: '#333333',
            accent: '#008751'
        }
    },
    
    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        this.apply();
        AudioSystem.playClick();
        console.log(`🎨 主题: ${this.themes[this.current].name}`);
    },
    
    apply() {
        const t = this.themes[this.current];
        document.documentElement.style.setProperty('--bg-dark', t.bg);
        document.documentElement.style.setProperty('--bg-panel', t.panel);
        document.documentElement.style.setProperty('--border', t.border);
        document.documentElement.style.setProperty('--text-primary', t.text);
        document.documentElement.style.setProperty('--accent', t.accent);
        
        // 更新按钮状态
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = this.current === 'dark' ? '🌙' : '☀️';
    }
};

// ==================== 时间系统 ====================
const TimeOfDaySystem = {
    currentPeriod: 'morning', // morning, afternoon, evening, night
    periods: {
        morning: { name: '🌅 早晨', start: 6, end: 12, brightness: 1.0, tint: null },
        afternoon: { name: '☀️ 下午', start: 12, end: 18, brightness: 1.0, tint: null },
        evening: { name: '🌆 傍晚', start: 18, end: 21, brightness: 0.8, tint: 'rgba(255, 150, 50, 0.1)' },
        night: { name: '🌙 夜晚', start: 21, end: 6, brightness: 0.5, tint: 'rgba(0, 0, 50, 0.3)' }
    },
    
    update() {
        const hour = new Date().getHours();
        for (const [period, config] of Object.entries(this.periods)) {
            if (period === 'night' && (hour >= 21 || hour < 6)) {
                this.currentPeriod = period;
                break;
            }
            if (hour >= config.start && hour < config.end) {
                this.currentPeriod = period;
                break;
            }
        }
    },
    
    getBrightness() {
        return this.periods[this.currentPeriod].brightness;
    },
    
    getTint() {
        return this.periods[this.currentPeriod].tint;
    },
    
    cycle() {
        const order = ['morning', 'afternoon', 'evening', 'night'];
        const idx = order.indexOf(this.currentPeriod);
        this.currentPeriod = order[(idx + 1) % 4];
        AudioSystem.playClick();
        console.log(`🕐 时间: ${this.periods[this.currentPeriod].name}`);
    }
};

// ==================== 天气系统 ====================
const WeatherSystem = {
    current: 'none', // none, rain, snow, sparkle
    particles: [],
    active: false,
    types: {
        none: { name: '☁️ 无', particleCount: 0 },
        rain: { name: '🌧️ 下雨', particleCount: 100, color: '#29adff', speed: 8 },
        snow: { name: '❄️ 下雪', particleCount: 80, color: '#fff1e8', speed: 2 },
        sparkle: { name: '✨ 星星', particleCount: 30, color: '#ffec27', speed: 0.5 }
    },
    
    toggle() {
        const order = ['none', 'rain', 'snow', 'sparkle'];
        const idx = order.indexOf(this.current);
        this.current = order[(idx + 1) % 4];
        
        if (this.current === 'none') {
            this.particles = [];
            this.active = false;
        } else {
            this.initParticles();
            this.active = true;
        }
        
        AudioSystem.playClick();
        console.log(`🌤️ 天气: ${this.types[this.current].name}`);
        
        // 更新按钮
        const btn = document.getElementById('weather-toggle');
        if (btn) btn.textContent = this.types[this.current].name.split(' ')[0];
    },
    
    initParticles() {
        this.particles = [];
        const config = this.types[this.current];
        for (let i = 0; i < config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                size: this.current === 'snow' ? Math.random() * 3 + 1 : 2,
                speed: config.speed * (0.5 + Math.random() * 0.5),
                wobble: Math.random() * Math.PI * 2
            });
        }
    },
    
    update() {
        if (!this.active) return;
        
        const config = this.types[this.current];
        this.particles.forEach(p => {
            if (this.current === 'rain') {
                p.y += p.speed;
                p.x -= 1;
            } else if (this.current === 'snow') {
                p.y += p.speed;
                p.wobble += 0.05;
                p.x += Math.sin(p.wobble) * 0.5;
            } else if (this.current === 'sparkle') {
                p.wobble += 0.1;
                p.size = 2 + Math.sin(p.wobble) * 1.5;
            }
            
            // 边界重置
            if (p.y > 600) p.y = -10;
            if (p.x < 0) p.x = 800;
        });
    },
    
    draw(ctx) {
        if (!this.active) return;
        
        const config = this.types[this.current];
        ctx.fillStyle = config.color;
        
        this.particles.forEach(p => {
            if (this.current === 'rain') {
                ctx.fillRect(p.x, p.y, 1, p.size * 3);
            } else if (this.current === 'snow') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.current === 'sparkle') {
                ctx.globalAlpha = 0.5 + Math.sin(p.wobble) * 0.5;
                ctx.fillRect(p.x, p.y, p.size, p.size);
                ctx.globalAlpha = 1;
            }
        });
    }
};

// 角色定义 - 完整版（10个角色）
const CHARACTERS = [
    { id: 'boss', name: '👔 老板', role: '用户', zone: 'boss', color: COLORS.brown, task: '下达指令', progress: 100, status: 'idle', history: [] },
    { id: 'ai', name: '🤖 AI助手', role: '主助手', zone: 'ai', color: COLORS.blue, task: '分配任务', progress: 100, status: 'working', history: [] },
    { id: 'pm', name: '📋 产品经理', role: '产品', zone: 'pm', color: COLORS.indigo, task: '整理需求文档', progress: 75, status: 'working', history: [] },
    { id: 'pm_manager', name: '📊 项目经理', role: '产品', zone: 'meeting', color: COLORS.pink, task: '协调进度', progress: 50, status: 'working', history: [] },
    { id: 'fe', name: '💻 前端开发', role: '开发', zone: 'dev', color: COLORS.green, task: '实现UI组件', progress: 45, status: 'working', history: [] },
    { id: 'be', name: '⚙️ 后端开发', role: '开发', zone: 'dev', color: COLORS.yellow, task: '编写API接口', progress: 30, status: 'working', history: [] },
    { id: 'qa', name: '🧪 测试工程师', role: '测试', zone: 'test', color: COLORS.blue, task: '执行测试用例', progress: 20, status: 'working', history: [] },
    { id: 'security', name: '🔒 安全专家', role: '安全', zone: 'security', color: COLORS.red, task: '漏洞扫描', progress: 0, status: 'idle', history: [] },
    { id: 'miner', name: '🔍 新闻矿工', role: '查询', zone: 'search', color: COLORS.orange, task: '搜索信息', progress: 60, status: 'working', history: [] },
    { id: 'writer', name: '✍️ 小说家', role: '创作', zone: 'break', color: COLORS.pink, task: '创作中', progress: 80, status: 'working', history: [] }
];

// ==================== 游戏状态 ====================

let canvas, ctx;
let characters = JSON.parse(JSON.stringify(CHARACTERS));
let selectedCharacter = null;
let animationFrame = 0;
let isRunning = true;
let gameSpeed = 1;
let useRealTimeData = true; // 默认开启实时数据
let dailyCompleted = 0; // 今日完成任务计数
let lastDate = new Date().toDateString(); // 上次更新日期

// 实时数据API配置
const API_CONFIG = {
    // 本地API端点
    localEndpoint: '/api/status',
    // SSE实时推送端点
    sseEndpoint: '/api/sse',
    // 静态JSON fallback (放在根目录避免SPA路由问题)
    staticEndpoint: '/static-data.json',
    // 模拟数据间隔
    simulationInterval: 5000,
    // SSE重试间隔
    sseReconnectInterval: 5000,
    // 重试次数
    maxRetries: 3
};

// ==================== SSE 实时推送系统 (Iteration 20) ====================
const SSESystem = {
    eventSource: null,
    connected: false,
    reconnectTimer: null,
    lastUpdate: null,
    
    connect() {
        if (this.eventSource) {
            this.disconnect();
        }
        
        try {
            this.eventSource = new EventSource(API_CONFIG.sseEndpoint);
            
            this.eventSource.onopen = () => {
                console.log('🔗 SSE 连接已建立');
                this.connected = true;
                updateConnectionStatus(true, '⚡ SSE实时推送中');
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('SSE 消息解析错误:', e);
                }
            };
            
            this.eventSource.onerror = (error) => {
                console.log('SSE 连接错误，尝试重新连接...');
                this.connected = false;
                this.disconnect();
                this.scheduleReconnect();
            };
            
        } catch (e) {
            console.error('SSE 连接失败:', e);
            this.scheduleReconnect();
        }
    },
    
    handleMessage(data) {
        this.lastUpdate = Date.now();
        
        if (data.type === 'connected') {
            console.log('✅ SSE 已连接');
            return;
        }
        
        if (data.type === 'update' && data.data) {
            updateCharactersFromStatus(data.data);
            updateStats();
        }
    },
    
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.connected = false;
    },
    
    scheduleReconnect() {
        if (this.reconnectTimer) return;
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, API_CONFIG.sseReconnectInterval);
    },
    
    isActive() {
        return this.connected && this.eventSource !== null;
    }
};

// ==================== 数据统计系统 (Iteration 20) ====================
const StatsSystem = {
    history: [], // 存储历史统计数据
    maxHistory: 100,
    sessionStart: Date.now(),
    
    record() {
        const working = characters.filter(c => c.status === 'working').length;
        const idle = characters.length - working;
        const totalProgress = Math.round(characters.reduce((sum, c) => sum + c.progress, 0) / characters.length);
        
        this.history.push({
            timestamp: Date.now(),
            working,
            idle,
            progress: totalProgress,
            completed: dailyCompleted
        });
        
        // 限制历史记录数量
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    },
    
    getEfficiencyTrend(characterId) {
        const charHistory = this.history.filter(h => {
            const char = characters.find(c => c.id === characterId);
            return char && char.status === 'working';
        });
        
        if (charHistory.length < 2) return 0;
        
        // 计算效率趋势 (正数表示效率提升)
        const recent = charHistory.slice(-5);
        const older = charHistory.slice(-10, -5);
        
        if (recent.length === 0 || older.length === 0) return 0;
        
        const recentAvg = recent.reduce((s, h) => s + h.progress, 0) / recent.length;
        const olderAvg = older.reduce((s, h) => s + h.progress, 0) / older.length;
        
        return recentAvg - olderAvg;
    },
    
    getDailyChartData() {
        // 按分钟分组统计
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        const hourlyData = [];
        for (let i = 0; i < 12; i++) {
            const time = oneHourAgo + (i * 300000); // 5分钟间隔
            const matching = this.history.filter(h => 
                h.timestamp >= time && h.timestamp < time + 300000
            );
            
            const avgProgress = matching.length > 0 
                ? matching.reduce((s, h) => s + h.progress, 0) / matching.length 
                : 0;
            
            hourlyData.push({
                time: new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                progress: avgProgress,
                working: matching.length > 0 ? matching[matching.length - 1].working : 0
            });
        }
        
        return hourlyData;
    },
    
    getTopPerformer() {
        const scores = characters.map(char => ({
            id: char.id,
            name: char.name,
            score: (char.progress || 0) + (char.history?.length || 0) * 10
        }));
        
        return scores.sort((a, b) => b.score - a.score)[0];
    }
};

// ==================== 自定义皮肤系统 (Iteration 20) ====================
const SkinSystem = {
    currentSkin: 'default',
    skins: {
        default: { name: '🎨 默认', palette: 'pico8' },
        retro: { name: '📺 复古', palette: 'cga' },
        neon: { name: '💜 霓虹', palette: 'neon' },
        pastel: { name: '🌸 粉彩', palette: 'pastel' }
    },
    
    palettes: {
        pico8: { primary: COLORS.blue, secondary: COLORS.green, accent: COLORS.yellow },
        cga: { primary: '#55FFFF', secondary: '#FF55FF', accent: '#FFFF55' },
        neon: { name: '💜 霓虹', primary: '#FF00FF', secondary: '#00FFFF', accent: '#FF0080' },
        pastel: { name: '🌸 粉彩', primary: '#FFB6C1', secondary: '#98FB98', accent: '#DDA0DD' }
    },
    
    cycle() {
        const skinList = Object.keys(this.skins);
        const idx = skinList.indexOf(this.currentSkin);
        this.currentSkin = skinList[(idx + 1) % skinList.length];
        AudioSystem.playClick();
        console.log(`🎭 皮肤: ${this.skins[this.currentSkin].name}`);
    },
    
    getCurrentPalette() {
        return this.palettes[this.currentSkin] || this.palettes.pico8;
    }
};

// 键盘快捷键
const KEYBOARD_SHORTCUTS = {
    '1': 'boss',
    '2': 'ai',
    '3': 'pm',
    '4': 'fe',
    '5': 'be',
    '6': 'qa',
    '7': 'security',
    '8': 'miner',
    'Escape': null,
    'ArrowUp': () => moveSelection(-1),
    'ArrowDown': () => moveSelection(1),
    '+': () => { gameSpeed = Math.min(3, gameSpeed + 0.5); },
    '-': () => { gameSpeed = Math.max(0.5, gameSpeed - 0.5); },
    'r': () => toggleRealTimeData(),
    'R': () => toggleRealTimeData(),
    's': () => toggleSSE(),
    'S': () => toggleSSE(),
    'k': () => SkinSystem.cycle(),
    'K': () => SkinSystem.cycle(),
    ' ': () => refreshStatus()  // Space 刷新
};

function moveSelection(direction) {
    const currentIndex = selectedCharacter 
        ? characters.findIndex(c => c.id === selectedCharacter)
        : -1;
    const newIndex = (currentIndex + direction + characters.length) % characters.length;
    selectedCharacter = characters[newIndex].id;
    showCharacterPanel(characters[newIndex]);
}

function handleKeyboard(e) {
    // CommandPalette 键盘处理 (Iteration 22)
    if (CommandPalette.show) {
        if (e.key === 'Tab') {
            e.preventDefault();
            return;
        }
        if (CommandPalette.handleKey(e.key)) {
            e.preventDefault();
            return;
        }
    }
    
    // Tab 切换任务看板
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        TaskBoard.toggle();
        return;
    }
    
    // Ctrl+P 打开命令面板
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        CommandPalette.toggle();
        return;
    }
    
    if (KEYBOARD_SHORTCUTS[e.key]) {
        const charId = KEYBOARD_SHORTCUTS[e.key];
        if (charId === null) {
            selectedCharacter = null;
            closePanel();
        } else if (typeof charId === 'string') {
            selectedCharacter = charId;
            const char = characters.find(c => c.id === charId);
            if (char) showCharacterPanel(char);
        } else if (typeof charId === 'function') {
            charId();
        }
    }
}

// ==================== 实时数据集成 ====================

/**
 * 切换实时数据模式
 */
function toggleRealTimeData() {
    useRealTimeData = !useRealTimeData;
    const connEl = document.getElementById('connection');
    if (useRealTimeData) {
        connEl.textContent = '🔄 实时同步中...';
        connEl.classList.remove('disconnected');
        fetchRealTimeStatus();
    } else {
        connEl.textContent = '🟢 已连接 (模拟)';
        connEl.classList.remove('disconnected');
    }
    AudioSystem.playClick();
    console.log(`📡 实时数据模式: ${useRealTimeData ? '开启' : '关闭'}`);
}

/**
 * 切换 SSE 实时推送 (Iteration 20)
 */
let sseEnabled = false;

function toggleSSE() {
    sseEnabled = !sseEnabled;
    const btn = document.getElementById('sse-toggle');
    const connEl = document.getElementById('connection');
    
    if (sseEnabled) {
        SSESystem.connect();
        btn.textContent = '⚡';
        btn.classList.add('active');
    } else {
        SSESystem.disconnect();
        btn.textContent = '⚡';
        btn.classList.remove('active');
        updateConnectionStatus(true, '🟢 已连接');
    }
    
    AudioSystem.playClick();
    console.log(`⚡ SSE 推送: ${sseEnabled ? '开启' : '关闭'}`);
}

/**
 * 获取实时状态（支持本地API、静态JSON和模拟）
 */
async function fetchRealTimeStatus() {
    if (!useRealTimeData) return;
    
    try {
        // 尝试从本地API获取
        const response = await fetch(API_CONFIG.localEndpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // 检查HTTP状态和Content-Type
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
            console.log('API返回非JSON响应，尝试静态JSON...');
            return await tryStaticJSON();
        }
        
        const data = await response.json();
        updateCharactersFromStatus(data);
        updateConnectionStatus(true, '🔗 已连接实时数据');
        return;
    } catch (error) {
        console.log('本地API不可用，尝试静态JSON:', error.message);
    }
    
    // 尝试静态JSON
    await tryStaticJSON();
}

// 尝试从静态JSON获取数据
async function tryStaticJSON() {
    try {
        const response = await fetch(API_CONFIG.staticEndpoint);
        if (response.ok) {
            const data = await response.json();
            updateCharactersFromStatus(data);
            updateConnectionStatus(true, '📦 已连接静态数据');
            return;
        }
    } catch (e) {
        console.log('静态JSON不可用:', e.message);
    }
    
    // 降级到模拟数据
    simulateOpenClawStatus();
}

/**
 * 从状态数据更新角色
 */
function updateCharactersFromStatus(status) {
    // 兼容两种API格式：
    // 1. { roles: [...] } - 旧格式
    // 2. { data: { characters: [...] } } - 新格式
    let roles = [];
    if (status.roles) {
        roles = status.roles;
    } else if (status.data && status.data.characters) {
        roles = status.data.characters;
    }
    
    if (!roles || roles.length === 0) return;
    
    status.roles.forEach(roleData => {
        const char = characters.find(c => c.id === roleData.id);
        if (char) {
            // 更新任务
            if (roleData.task) char.task = roleData.task;
            // 更新进度
            if (roleData.progress !== undefined) char.progress = roleData.progress;
            // 更新状态
            if (roleData.status) char.status = roleData.status;
            // 更新区域（如果有）
            if (roleData.zone && ZONES[roleData.zone]) {
                char.zone = roleData.zone;
            }
        }
    });
    
    // 更新面板（如果当前选中）
    if (selectedCharacter) {
        const char = characters.find(c => c.id === selectedCharacter);
        if (char) showCharacterPanel(char);
    }
    
    // 更新统计
    updateStats();
}

/**
 * 更新连接状态显示
 */
function updateConnectionStatus(connected, text) {
    const connEl = document.getElementById('connection');
    if (connected) {
        connEl.textContent = text || '🟢 已连接';
        connEl.classList.remove('disconnected');
    } else {
        connEl.textContent = '🔴 模拟模式';
        connEl.classList.add('disconnected');
    }
}

/**
 * 模拟OpenClaw状态（用于演示）
 */
function simulateOpenClawStatus() {
    const tasks = {
        'pm': ['整理需求文档', '撰写PRD', '用户访谈', '竞品分析'],
        '产品': ['整理需求文档', '撰写PRD', '用户访谈', '竞品分析'],
        'fe': ['实现UI组件', '修复样式bug', '优化性能', '编写文档'],
        '开发': ['实现UI组件', '修复样式bug', '优化性能', '编写文档'],
        'be': ['编写API接口', '数据库优化', '写单元测试', 'Code Review'],
        'qa': ['执行测试用例', '编写测试报告', '回归测试', 'Bug验证'],
        '测试': ['执行测试用例', '编写测试报告', '回归测试', 'Bug验证'],
        'security': ['漏洞扫描', '安全审计', '渗透测试', '安全培训'],
        '安全': ['漏洞扫描', '安全审计', '渗透测试', '安全培训'],
        'miner': ['搜索信息', '整理新闻', '数据分析', '报告撰写'],
        '查询': ['搜索信息', '整理新闻', '数据分析', '报告撰写'],
        'ai': ['分配任务', '协调进度', '审核代码', '回复用户'],
        '主助手': ['分配任务', '协调进度', '审核代码', '回复用户'],
        'boss': ['下达指令', '开会', '审批文件', '战略规划'],
        '用户': ['下达指令', '开会', '审批文件', '战略规划'],
        '创作': ['创作中', '构思情节', '修改稿子', '发布章节'],
        '产品经理': ['整理需求文档', '撰写PRD', '用户访谈', '竞品分析'],
        '项目经理': ['协调进度', '更新看板', '会议组织', '风险管理']
    };
    
    // 随机更新部分角色
    characters.forEach(char => {
        // 增加进度
        if (char.status === 'working') {
            const oldProgress = char.progress;
            char.progress = Math.min(100, char.progress + Math.floor(Math.random() * 5 * gameSpeed));
            
            // 检查进度里程碑并通知
            if (oldProgress < 50 && char.progress >= 50) {
                TaskNotification.add(char, char.task, 50);
            }
        }
        
        // 进度满时切换任务
        if (char.progress >= 100) {
            const taskList = tasks[char.role] || tasks[char.name] || ['工作中'];
            const newTask = taskList[Math.floor(Math.random() * taskList.length)];
            
            // 记录到历史
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            char.history = char.history || [];
            char.history.push({ time: timeStr, task: char.task, completed: true });
            if (char.history.length > 10) char.history = char.history.slice(-10);
            
            char.task = newTask;
            char.progress = 0;
            
            // 增加每日完成任务计数
            dailyCompleted++;
            
            // 触发任务通知
            TaskNotification.add(char, char.task, 100);
            
            // 触发烟花庆祝
            const pos = getZoneCenter(char.zone);
            FireworkSystem.celebrate(pos.x, pos.y - 30, newTask);
            
            // 记录区域访问
            ZoneStats.recordVisit(char.zone);
            
            // 30%概率更换区域
            if (Math.random() < 0.3) {
                const zoneKeys = Object.keys(ZONES);
                const currentZoneIndex = zoneKeys.indexOf(char.zone);
                const newZoneIndex = (currentZoneIndex + Math.floor(Math.random() * 3) + 1) % zoneKeys.length;
                char.zone = zoneKeys[newZoneIndex];
            }
            
            // 播放完成音效
            if (useRealTimeData) {
                AudioSystem.playTaskComplete();
            }
        }
    });
    
    if (useRealTimeData) {
        updateConnectionStatus(true, '🔄 实时同步中...');
    }
    
    // 更新选中面板
    if (selectedCharacter) {
        const char = characters.find(c => c.id === selectedCharacter);
        if (char) showCharacterPanel(char);
    }
    
    updateStats();
}

// ==================== 初始化 ====================

function init() {
    canvas = document.getElementById('office');
    ctx = canvas.getContext('2d');
    
    // 像素化渲染
    ctx.imageSmoothingEnabled = false;
    
    // 绑定点击事件
    canvas.addEventListener('click', handleClick);
    
    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyboard);
    
    // 鼠标滚轮缩放 (Iteration 18)
    canvas.addEventListener('wheel', (e) => ZoomSystem.handleWheel(e), { passive: false });
    
    // 移动端触摸支持（改进）
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // 双指缩放支持
    let initialPinchDistance = 0;
    let currentScale = 1;
    
    function handleTouchMove(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (initialPinchDistance === 0) {
                initialPinchDistance = distance;
            } else {
                const scale = distance / initialPinchDistance;
                currentScale = Math.max(0.5, Math.min(2, scale));
                canvas.style.transform = `scale(${currentScale})`;
            }
        }
    }
    
    function handleTouchEnd(e) {
        initialPinchDistance = 0;
    }
    
    // 响应式画布
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 启动游戏循环
    gameLoop();
    
    // 更新时间显示
    updateTime();
    setInterval(updateTime, 1000);
    
    // 启动状态模拟（使用模拟模式）
    updateConnectionStatus(false);
    setInterval(() => {
        if (useRealTimeData) {
            fetchRealTimeStatus();
        } else {
            simulateOpenClawStatus();
        }
        
        // 记录统计数据 (Iteration 20)
        StatsSystem.record();
    }, API_CONFIG.simulationInterval);
    
    // 初始统计更新
    updateStats();
    
    // 初始化主题系统 (Iteration 19)
    ThemeSystem.apply();
    
    // 初始化时间系统 (Iteration 19)
    TimeOfDaySystem.update();
    
    // 自动启动 SSE (Iteration 20) - 可选
    // setTimeout(() => toggleSSE(), 3000);
    
    console.log('🎮 Snoopy-Office 已启动');
    console.log('⌨️ 快捷键: 1-8 选择角色, ESC 关闭, +/- 调整速度, R 实时数据, S SSE推送, T 主题, M 时间, W 天气, K 皮肤');
}

// ==================== 任务通知系统 ====================
const TaskNotification = {
    notifications: [],
    maxNotifications: 5,
    
    add(char, task, progress) {
        if (progress >= 100 && char.progress < 100) {
            // 任务完成通知
            this.notifications.push({
                charName: char.name,
                task: task,
                type: 'complete',
                timestamp: Date.now(),
                duration: 5000
            });
            AudioSystem.playTaskComplete();
            
            // 触发全屏庆祝
            if (gameCanvas) {
                gameCanvas.triggerCelebration(`${char.name} 完成任务: ${task}`);
            }
        } else if (progress >= 50 && char.progress < 50) {
            // 任务进行中通知
            this.notifications.push({
                charName: char.name,
                task: task,
                type: 'progress',
                timestamp: Date.now(),
                duration: 3000
            });
        }
        
        // 限制通知数量
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }
    },
    
    update() {
        const now = Date.now();
        this.notifications = this.notifications.filter(n => 
            now - n.timestamp < n.duration
        );
    },
    
    draw(ctx) {
        const x = ctx.canvas.width - 200;
        let y = 60;
        
        this.notifications.forEach((n, i) => {
            const alpha = Math.min(1, (n.duration - (Date.now() - n.timestamp)) / 1000);
            const bgColor = n.type === 'complete' ? 
                `rgba(0, 228, 54, ${alpha * 0.9})` : 
                `rgba(255, 163, 0, ${alpha * 0.9})`;
            
            ctx.fillStyle = bgColor;
            ctx.strokeStyle = n.type === 'complete' ? COLORS.green : COLORS.orange;
            ctx.lineWidth = 2;
            
            const text = n.type === 'complete' ? '✅' : '📈';
            roundRect(ctx, x - 10, y - 12, 190, 28, 6);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.font = 'bold 11px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText(`${text} ${n.charName}`, x, y + 4);
            
            y += 35;
        });
    }
};

// ==================== 游戏循环 ====================

function gameLoop() {
    if (!isRunning) return;
    
    update();
    render();
    
    // 更新通知
    TaskNotification.update();
    
    animationFrame++;
    requestAnimationFrame(gameLoop);
}

// ==================== 更新逻辑 ====================

function update() {
    // 角色动画效果
    characters.forEach(char => {
        if (char.status === 'idle') {
            char.x = char.x || getZoneCenter(char.zone).x;
            char.y = char.y || getZoneCenter(char.zone).y;
            // 轻微晃动（待机动画）
            char.offsetX = Math.sin(animationFrame * 0.05 + char.id.charCodeAt(0)) * 2;
            char.offsetY = Math.cos(animationFrame * 0.03 + char.id.charCodeAt(0)) * 2;
        } else {
            // 工作动画：轻微上下浮动
            char.offsetX = Math.sin(animationFrame * 0.1) * 1;
            char.offsetY = Math.sin(animationFrame * 0.15) * 1;
            
            // 工作类型特定的动画效果
            if (['开发', '产品', '测试', '创作'].includes(char.role)) {
                // 敲键盘动画：定期"敲击"
                char.typingFrame = Math.floor(animationFrame / 10) % 4;
            }
        }
    });
}

// ==================== 渲染逻辑 ====================

function render() {
    // 清空画布
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制区域（带热力图效果）
    drawZones();
    
    // 应用时间系统色调
    const tint = TimeOfDaySystem.getTint();
    if (tint) {
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 绘制角色
    drawCharacters();
    
    // 绘制天气粒子 (Iteration 19)
    WeatherSystem.update();
    WeatherSystem.draw(ctx);
    
    // 绘制烟花
    FireworkSystem.update();
    FireworkSystem.draw(ctx);
    
    // 绘制全屏庆祝消息
    FireworkSystem.drawCelebrationMessage(ctx);
    
    // 绘制选中高亮
    if (selectedCharacter) {
        drawSelectionHighlight();
    }
    
    // 绘制任务通知
    TaskNotification.draw(ctx);
    
    // 绘制小地图 (Iteration 18)
    drawMiniMap();
    
    // 绘制效率排名面板 (Iteration 18)
    drawRankingPanel();
    
    // 绘制效率趋势图表 (Iteration 21)
    EfficiencyChart.draw();
    
    // 绘制每日任务趋势 (Iteration 21)
    DailyTrend.draw();
    
    // 绘制任务看板 (Iteration 22)
    TaskBoard.draw();
    
    // 绘制快捷命令面板 (Iteration 22)
    CommandPalette.draw();
    
    // 绘制时间/天气状态指示 (Iteration 19)
    drawStatusIndicators();
    
    // 更新缩放系统
    ZoomSystem.update();
    
    // 更新跟随系统
    FollowSystem.update();
}

function drawZones() {
    // 绘制地板网格
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 绘制各区域
    Object.entries(ZONES).forEach(([key, zone]) => {
        // 区域背景
        ctx.fillStyle = zone.color + '40';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        // 热力图效果（如果启用）
        if (ZoneStats.heatmapEnabled && ZoneStats.visits[key] > 0) {
            ctx.fillStyle = ZoneStats.getZoneHeatmapColor(key);
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        }
        
        // 区域边框
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        // 区域名称
        ctx.fillStyle = COLORS.white;
        ctx.font = '12px "Courier New"';
        ctx.fillText(zone.name, zone.x + 5, zone.y + 15);
        
        // 显示访问次数（如果有）
        if (ZoneStats.heatmapEnabled && ZoneStats.visits[key] > 0) {
            ctx.fillStyle = COLORS.yellow;
            ctx.font = '10px "Courier New"';
            ctx.fillText(`(${ZoneStats.visits[key]})`, zone.x + zone.width - 25, zone.y + zone.height - 5);
        }
    });
}

function drawCharacters() {
    characters.forEach(char => {
        const pos = getCharacterPosition(char);
        const x = (pos.x || pos.x === 0) ? pos.x : getZoneCenter(char.zone).x;
        const y = (pos.y || pos.y === 0) ? pos.y : getZoneCenter(char.zone).y;
        
        char.x = x;
        char.y = y;
        
        // 绘制角色阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 搜索高亮效果
        if (char.highlighted) {
            ctx.strokeStyle = COLORS.yellow;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.stroke();
            
            // 脉冲动画
            const pulse = Math.sin(Date.now() / 200) * 5 + 30;
            ctx.strokeStyle = `rgba(255, 236, 39, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制角色
        drawPixelCharacter(x + (char.offsetX || 0), y + (char.offsetY || 0), char);
        
        // 绘制任务气泡
        if (char.status === 'working') {
            drawTaskBubble(x, y - 35, char);
        }
        
        // 搜索匹配标签
        if (char.searched && !char.highlighted) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x - 10, y + 20, 20, 12);
            ctx.fillStyle = COLORS.black;
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔍', x, y + 28);
        }
    });
}

function drawPixelCharacter(x, y, char) {
    // 身体
    ctx.fillStyle = char.color;
    ctx.fillRect(x - 10, y - 5, 20, 20);
    
    // 头部
    ctx.fillStyle = COLORS.peach;
    ctx.fillRect(x - 8, y - 18, 16, 14);
    
    // 眼睛 - 根据状态变化
    ctx.fillStyle = COLORS.black;
    const isWorking = char.status === 'working';
    const blinkFrame = Math.floor(animationFrame / 30) % 2 === 0;
    
    if (isWorking) {
        // 工作时：专注表情（稍大眼睛）
        ctx.fillStyle = blinkFrame ? COLORS.green : COLORS.darkGreen;
        ctx.fillRect(x - 5, y - 14, 4, 4);
        ctx.fillRect(x + 2, y - 14, 4, 4);
    } else if (char.role === '用户') {
        // 老板：威严表情
        ctx.fillStyle = COLORS.black;
        ctx.fillRect(x - 5, y - 14, 3, 3);
        ctx.fillRect(x + 2, y - 14, 3, 3);
    } else {
        // 待命/摸鱼：放松表情
        ctx.fillStyle = blinkFrame ? COLORS.orange : COLORS.brown;
        ctx.fillRect(x - 5, y - 14, 3, 3);
        ctx.fillRect(x + 2, y - 14, 3, 3);
    }
    
    // 角色特定装饰
    ctx.fillStyle = COLORS.white;
    switch (char.role) {
        case '用户':
            // 领带
            ctx.fillStyle = COLORS.red;
            ctx.fillRect(x - 2, y - 5, 4, 10);
            break;
        case '主助手':
            // 天线 - 工作时闪烁
            ctx.fillStyle = COLORS.lightGray;
            ctx.fillRect(x - 1, y - 24, 2, 6);
            ctx.fillStyle = (isWorking && Math.floor(animationFrame / 20) % 2 === 0) ? COLORS.yellow : COLORS.green;
            ctx.fillRect(x - 2, y - 25, 4, 2);
            break;
        case '开发':
            // 眼镜 + 敲键盘效果
            ctx.fillStyle = COLORS.blue;
            ctx.fillRect(x - 7, y - 14, 14, 2);
            // 敲键盘动画效果
            if (isWorking && char.typingFrame % 2 === 0) {
                ctx.fillRect(x + 8, y - 2, 6, 2);
            }
            break;
        case '测试':
            // 放大镜
            ctx.fillStyle = COLORS.lightGray;
            ctx.fillRect(x + 6, y - 8, 6, 6);
            break;
        case '产品':
            // 眼镜
            ctx.fillStyle = COLORS.indigo;
            ctx.fillRect(x - 6, y - 14, 12, 2);
            break;
        case '安全':
            // 耳机
            ctx.fillStyle = COLORS.red;
            ctx.fillRect(x - 12, y - 10, 4, 6);
            ctx.fillRect(x + 8, y - 10, 4, 6);
            break;
        case '查询':
            // 搜索图标
            ctx.fillStyle = COLORS.orange;
            ctx.fillRect(x + 5, y - 12, 6, 6);
            break;
        case '创作':
            // 笔
            ctx.fillStyle = COLORS.pink;
            if (isWorking && char.typingFrame === 1) {
                ctx.fillRect(x + 6, y - 4, 8, 2); // 拿笔写字
            }
            break;
    }
    
    // 状态指示器 - 优化动画
    const statusColor = isWorking ? COLORS.green : COLORS.orange;
    const blinkOn = Math.floor(animationFrame / (isWorking ? 15 : 40)) % 2 === 0;
    
    if (blinkOn) {
        ctx.fillStyle = statusColor;
        ctx.fillRect(x - 12, y - 22, 4, 4);
        ctx.fillRect(x + 8, y - 22, 4, 4);
    }
}

function drawTaskBubble(x, y, char) {
    const task = char.task || '工作中';
    const progress = char.progress || 0;
    
    // 气泡背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = char.color;
    ctx.lineWidth = 2;
    
    const bubbleWidth = Math.min(task.length * 8 + 20, 120);
    const bubbleHeight = 24;
    const bubbleX = x - bubbleWidth / 2;
    const bubbleY = y - bubbleHeight / 2;
    
    // 圆角矩形
    roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 6);
    ctx.fill();
    ctx.stroke();
    
    // 气泡尖角
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x - 6, bubbleY + bubbleHeight);
    ctx.lineTo(x, bubbleY + bubbleHeight + 6);
    ctx.lineTo(x + 6, bubbleY + bubbleHeight);
    ctx.fill();
    ctx.strokeStyle = char.color;
    ctx.beginPath();
    ctx.moveTo(x - 6, bubbleY + bubbleHeight);
    ctx.lineTo(x, bubbleY + bubbleHeight + 6);
    ctx.lineTo(x + 6, bubbleY + bubbleHeight);
    ctx.stroke();
    
    // 任务文字
    ctx.fillStyle = COLORS.black;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(task.substring(0, 12), x, bubbleY + 15);
    
    // 进度条
    const progressY = bubbleY + bubbleHeight + 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 25, progressY, 50, 4);
    ctx.fillStyle = char.color;
    ctx.fillRect(x - 25, progressY, 50 * (progress / 100), 4);
    
    ctx.textAlign = 'left';
}

function drawSelectionHighlight() {
    const char = characters.find(c => c.id === selectedCharacter);
    if (!char || !char.x) return;
    
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(char.x - 20, char.y - 30, 40, 55);
    ctx.setLineDash([]);
}

// ==================== 交互处理 ====================

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // 检查点击是否在角色上
    const clickedChar = characters.find(char => {
        const pos = getCharacterPosition(char);
        const charX = pos.x || getZoneCenter(char.zone).x;
        const charY = pos.y || getZoneCenter(char.zone).y;
        return Math.abs(x - charX) < 25 && Math.abs(y - charY) < 30;
    });
    
    if (clickedChar) {
        selectedCharacter = clickedChar.id;
        AudioSystem.playSelect();
        showCharacterPanel(clickedChar);
    } else {
        selectedCharacter = null;
        closePanel();
    }
}

// 触摸事件处理（改进）
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };

function handleTouch(e) {
    e.preventDefault();
    touchStartTime = Date.now();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    touchStartPos = { x, y };
    
    const clickedChar = characters.find(char => {
        const pos = getCharacterPosition(char);
        const charX = pos.x || getZoneCenter(char.zone).x;
        const charY = pos.y || getZoneCenter(char.zone).y;
        return Math.abs(x - charX) < 30 && Math.abs(y - charY) < 35;
    });
    
    if (clickedChar) {
        selectedCharacter = clickedChar.id;
        showCharacterPanel(clickedChar);
    } else {
        selectedCharacter = null;
        closePanel();
    }
}

function showCharacterPanel(char) {
    const panel = document.getElementById('character-panel');
    panel.classList.remove('hidden');
    
    document.getElementById('panel-name').textContent = char.name;
    document.getElementById('panel-status').textContent = char.status === 'working' ? '工作中' : '待命/摸鱼';
    document.getElementById('panel-progress').style.width = char.progress + '%';
    document.getElementById('panel-location').textContent = ZONES[char.zone]?.name || char.zone;
    document.getElementById('panel-task').textContent = char.task || '暂无任务';
    
    // 任务时间轴
    const timelineEl = document.getElementById('panel-timeline');
    if (char.history && char.history.length > 0) {
        timelineEl.innerHTML = char.history.slice(-5).map(item => `
            <div class="timeline-item">
                <span class="timeline-time">${item.time}</span>
                <span class="timeline-task">${item.task}</span>
                <span class="timeline-status ${item.completed ? 'done' : 'progress'}">${item.completed ? '✓' : '...'}</span>
            </div>
        `).join('');
    } else {
        timelineEl.innerHTML = '<div class="timeline-item"><span class="timeline-task">暂无历史记录</span></div>';
    }
}

function closePanel() {
    document.getElementById('character-panel').classList.add('hidden');
}

// 响应式画布
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = container.clientWidth - 40;
    const scale = Math.min(maxWidth / 800, 1);
    canvas.style.width = (800 * scale) + 'px';
    canvas.style.height = (600 * scale) + 'px';
}

// ==================== 工具函数 ====================

function getZoneCenter(zoneKey) {
    const zone = ZONES[zoneKey];
    if (!zone) return { x: 400, y: 300 };
    return {
        x: zone.x + zone.width / 2,
        y: zone.y + zone.height / 2
    };
}

function getCharacterPosition(char) {
    if (char.x !== undefined && char.y !== undefined) {
        return { x: char.x, y: char.y };
    }
    return getZoneCenter(char.zone);
}

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('time').textContent = `🕐 ${hours}:${minutes}`;
    updateStats();
}

function updateStats() {
    // 检查日期是否变化（新的一天）
    const today = new Date().toDateString();
    if (today !== lastDate) {
        dailyCompleted = 0;
        lastDate = today;
        // 重置区域统计
        ZoneStats.init();
    }
    
    const working = characters.filter(c => c.status === 'working').length;
    const idle = characters.filter(c => c.status !== 'working').length;
    const avgProgress = Math.round(characters.reduce((sum, c) => sum + c.progress, 0) / characters.length);
    
    document.getElementById('stat-working').textContent = working;
    document.getElementById('stat-idle').textContent = idle;
    document.getElementById('stat-progress').textContent = avgProgress + '%';
    document.getElementById('stat-speed').textContent = gameSpeed.toFixed(1) + 'x';
    document.getElementById('stat-completed').textContent = dailyCompleted;
    
    // 更新热门区域显示
    const topZones = ZoneStats.getMostVisited();
    if (topZones.length > 0 && topZones[0][1] > 0) {
        const zoneNames = topZones.map(([key, count]) => ZONES[key]?.name || key).slice(0, 2);
        document.getElementById('stat-top-zones').textContent = zoneNames.join(' > ') || '--';
    }
    
    // 记录效率数据 (Iteration 21)
    EfficiencyChart.addDataPoint(working, avgProgress);
}

// ==================== 增强功能：平滑移动 ====================

let targetPositions = {};
let currentPositions = {};

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function updateCharacterPositions() {
    characters.forEach(char => {
        const target = getZoneCenter(char.zone);
        const current = currentPositions[char.id] || target;
        
        currentPositions[char.id] = {
            x: lerp(current.x, target.x, 0.05),
            y: lerp(current.y, target.y, 0.05)
        };
        
        char.x = currentPositions[char.id].x;
        char.y = currentPositions[char.id].y;
    });
}

// ==================== 绘制辅助函数 ====================

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// ==================== 增强功能：全屏/导入导出 ====================

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

KEYBOARD_SHORTCUTS['f'] = toggleFullscreen;
KEYBOARD_SHORTCUTS['F'] = toggleFullscreen;

function exportState() {
    const state = {
        timestamp: Date.now(),
        characters: characters,
        zones: ZONES
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snoopy-office-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    AudioSystem.playClick();
}

function importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const state = JSON.parse(e.target.result);
            if (state.characters) {
                characters = state.characters;
                updateStats();
                AudioSystem.playSelect();
            }
        } catch (err) {
            AudioSystem.playError();
        }
    };
    reader.readAsText(file);
}

// ==================== 烟花庆祝系统 ====================
const FireworkSystem = {
    particles: [],
    celebrationActive: false,
    celebrationMessage: '',
    
    // 创建烟花
    create(x, y) {
        const colors = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.pink, COLORS.purple];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 创建多个粒子
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 60 + Math.random() * 30,
                size: 3 + Math.random() * 3
            });
        }
    },
    
    // 更新粒子
    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // 重力
            p.life--;
            p.size *= 0.98;
            return p.life > 0 && p.size > 0.5;
        });
    },
    
    // 绘制粒子
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
    },
    
    // 触发庆祝（任务完成时调用）
    celebrate(x, y, taskName = '') {
        this.create(x, y);
        // 再创建几个小的
        setTimeout(() => this.create(x - 30, y - 20), 100);
        setTimeout(() => this.create(x + 30, y - 10), 200);
        
        // 触发全屏庆祝效果
        if (taskName) {
            this.triggerFullscreenCelebration(taskName);
        }
    },
    
    // 全屏庆祝效果
    triggerFullscreenCelebration(taskName) {
        this.celebrationActive = true;
        this.celebrationMessage = taskName;
        this.celebrationFrame = 0;
        
        // 创建大量彩带粒子
        const colors = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.pink];
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = -10 - Math.random() * 100;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 3,
                color: color,
                life: 120 + Math.random() * 60,
                size: 4 + Math.random() * 4,
                isConfetti: true
            });
        }
        
        // 3秒后结束庆祝
        setTimeout(() => {
            this.celebrationActive = false;
            this.celebrationMessage = '';
        }, 3000);
    },
    
    // 绘制全屏庆祝消息
    drawCelebrationMessage(ctx) {
        if (!this.celebrationActive || !this.celebrationMessage) return;
        
        this.celebrationFrame = (this.celebrationFrame || 0) + 1;
        const alpha = Math.min(1, (60 - this.celebrationFrame) / 30);
        
        // 绘制半透明背景
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制消息
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 发光效果
        ctx.shadowColor = COLORS.yellow;
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = `rgba(255, 236, 39, ${alpha})`;
        ctx.font = 'bold 32px "Courier New"';
        ctx.fillText('🎉 任务完成!', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.shadowBlur = ctx.fillStyle = 10;
        `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '20px "Courier New"';
        ctx.fillText(this.celebrationMessage, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.restore();
    }
};

// ==================== 区域访问统计 ====================
const ZoneStats = {
    visits: {}, // { zoneKey: count }
    heatmapEnabled: true,
    
    init() {
        Object.keys(ZONES).forEach(key => {
            this.visits[key] = 0;
        });
    },
    
    recordVisit(zoneKey) {
        if (this.visits[zoneKey] !== undefined) {
            this.visits[zoneKey]++;
        }
    },
    
    getMostVisited() {
        return Object.entries(this.visits)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
    },
    
    getZoneHeatmapColor(zoneKey) {
        const maxVisits = Math.max(...Object.values(this.visits), 1);
        const visits = this.visits[zoneKey] || 0;
        const intensity = visits / maxVisits;
        
        // 从蓝色到红色的热力图渐变
        if (intensity < 0.25) return `rgba(0, 100, 255, ${0.1 + intensity * 0.2})`;
        if (intensity < 0.5) return `rgba(0, 255, 255, ${0.2 + intensity * 0.2})`;
        if (intensity < 0.75) return `rgba(255, 255, 0, ${0.3 + intensity * 0.2})`;
        return `rgba(255, 100, 0, ${0.4 + intensity * 0.3})`;
    },
    
    toggleHeatmap() {
        this.heatmapEnabled = !this.heatmapEnabled;
        return this.heatmapEnabled;
    }
};

// 初始化区域统计
ZoneStats.init();

// ==================== 角色状态时间线图表系统 ====================
const StatusTimelineChart = {
    chartData: {},
    
    // 记录状态变化
    recordStatus(charId, status, task, progress) {
        if (!this.chartData[charId]) {
            this.chartData[charId] = [];
        }
        
        const now = Date.now();
        this.chartData[charId].push({
            time: now,
            status: status,
            task: task,
            progress: progress
        });
        
        // 只保留最近50条记录
        if (this.chartData[charId].length > 50) {
            this.chartData[charId] = this.chartData[charId].slice(-50);
        }
    },
    
    // 获取图表数据
    getChartData(charId) {
        return this.chartData[charId] || [];
    },
    
    // 获取所有角色的今日统计
    getTodayStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        
        const stats = {
            totalTasks: 0,
            totalWorkingTime: 0,
            statusChanges: 0,
            byRole: {}
        };
        
        Object.entries(this.chartData).forEach(([charId, records]) => {
            const char = characters.find(c => c.id === charId);
            if (!char) return;
            
            const role = char.role;
            if (!stats.byRole[role]) {
                stats.byRole[role] = { tasks: 0, time: 0 };
            }
            
            records.forEach((record, index) => {
                if (record.time >= todayMs) {
                    stats.statusChanges++;
                    
                    // 统计任务完成
                    if (index > 0 && record.task !== records[index-1].task) {
                        stats.totalTasks++;
                        stats.byRole[role].tasks++;
                    }
                }
            });
        });
        
        return stats;
    }
};

// 修改simulateOpenClawStatus来记录状态变化
function recordStatusChanges() {
    characters.forEach(char => {
        StatusTimelineChart.recordStatus(
            char.id,
            char.status,
            char.task,
            char.progress
        );
    });
}

// 在游戏循环中调用状态记录
const originalGameLoop = gameLoop;
gameLoop = function() {
    updateCharacterPositions();
    // 每60帧记录一次状态变化（约1秒）
    if (animationFrame % 60 === 0) {
        recordStatusChanges();
    }
    originalGameLoop();
};

// ==================== 启动 ====================

// 手动刷新状态
function refreshStatus() {
    AudioSystem.playClick();
    fetchRealTimeStatus().then(() => {
        updateStats();
        console.log('🔄 状态已刷新');
    });
}

function toggleSound() {
    AudioSystem.enabled = !AudioSystem.enabled;
    const btn = document.getElementById('sound-toggle');
    btn.textContent = AudioSystem.enabled ? '🔊' : '🔇';
    if (AudioSystem.enabled) AudioSystem.playClick();
}

// 切换热力图显示
function toggleHeatmap() {
    const enabled = ZoneStats.toggleHeatmap();
    AudioSystem.playClick();
    console.log(`🗺️ 热力图: ${enabled ? '开启' : '关闭'}`);
}

// 搜索角色
let searchResults = [];
let currentSearchIndex = -1;

function searchCharacters(query) {
    searchResults = [];
    currentSearchIndex = -1;
    
    if (!query || query.trim() === '') {
        // 清除搜索状态
        characters.forEach(c => {
            c.searched = false;
            c.highlighted = false;
        });
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // 搜索匹配的角色
    characters.forEach((char, index) => {
        const matchName = char.name.toLowerCase().includes(lowerQuery);
        const matchRole = char.role.toLowerCase().includes(lowerQuery);
        const matchTask = char.task.toLowerCase().includes(lowerQuery);
        const matchZone = (ZONES[char.zone]?.name || '').toLowerCase().includes(lowerQuery);
        
        if (matchName || matchRole || matchTask || matchZone) {
            char.searched = true;
            char.searchMatch = matchName ? 'name' : matchRole ? 'role' : matchTask ? 'task' : 'zone';
            searchResults.push(index);
        } else {
            char.searched = false;
            char.highlighted = false;
        }
    });
    
    // 自动高亮第一个结果
    if (searchResults.length > 0) {
        currentSearchIndex = 0;
        characters[searchResults[0]].highlighted = true;
        // 移动镜头到第一个匹配角色
        const char = characters[searchResults[0]];
        const pos = getCharacterPosition(char);
        targetCameraX = pos.x - 400 + 16;
        targetCameraY = pos.y - 300 + 16;
    }
    
    console.log(`🔍 搜索 "${query}": 找到 ${searchResults.length} 个结果`);
    AudioSystem.playClick();
}

// 搜索结果导航
function navigateSearchResults(direction) {
    if (searchResults.length === 0) return;
    
    // 清除之前的高亮
    if (currentSearchIndex >= 0 && currentSearchIndex < searchResults.length) {
        characters[searchResults[currentSearchIndex]].highlighted = false;
    }
    
    // 更新索引
    currentSearchIndex += direction;
    if (currentSearchIndex >= searchResults.length) currentSearchIndex = 0;
    if (currentSearchIndex < 0) currentSearchIndex = searchResults.length - 1;
    
    // 高亮新结果
    const newChar = characters[searchResults[currentSearchIndex]];
    newChar.highlighted = true;
    
    // 移动镜头
    const pos = getCharacterPosition(newChar);
    targetCameraX = pos.x - 400 + 16;
    targetCameraY = pos.y - 300 + 16;
    
    // 显示详情面板
    showCharacterPanel(newChar);
    
    AudioSystem.playSelect();
}

// 搜索框快捷键
function focusSearch() {
    document.getElementById('search-box')?.focus();
}

// ==================== 缩放系统 (Iteration 18) ====================
const ZoomSystem = {
    scale: 1,
    minScale: 0.5,
    maxScale: 2,
    targetScale: 1,
    
    zoomIn() {
        this.targetScale = Math.min(this.maxScale, this.targetScale + 0.25);
    },
    
    zoomOut() {
        this.targetScale = Math.max(this.minScale, this.targetScale - 0.25);
    },
    
    reset() {
        this.targetScale = 1;
        cameraX = cameraY = targetCameraX = targetCameraY = 0;
    },
    
    update() {
        // 平滑缩放
        if (Math.abs(this.scale - this.targetScale) > 0.01) {
            this.scale += (this.targetScale - this.scale) * 0.1;
        }
    },
    
    // 鼠标滚轮缩放
    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }
};

// 角色跟随系统 (Iteration 18)
const FollowSystem = {
    followedCharacter: null,
    
    follow(charId) {
        this.followedCharacter = charId;
        const char = characters.find(c => c.id === charId);
        if (char) {
            console.log(`👀 跟随角色: ${char.name}`);
            AudioSystem.playClick();
        }
    },
    
    unfollow() {
        if (this.followedCharacter) {
            console.log(`👀 取消跟随`);
            AudioSystem.playClick();
        }
        this.followedCharacter = null;
    },
    
    update() {
        if (!this.followedCharacter) return;
        
        const char = characters.find(c => c.id === this.followedCharacter);
        if (!char) {
            this.followedCharacter = null;
            return;
        }
        
        const pos = getCharacterPosition(char);
        // 目标位置：角色在屏幕中心
        targetCameraX = pos.x - (canvas.width / 2 / ZoomSystem.scale) + 16;
        targetCameraY = pos.y - (canvas.height / 2 / ZoomSystem.scale) + 16;
    },
    
    isFollowing(charId) {
        return this.followedCharacter === charId;
    }
};

// 角色效率排名系统 (Iteration 18)
const EfficiencyRanking = {
    scores: {}, // { charId: score }
    
    // 更新角色效率分数
    updateScore(charId, progress, status) {
        if (!this.scores[charId]) {
            this.scores[charId] = 0;
        }
        
        if (status === 'working' && progress > 0) {
            this.scores[charId] += progress * 0.1;
        }
    },
    
    // 获取排名
    getRanking() {
        return Object.entries(this.scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([charId, score], index) => {
                const char = characters.find(c => c.id === charId);
                return {
                    rank: index + 1,
                    char: char,
                    score: Math.round(score)
                };
            })
            .filter(r => r.char);
    },
    
    // 重置排名
    reset() {
        this.scores = {};
    }
};

// 绘制小地图 (Iteration 18)
function drawMiniMap() {
    const mapWidth = 150;
    const mapHeight = 112;
    const mapX = canvas.width - mapWidth - 10;
    const mapY = 10;
    const scaleX = mapWidth / 800;
    const scaleY = mapHeight / 600;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    ctx.strokeStyle = '#5f574f';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
    
    // 区域
    Object.entries(ZONES).forEach(([key, zone]) => {
        ctx.fillStyle = zone.color + '40';
        ctx.fillRect(
            mapX + zone.x * scaleX,
            mapY + zone.y * scaleY,
            zone.width * scaleX,
            zone.height * scaleY
        );
    });
    
    // 角色点
    characters.forEach(char => {
        const pos = getCharacterPosition(char);
        const px = mapX + pos.x * scaleX;
        const py = mapY + pos.y * scaleY;
        
        // 跟随状态
        if (FollowSystem.isFollowing(char.id)) {
            ctx.fillStyle = COLORS.yellow;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = char.color;
            ctx.fillRect(px - 2, py - 2, 4, 4);
        }
    });
    
    // 摄像机视野框
    const camX = mapX + cameraX * scaleX;
    const camY = mapY + cameraY * scaleY;
    const camW = (canvas.width / ZoomSystem.scale) * scaleX;
    const camH = (canvas.height / ZoomSystem.scale) * scaleY;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(camX, camY, camW, camH);
    
    // 小地图标题
    ctx.fillStyle = COLORS.lightGray;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('🗺️ 地图', mapX + mapWidth / 2, mapY + mapHeight + 12);
}

// 绘制效率排名面板 (Iteration 18)
function drawRankingPanel() {
    if (!showRanking) return;
    
    const panelWidth = 180;
    const panelHeight = 200;
    const panelX = 10;
    const panelY = 10;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // 标题
    ctx.fillStyle = COLORS.green;
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 效率排名', panelX + 10, panelY + 25);
    
    // 排名列表
    const ranking = EfficiencyRanking.getRanking();
    ranking.forEach((item, index) => {
        const y = panelY + 45 + index * 28;
        
        // 排名颜色
        const rankColors = [COLORS.yellow, COLORS.lightGray, COLORS.brown];
        ctx.fillStyle = rankColors[index] || COLORS.white;
        
        // 排名
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText(`${item.rank}.`, panelX + 15, y);
        
        // 角色名
        ctx.font = '11px "Courier New"';
        ctx.fillStyle = COLORS.white;
        ctx.fillText(item.char.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 8), panelX + 35, y);
        
        // 分数
        ctx.fillStyle = COLORS.green;
        ctx.textAlign = 'right';
        ctx.fillText(item.score + '分', panelX + panelWidth - 15, y);
        ctx.textAlign = 'left';
    });
}

// 快捷键绑定
KEYBOARD_SHORTCUTS['h'] = toggleHeatmap;
KEYBOARD_SHORTCUTS['H'] = toggleHeatmap;
KEYBOARD_SHORTCUTS['/'] = focusSearch;
KEYBOARD_SHORTCUTS['n'] = () => navigateSearchResults(1);  // 下一个
KEYBOARD_SHORTCUTS['p'] = () => navigateSearchResults(-1); // 上一个
KEYBOARD_SHORTCUTS['='] = () => ZoomSystem.zoomIn();      // 放大
KEYBOARD_SHORTCUTS['+'] = () => ZoomSystem.zoomIn();      // 放大
KEYBOARD_SHORTCUTS['-'] = () => ZoomSystem.zoomOut();     // 缩小
KEYBOARD_SHORTCUTS['0'] = () => ZoomSystem.reset();       // 重置缩放
KEYBOARD_SHORTCUTS['f'] = () => {
    if (selectedCharacter) {
        FollowSystem.follow(selectedCharacter);
    }
};  // 跟随选中角色
KEYBOARD_SHORTCUTS['F'] = () => {
    if (selectedCharacter) {
        FollowSystem.follow(selectedCharacter);
    }
};
KEYBOARD_SHORTCUTS['v'] = () => {
    FollowSystem.unfollow();
};  // 取消跟随

// 背景音乐切换 (Iteration 21)
KEYBOARD_SHORTCUTS['b'] = () => BackgroundMusic.toggle();
KEYBOARD_SHORTCUTS['B'] = () => BackgroundMusic.toggle();

// 切换排名面板显示
let showRanking = false;
function toggleRanking() {
    showRanking = !showRanking;
    AudioSystem.playClick();
    console.log(`🏆 效率排名: ${showRanking ? '显示' : '隐藏'}`);
}

KEYBOARD_SHORTCUTS['l'] = toggleRanking;
KEYBOARD_SHORTCUTS['L'] = toggleRanking;

// 主题切换 (Iteration 19)
KEYBOARD_SHORTCUTS['t'] = () => ThemeSystem.toggle();
KEYBOARD_SHORTCUTS['T'] = () => ThemeSystem.toggle();

// 时间切换 (Iteration 19)
KEYBOARD_SHORTCUTS['m'] = () => TimeOfDaySystem.cycle();

// 天气切换 (Iteration 19)
KEYBOARD_SHORTCUTS['w'] = () => WeatherSystem.toggle();
KEYBOARD_SHORTCUTS['W'] = () => WeatherSystem.toggle();

// ==================== OpenClaw Gateway 对接 (Iteration 21) ====================
const OpenClawGateway = {
    gatewayUrl: 'http://localhost:4899', // 默认Gateway地址
    connected: false,
    retryCount: 0,
    maxRetries: 3,
    
    // 尝试从OpenClaw获取真实状态
    async fetchStatus() {
        try {
            // 尝试连接OpenClaw API
            const response = await fetch(`${this.gatewayUrl}/api/status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(2000)
            });
            
            if (response.ok) {
                const data = await response.json();
                this.connected = true;
                this.retryCount = 0;
                console.log('🔗 OpenClaw Gateway: 已连接');
                return this.transformOpenClawData(data);
            }
        } catch (error) {
            this.retryCount++;
            if (this.retryCount <= this.maxRetries) {
                console.log(`🔗 OpenClaw Gateway: 连接失败 (${this.retryCount}/${this.maxRetries}), 使用模拟数据`);
            }
            this.connected = false;
        }
        return null;
    },
    
    // 转换OpenClaw数据格式
    transformOpenClawData(data) {
        if (!data || !data.data) return null;
        
        const chars = data.data.characters || [];
        return chars.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status === 'active' ? 'working' : 'idle',
            task: c.task || '待命',
            progress: c.progress || 0,
            zone: this.mapToZone(c.role || 'assistant')
        }));
    },
    
    // 映射角色到区域
    mapToZone(role) {
        const zoneMap = {
            'boss': 'boss',
            'assistant': 'ai',
            'pm': 'pm',
            'project_manager': 'project',
            'frontend': 'dev',
            'backend': 'dev',
            'qa': 'test',
            'security': 'security',
            'researcher': 'search',
            'writer': 'break'
        };
        return zoneMap[role] || 'break';
    },
    
    // 检查连接状态
    getStatus() {
        return this.connected ? '🟢 Gateway已连接' : '🟡 使用模拟数据';
    }
};

// ==================== 实时效率图表系统 (Iteration 21) ====================
const EfficiencyChart = {
    history: [],
    maxHistory: 30, // 保存30个数据点
    show: false,
    
    // 添加数据点
    addDataPoint(working, progress) {
        this.history.push({
            time: Date.now(),
            working,
            progress
        });
        
        // 保持历史数据长度
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    },
    
    // 绘制效率图表
    draw() {
        if (!this.show || this.history.length < 2) return;
        
        const chartWidth = 200;
        const chartHeight = 80;
        const chartX = canvas.width - chartWidth - 10;
        const chartY = canvas.height - chartHeight - 10;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(chartX, chartY, chartWidth, chartHeight);
        ctx.strokeStyle = COLORS.blue;
        ctx.lineWidth = 1;
        ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);
        
        // 标题
        ctx.fillStyle = COLORS.blue;
        ctx.font = 'bold 10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('📈 效率趋势', chartX + 8, chartY + 15);
        
        // 绘制进度曲线
        ctx.beginPath();
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 2;
        
        this.history.forEach((point, i) => {
            const x = chartX + 10 + (i / (this.maxHistory - 1)) * (chartWidth - 20);
            const y = chartY + chartHeight - 15 - (point.progress / 100) * (chartHeight - 30);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 绘制工作人数曲线
        ctx.beginPath();
        ctx.strokeStyle = COLORS.orange;
        ctx.lineWidth = 1;
        
        this.history.forEach((point, i) => {
            const x = chartX + 10 + (i / (this.maxHistory - 1)) * (chartWidth - 20);
            const y = chartY + chartHeight - 15 - (point.working / 10) * (chartHeight - 30);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 图例
        ctx.font = '8px "Courier New"';
        ctx.fillStyle = COLORS.green;
        ctx.fillText('● 进度', chartX + 10, chartY + chartHeight - 5);
        ctx.fillStyle = COLORS.orange;
        ctx.fillText('● 人数', chartX + 50, chartY + chartHeight - 5);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    }
};

// 快捷键绑定
KEYBOARD_SHORTCUTS['e'] = () => EfficiencyChart.toggle();
KEYBOARD_SHORTCUTS['E'] = () => EfficiencyChart.toggle();

// ==================== 背景音乐控制 (Iteration 21) ====================
const BackgroundMusic = {
    enabled: false,
    tracks: [
        { name: '🏢 办公室', url: null, icon: '🏢' },
        { name: '🌙 放松', url: null, icon: '🌙' },
        { name: '🎮 街机', url: null, icon: '🎮' }
    ],
    currentTrack: 0,
    oscillators: [],
    
    // 生成简单的像素风格背景音
    play() {
        if (this.enabled) return;
        this.enabled = true;
        
        try {
            const ctx = AudioSystem.context || new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建简单的环境音
            this.createAmbientSound(ctx, 200, 0.02); // 低频
            this.createAmbientSound(ctx, 400, 0.01); // 中频
            
            AudioSystem.playTone(440, 0.3);
            console.log('🎵 背景音乐: 播放中');
        } catch (e) {
            console.warn('背景音乐播放失败:', e);
        }
    },
    
    createAmbientSound(ctx, freq, vol) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // 添加轻微的频率波动
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
        lfoGain.gain.setValueAtTime(5, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        lfo.start();
        
        this.oscillators.push({ osc, gain, lfo });
    },
    
    stop() {
        this.enabled = false;
        this.oscillators.forEach(o => {
            try {
                o.osc.stop();
                o.lfo.stop();
            } catch (e) {}
        });
        this.oscillators = [];
        console.log('🎵 背景音乐: 已停止');
    },
    
    toggle() {
        if (this.enabled) {
            this.stop();
        } else {
            this.play();
        }
        AudioSystem.playClick();
    },
    
    cycle() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        const track = this.tracks[this.currentTrack];
        console.log(`🎵 切换音轨: ${track.name}`);
        if (this.enabled) {
            this.stop();
            this.play();
        }
    }
};

// ==================== 每日任务趋势图 (Iteration 21) ====================
const DailyTrend = {
    show: false,
    tasksCompleted: 0,
    tasksTotal: 0,
    hourlyData: new Array(24).fill(0),
    
    // 记录任务完成
    recordTaskComplete() {
        this.tasksCompleted++;
        const hour = new Date().getHours();
        this.hourlyData[hour]++;
    },
    
    // 绘制趋势面板
    draw() {
        if (!this.show) return;
        
        const panelWidth = 250;
        const panelHeight = 150;
        const panelX = canvas.width / 2 - panelWidth / 2;
        const panelY = canvas.height / 2 - panelHeight / 2;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 标题
        ctx.fillStyle = COLORS.yellow;
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('📊 每日任务趋势', panelX + panelWidth / 2, panelY + 25);
        
        // 统计信息
        ctx.font = '12px "Courier New"';
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'left';
        ctx.fillText(`今日完成: ${this.tasksCompleted}`, panelX + 15, panelY + 50);
        ctx.fillText(`目标: ${this.tasksTotal}`, panelX + 15, panelY + 70);
        ctx.fillText(`完成率: ${this.tasksTotal > 0 ? Math.round(this.tasksCompleted / this.tasksTotal * 100) : 0}%`, panelX + 15, panelY + 90);
        
        // 小时柱状图
        const barWidth = (panelWidth - 30) / 24;
        const maxVal = Math.max(...this.hourlyData, 1);
        
        this.hourlyData.forEach((val, i) => {
            const x = panelX + 15 + i * barWidth;
            const barHeight = (val / maxVal) * 30;
            const y = panelY + 115 - barHeight;
            
            // 当前小时高亮
            const currentHour = new Date().getHours();
            ctx.fillStyle = i === currentHour ? COLORS.yellow : COLORS.blue;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        });
        
        // 关闭提示
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('按 E 关闭', panelX + panelWidth / 2, panelY + panelHeight - 10);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    }
};

// ==================== 实时任务看板 ====================
const TaskBoard = {
    show: false,
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    },
    
    draw() {
        if (!this.show) return;
        
        const panelWidth = 320;
        const panelHeight = 400;
        const panelX = canvas.width - panelWidth - 10;
        const panelY = 60;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 标题
        ctx.fillStyle = COLORS.green;
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('📋 实时任务看板', panelX + panelWidth / 2, panelY + 20);
        
        // 任务列表
        const workingChars = characters.filter(c => c.status === 'working');
        let y = panelY + 40;
        const lineHeight = 35;
        
        ctx.textAlign = 'left';
        ctx.font = '12px "Courier New"';
        
        if (workingChars.length === 0) {
            ctx.fillStyle = COLORS.lightGray;
            ctx.fillText('暂无进行中的任务', panelX + 15, y + 20);
        } else {
            workingChars.forEach((char, i) => {
                if (y + lineHeight > panelY + panelHeight - 30) return;
                
                // 角色图标
                ctx.fillStyle = char.color || COLORS.blue;
                ctx.fillRect(panelX + 10, y, 24, 24);
                
                // 角色名
                ctx.fillStyle = COLORS.white;
                ctx.font = 'bold 11px "Courier New"';
                ctx.fillText(char.name, panelX + 40, y + 12);
                
                // 任务描述
                ctx.fillStyle = COLORS.lightGray;
                ctx.font = '10px "Courier New"';
                const taskText = char.currentTask ? char.currentTask.substring(0, 25) : '待命';
                ctx.fillText(taskText, panelX + 40, y + 22);
                
                // 进度条
                const progress = char.progress || 0;
                ctx.fillStyle = COLORS.darkGray;
                ctx.fillRect(panelX + 10, y + 28, panelWidth - 50, 4);
                ctx.fillStyle = COLORS.green;
                ctx.fillRect(panelX + 10, y + 28, (panelWidth - 50) * (progress / 100), 4);
                
                y += lineHeight;
            });
        }
        
        // 统计
        ctx.fillStyle = COLORS.orange;
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'right';
        const idleCount = characters.filter(c => c.status === 'idle').length;
        ctx.fillText(`工作中: ${workingChars.length} | 待命: ${idleCount}`, panelX + panelWidth - 10, panelY + panelHeight - 10);
    }
};

// ==================== 快捷命令面板 ====================
const CommandPalette = {
    show: false,
    query: '',
    selectedIndex: 0,
    commands: [
        { id: 'toggle-realtime', label: '切换实时数据', key: 'R' },
        { id: 'toggle-heatmap', label: '切换热力图', key: 'H' },
        { id: 'toggle-ranking', label: '切换排名面板', key: 'L' },
        { id: 'toggle-theme', label: '切换主题', key: 'T' },
        { id: 'toggle-time', label: '切换时间', key: 'M' },
        { id: 'toggle-weather', label: '切换天气', key: 'W' },
        { id: 'toggle-skin', label: '切换皮肤', key: 'K' },
        { id: 'toggle-sse', label: '切换SSE', key: 'S' },
        { id: 'toggle-music', label: '切换音乐', key: 'B' },
        { id: 'toggle-trend', label: '切换趋势图', key: 'E' },
        { id: 'toggle-taskboard', label: '切换任务看板', key: 'Tab' },
        { id: 'fullscreen', label: '全屏模式', key: 'F' },
        { id: 'export', label: '导出状态', key: '' },
        { id: 'import', label: '导入状态', key: '' },
        { id: 'reset-view', label: '重置视图', key: 'Esc' },
        { id: 'speed-up', label: '加速', key: '+' },
        { id: 'speed-down', label: '减速', key: '-' },
    ],
    
    filteredCommands() {
        if (!this.query) return this.commands;
        const q = this.query.toLowerCase();
        return this.commands.filter(c => c.label.toLowerCase().includes(q));
    },
    
    toggle() {
        this.show = !this.show;
        this.query = '';
        this.selectedIndex = 0;
        if (this.show) {
            AudioSystem.playSelect();
        }
    },
    
    execute(commandId) {
        this.show = false;
        AudioSystem.playClick();
        
        switch (commandId) {
            case 'toggle-realtime': toggleRealTimeData(); break;
            case 'toggle-heatmap': toggleHeatmap(); break;
            case 'toggle-ranking': toggleRanking(); break;
            case 'toggle-theme': ThemeSystem.toggle(); break;
            case 'toggle-time': TimeOfDaySystem.cycle(); break;
            case 'toggle-weather': WeatherSystem.toggle(); break;
            case 'toggle-skin': SkinSystem.cycle(); break;
            case 'toggle-sse': toggleSSE(); break;
            case 'toggle-music': BackgroundMusic.toggle(); break;
            case 'toggle-trend': DailyTrend.toggle(); break;
            case 'toggle-taskboard': TaskBoard.toggle(); break;
            case 'fullscreen': toggleFullscreen(); break;
            case 'export': exportState(); break;
            case 'import': document.querySelector('input[type="file"]').click(); break;
            case 'reset-view': resetView(); break;
            case 'speed-up': adjustSpeed(0.5); break;
            case 'speed-down': adjustSpeed(-0.5); break;
        }
    },
    
    draw() {
        if (!this.show) return;
        
        const paletteWidth = 400;
        const paletteHeight = 300;
        const paletteX = canvas.width / 2 - paletteWidth / 2;
        const paletteY = canvas.height / 2 - paletteHeight / 2;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(paletteX, paletteY, paletteWidth, paletteHeight);
        ctx.strokeStyle = COLORS.blue;
        ctx.lineWidth = 2;
        ctx.strokeRect(paletteX, paletteY, paletteWidth, paletteHeight);
        
        // 标题
        ctx.fillStyle = COLORS.blue;
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 快捷命令面板', paletteX + paletteWidth / 2, paletteY + 25);
        
        // 搜索框
        ctx.fillStyle = COLORS.darkGray;
        ctx.fillRect(paletteX + 10, paletteY + 35, paletteWidth - 20, 30);
        ctx.fillStyle = COLORS.white;
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(this.query || '输入命令搜索...', paletteX + 15, paletteY + 56);
        
        // 命令列表
        const filtered = this.filteredCommands();
        let y = paletteY + 80;
        const itemHeight = 25;
        
        filtered.slice(0, 8).forEach((cmd, i) => {
            if (i === this.selectedIndex) {
                ctx.fillStyle = COLORS.darkBlue;
                ctx.fillRect(paletteX + 10, y - 15, paletteWidth - 20, itemHeight);
            }
            
            ctx.fillStyle = i === this.selectedIndex ? COLORS.white : COLORS.lightGray;
            ctx.font = '12px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText(cmd.label, paletteX + 20, y);
            
            if (cmd.key) {
                ctx.fillStyle = COLORS.orange;
                ctx.textAlign = 'right';
                ctx.fillText(`[${cmd.key}]`, paletteX + paletteWidth - 20, y);
            }
            
            y += itemHeight;
        });
        
        // 提示
        ctx.fillStyle = COLORS.darkGray;
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ 选择 | Enter 执行 | Esc 关闭', paletteX + paletteWidth / 2, paletteY + paletteHeight - 10);
    },
    
    handleKey(key) {
        if (!this.show) return false;
        
        const filtered = this.filteredCommands();
        
        if (key === 'ArrowUp') {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            return true;
        }
        if (key === 'ArrowDown') {
            this.selectedIndex = Math.min(filtered.length - 1, this.selectedIndex + 1);
            return true;
        }
        if (key === 'Enter' && filtered.length > 0) {
            this.execute(filtered[this.selectedIndex].id);
            return true;
        }
        if (key === 'Escape') {
            this.show = false;
            return true;
        }
        
        return false;
    }
};

// 更新音乐按钮状态
function updateMusicButton() {
    const btn = document.getElementById('music-toggle');
    if (btn) {
        btn.textContent = BackgroundMusic.enabled ? '🔊' : '🔇';
    }
}

// ==================== 状态指示器绘制 ====================
function drawStatusIndicators() {
    const padding = 10;
    const iconSize = 20;
    let x = canvas.width - iconSize - padding;
    const y = padding + 20; // 在小地图上方
    
    // 绘制时间指示
    ctx.font = '16px "Courier New"';
    const timeIcon = TimeOfDaySystem.periods[TimeOfDaySystem.currentPeriod].name.split(' ')[0];
    ctx.fillStyle = COLORS.white;
    ctx.fillText(timeIcon, x - 60, y);
    
    // 绘制天气指示
    if (WeatherSystem.current !== 'none') {
        const weatherIcon = WeatherSystem.types[WeatherSystem.current].name.split(' ')[0];
        ctx.fillText(weatherIcon, x - 100, y);
    }
    
    // 绘制Gateway状态
    ctx.font = '10px "Courier New"';
    const gatewayStatus = OpenClawGateway.getStatus();
    ctx.fillStyle = OpenClawGateway.connected ? COLORS.green : COLORS.orange;
    ctx.fillText(gatewayStatus, x - 180, y);
}

window.onload = init;
