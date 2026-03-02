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
let filteredCharacters = characters; // 任务筛选器使用的过滤后角色列表
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
    try {
        console.log('Initializing Snoopy Office...');
        canvas = document.getElementById('office');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        console.log('Canvas found:', canvas);
        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Context not available!');
            return;
        }
        console.log('Context initialized');
        
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
    
    try {
        update();
        render();
        
        // 更新通知
        TaskNotification.update();
        
        // 更新性能监控
        if (window.PerformanceMonitor) {
            PerformanceMonitor.update();
        }
        
        animationFrame++;
    } catch (e) {
        console.error('Game loop error:', e);
    }
    
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
    
    // 绘制任务筛选器 (Iteration 23)
    TaskFilter.draw();
    
    // 绘制自定义标记 (Iteration 23)
    CustomMarkers.draw();
    
    // 更新缩放系统
    ZoomSystem.update();
    
    // 更新跟随系统
    FollowSystem.update();
}

function drawZones() {
    // 绘制地板网格 (调试: 使用更亮的颜色)
    ctx.strokeStyle = '#444444';
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
    // 使用筛选后的角色列表
    const renderList = TaskFilter.show ? filteredCharacters : characters;
    renderList.forEach(char => {
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
    
    // 设置实际画布分辨率
    canvas.width = 800;
    canvas.height = 600;
    
    // 设置CSS显示大小
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
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[now.getDay()];
    document.getElementById('time').textContent = `📅 ${month}/${date}(${weekday}) 🕐 ${hours}:${minutes}`;
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

// ==================== 迭代23: 拖拽角色系统 ====================
const DragSystem = {
    enabled: true,
    dragging: null,
    dragOffset: { x: 0, y: 0 },
    
    start(e) {
        if (!this.enabled) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 检查是否点击了角色
        const clickedChar = characters.find(char => {
            const pos = getCharacterPosition(char);
            const charX = pos.x || getZoneCenter(char.zone).x;
            const charY = pos.y || getZoneCenter(char.zone).y;
            return Math.abs(x - charX) < 25 && Math.abs(y - charY) < 30;
        });
        
        if (clickedChar) {
            this.dragging = clickedChar;
            this.dragOffset = {
                x: x - (getCharacterPosition(clickedChar).x || getZoneCenter(clickedChar.zone).x),
                y: y - (getCharacterPosition(clickedChar).y || getZoneCenter(clickedChar.zone).y)
            };
            canvas.style.cursor = 'grabbing';
            AudioSystem.playSelect();
        }
    },
    
    move(e) {
        if (!this.dragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX - this.dragOffset.x;
        const y = (e.clientY - rect.top) * scaleY - this.dragOffset.y;
        
        // 更新角色位置
        characterPositions[this.dragging.id] = { x, y };
        
        // 自动检测区域
        for (const [zoneId, zone] of Object.entries(ZONES)) {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                this.dragging.zone = zoneId;
                break;
            }
        }
    },
    
    end() {
        if (this.dragging) {
            // 触发区域访问记录
            ZoneStats.recordVisit(this.dragging.zone);
            AudioSystem.playClick();
        }
        this.dragging = null;
        canvas.style.cursor = 'default';
    },
    
    toggle() {
        this.enabled = !this.enabled;
        console.log(`🎯 拖拽模式: ${this.enabled ? '开启' : '关闭'}`);
    }
};

// 绑定拖拽事件
canvas.addEventListener('mousedown', (e) => DragSystem.start(e));
document.addEventListener('mousemove', (e) => DragSystem.move(e));
document.addEventListener('mouseup', () => DragSystem.end());

// ==================== 迭代23: 任务筛选器 ====================
const TaskFilter = {
    active: false,
    filters: {
        status: 'all', // all, working, idle
        zone: 'all',
        role: 'all'
    },
    
    show: false,
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    },
    
    setStatus(status) {
        this.filters.status = status;
        this.updateFilteredCharacters();
    },
    
    setZone(zone) {
        this.filters.zone = zone;
        this.updateFilteredCharacters();
    },
    
    setRole(role) {
        this.filters.role = role;
        this.updateFilteredCharacters();
    },
    
    updateFilteredCharacters() {
        filteredCharacters = characters.filter(char => {
            if (this.filters.status !== 'all' && char.status !== this.filters.status) return false;
            if (this.filters.zone !== 'all' && char.zone !== this.filters.zone) return false;
            if (this.filters.role !== 'all' && char.role !== this.filters.role) return false;
            return true;
        });
    },
    
    draw() {
        if (!this.show) return;
        
        const panelWidth = 200;
        const panelHeight = 180;
        const panelX = canvas.width - panelWidth - 10;
        const panelY = 70;
        
        // 面板背景
        ctx.fillStyle = 'rgba(45, 45, 53, 0.95)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = COLORS.darkBlue;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 标题
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('🔍 任务筛选器', panelX + panelWidth / 2, panelY + 20);
        
        // 状态筛选
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.lightGray;
        ctx.fillText('状态:', panelX + 10, panelY + 45);
        
        const statusY = panelY + 60;
        ['all', 'working', 'idle'].forEach((status, i) => {
            const bx = panelX + 10 + i * 60;
            const label = status === 'all' ? '全部' : (status === 'working' ? '工作中' : '待命');
            
            ctx.fillStyle = this.filters.status === status ? COLORS.green : COLORS.darkGray;
            ctx.fillRect(bx, statusY, 50, 20);
            
            ctx.fillStyle = COLORS.white;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(label, bx + 25, statusY + 14);
        });
        
        // 角色筛选
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('角色:', panelX + 10, panelY + 100);
        
        const roleY = panelY + 115;
        const roles = ['all', 'pm', 'dev', 'qa', 'security', 'miner'];
        roles.forEach((role, i) => {
            const bx = panelX + 10 + (i % 3) * 60;
            const by = roleY + Math.floor(i / 3) * 22;
            const label = role === 'all' ? '全部' : role.toUpperCase();
            
            ctx.fillStyle = this.filters.role === role ? COLORS.blue : COLORS.darkGray;
            ctx.fillRect(bx, by, 50, 18);
            
            ctx.fillStyle = COLORS.white;
            ctx.font = '9px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(label, bx + 25, by + 13);
        });
        
        // 筛选结果计数
        this.updateFilteredCharacters();
        ctx.fillStyle = COLORS.orange;
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(`显示: ${filteredCharacters.length}/${characters.length}`, panelX + panelWidth / 2, panelY + panelHeight - 10);
    },
    
    handleClick(x, y) {
        if (!this.show) return false;
        
        const panelWidth = 200;
        const panelHeight = 180;
        const panelX = canvas.width - panelWidth - 10;
        const panelY = 70;
        
        // 检查点击区域
        if (x < panelX || x > panelX + panelWidth || 
            y < panelY || y > panelY + panelHeight) {
            return false;
        }
        
        // 状态筛选点击
        const statusY = panelY + 60;
        ['all', 'working', 'idle'].forEach((status, i) => {
            const bx = panelX + 10 + i * 60;
            if (x >= bx && x <= bx + 50 && y >= statusY && y <= statusY + 20) {
                this.filters.status = status;
                AudioSystem.playClick();
            }
        });
        
        // 角色筛选点击
        const roleY = panelY + 115;
        const roles = ['all', 'pm', 'dev', 'qa', 'security', 'miner'];
        roles.forEach((role, i) => {
            const bx = panelX + 10 + (i % 3) * 60;
            const by = roleY + Math.floor(i / 3) * 22;
            if (x >= bx && x <= bx + 50 && y >= by && y <= by + 18) {
                this.filters.role = role;
                AudioSystem.playClick();
            }
        });
        
        return true;
    }
};

// ==================== 迭代23: 渲染性能优化 ====================
const RenderOptimizer = {
    lastFrameTime: 0,
    frameCount: 0,
    fps: 60,
    targetFPS: 60,
    skipFrames: false,
    
    // 脏矩形跟踪
    dirtyRects: [],
    fullRedrawNeeded: true,
    
    init() {
        // 自适应帧率
        this.adaptiveFPS();
    },
    
    adaptiveFPS() {
        // 根据设备性能调整帧率
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.targetFPS = isMobile ? 30 : 60;
    },
    
    shouldRender(timestamp) {
        // 帧率限制
        const frameInterval = 1000 / this.targetFPS;
        const elapsed = timestamp - this.lastFrameTime;
        
        if (elapsed < frameInterval) {
            return false;
        }
        
        this.lastFrameTime = timestamp - (elapsed % frameInterval);
        return true;
    },
    
    markDirty(x, y, width, height) {
        this.dirtyRects.push({ x, y, width, height });
    },
    
    markFullRedraw() {
        this.fullRedrawNeeded = true;
        this.dirtyRects = [];
    },
    
    optimizeCharacterRender(char) {
        // 视锥剔除：只渲染可见角色
        const pos = getCharacterPosition(char);
        return pos.x > -50 && pos.x < canvas.width + 50 &&
               pos.y > -50 && pos.y < canvas.height + 50;
    }
};

// ==================== 迭代23: 自定义区域标记 ====================
const CustomMarkers = {
    markers: [],
    show: false,
    
    add(x, y, label, color = COLORS.yellow) {
        this.markers.push({ x, y, label, color, id: Date.now() });
        AudioSystem.playClick();
    },
    
    remove(id) {
        this.markers = this.markers.filter(m => m.id !== id);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    },
    
    draw() {
        if (!this.show) return;
        
        this.markers.forEach(marker => {
            // 绘制标记点
            ctx.fillStyle = marker.color;
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制标签
            ctx.fillStyle = COLORS.white;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(marker.label, marker.x, marker.y - 12);
        });
    },
    
    handleClick(x, y) {
        if (!this.show) return false;
        
        // 检查是否点击了标记
        for (const marker of this.markers) {
            const dist = Math.sqrt((x - marker.x) ** 2 + (y - marker.y) ** 2);
            if (dist < 15) {
                this.remove(marker.id);
                return true;
            }
        }
        
        return false;
    }
};

// ==================== 键盘快捷键更新 ====================
// 添加新的快捷键映射
const ITERATION23_SHORTCUTS = {
    'd': () => DragSystem.toggle(),
    'D': () => DragSystem.toggle(),
    'f': () => TaskFilter.toggle(),
    'F': () => TaskFilter.toggle(),
    ']': () => CustomMarkers.toggle(),
    'p': () => { if (!CommandPalette.show) CommandPalette.toggle(); } // 避免和Ctrl+P冲突
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, ITERATION23_SHORTCUTS);

// 更新 handleClick 以支持新功能
const originalHandleClick = handleClick;
handleClick = function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // 任务筛选器点击
    if (TaskFilter.handleClick(x, y)) return;
    
    // 自定义标记点击
    if (CustomMarkers.handleClick(x, y)) return;
    
    // 原有逻辑
    originalHandleClick(e);
};

// 双击添加标记
canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (CustomMarkers.show) {
        const label = prompt('输入标记名称:', '标记');
        if (label) {
            CustomMarkers.add(x, y, label);
        }
    }
});

// 按钮添加到 HTML
document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.querySelector('.status-bar');
    if (toolbar) {
        // 拖拽按钮
        const dragBtn = document.createElement('button');
        dragBtn.id = 'drag-toggle';
        dragBtn.className = 'sound-btn';
        dragBtn.textContent = '🎯';
        dragBtn.title = '拖拽角色 (D)';
        dragBtn.onclick = () => DragSystem.toggle();
        toolbar.insertBefore(dragBtn, toolbar.children[toolbar.children.length - 1]);
        
        // 筛选器按钮
        const filterBtn = document.createElement('button');
        filterBtn.id = 'filter-toggle';
        filterBtn.className = 'sound-btn';
        filterBtn.textContent = '🔍';
        filterBtn.title = '任务筛选器 (F)';
        filterBtn.onclick = () => TaskFilter.toggle();
        toolbar.insertBefore(filterBtn, toolbar.children[toolbar.children.length - 1]);
        
        // 标记按钮
        const markerBtn = document.createElement('button');
        markerBtn.id = 'marker-toggle';
        markerBtn.className = 'sound-btn';
        markerBtn.textContent = '📍';
        markerBtn.title = '自定义标记 (])';
        markerBtn.onclick = () => CustomMarkers.toggle();
        toolbar.insertBefore(markerBtn, toolbar.children[toolbar.children.length - 1]);
    }
});

// ==================== 迭代24: 数据持久化系统 ====================
const PersistenceSystem = {
    STORAGE_KEY: 'snoopy_office_data',
    
    // 保存所有用户数据
    save() {
        const data = {
            theme: ThemeSystem.current,
            timePeriod: TimeOfDaySystem.currentPeriod,
            weather: WeatherSystem.current,
            customMarkers: CustomMarkers.markers,
            customSkins: CharacterSkinSystem.customSkins,
            taskHistory: TaskTimeline.history.slice(0, 100), // 保存最近100条
            preferences: {
                soundEnabled: AudioSystem.enabled,
                showMinimap: MinimapSystem.enabled,
                showHeatmap: HeatmapSystem.show,
                showRankings: RankingSystem.show,
                followMode: FollowSystem.enabled
            },
            lastVisit: Date.now()
        };
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log('💾 数据已保存');
        } catch (e) {
            console.warn('保存失败:', e);
        }
    },
    
    // 加载用户数据
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) return false;
            
            const data = JSON.parse(stored);
            
            // 恢复主题
            if (data.theme) {
                ThemeSystem.current = data.theme;
                ThemeSystem.apply();
            }
            
            // 恢复时间
            if (data.timePeriod) {
                TimeOfDaySystem.currentPeriod = data.timePeriod;
            }
            
            // 恢复天气
            if (data.weather) {
                WeatherSystem.current = data.weather;
                if (data.weather !== 'none') {
                    WeatherSystem.active = true;
                    WeatherSystem.initParticles();
                }
            }
            
            // 恢复自定义标记
            if (data.customMarkers) {
                CustomMarkers.markers = data.customMarkers;
            }
            
            // 恢复自定义皮肤
            if (data.customSkins) {
                Object.assign(CharacterSkinSystem.customSkins, data.customSkins);
            }
            
            // 恢复任务历史
            if (data.taskHistory) {
                TaskTimeline.history = data.taskHistory;
            }
            
            // 恢复偏好设置
            if (data.preferences) {
                const p = data.preferences;
                if (typeof p.soundEnabled === 'boolean') AudioSystem.enabled = p.soundEnabled;
                if (typeof p.showMinimap === 'boolean') MinimapSystem.enabled = p.showMinimap;
                if (typeof p.showHeatmap === 'boolean') HeatmapSystem.show = p.showHeatmap;
                if (typeof p.showRankings === 'boolean') RankingSystem.show = p.showRankings;
                if (typeof p.followMode === 'boolean') FollowSystem.enabled = p.followMode;
            }
            
            console.log('📂 数据已加载');
            return true;
        } catch (e) {
            console.warn('加载失败:', e);
            return false;
        }
    },
    
    // 清除所有数据
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('🗑️ 数据已清除');
    },
    
    // 自动保存（每30秒）
    startAutoSave() {
        setInterval(() => this.save(), 30000);
    }
};

// ==================== 迭代24: 角色互动系统 ====================
const InteractionSystem = {
    show: false,
    interactions: [],
    
    // 角色对话
    say(charId, message, duration = 3000) {
        const char = characters.find(c => c.id === charId);
        if (!char) return;
        
        this.interactions.push({
            charId,
            message,
            startTime: Date.now(),
            duration,
            type: 'say'
        });
        
        // 播放对话音效
        AudioSystem.playSelect();
    },
    
    // 角色动作反馈
    react(charId, emotion, duration = 1500) {
        const char = characters.find(c => c.id === charId);
        if (!char) return;
        
        char.reaction = { emotion, startTime: Date.now(), duration };
    },
    
    // 绘制互动气泡
    draw() {
        this.interactions = this.interactions.filter(i => 
            Date.now() - i.startTime < i.duration
        );
        
        this.interactions.forEach(interaction => {
            const char = characters.find(c => c.id === interaction.charId);
            if (!char) return;
            
            const pos = getCharacterPosition(char);
            const bubbleX = pos.x;
            const bubbleY = pos.y - 40;
            
            // 气泡背景
            ctx.fillStyle = COLORS.white;
            ctx.strokeStyle = COLORS.black;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.roundRect(bubbleX - 60, bubbleY - 20, 120, 30, 5);
            ctx.fill();
            ctx.stroke();
            
            // 气泡文字
            ctx.fillStyle = COLORS.black;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            
            const text = interaction.message.length > 15 
                ? interaction.message.substring(0, 12) + '...' 
                : interaction.message;
            ctx.fillText(text, bubbleX, bubbleY + 5);
        });
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    }
};

// ==================== 迭代24: 团队协作可视化 ====================
const CollaborationSystem = {
    show: false,
    connections: [],
    
    // 检测团队协作关系
    detectCollaborations() {
        this.connections = [];
        
        // 查找在同一区域工作的角色
        const zones = {};
        
        characters.forEach(char => {
            const zone = getCharacterZone(char);
            if (!zones[zone]) zones[zone] = [];
            zones[zone].push(char);
        });
        
        // 为同一区域的创建连接
        Object.entries(zones).forEach(([zone, chars]) => {
            if (chars.length > 1) {
                for (let i = 0; i < chars.length - 1; i++) {
                    for (let j = i + 1; j < chars.length; j++) {
                        this.connections.push({
                            from: chars[i].id,
                            to: chars[j].id,
                            zone,
                            strength: this.calculateCollaborationStrength(chars[i], chars[j])
                        });
                    }
                }
            }
        });
    },
    
    // 计算协作强度
    calculateCollaborationStrength(char1, char2) {
        // 基于任务相似度和区域 proximity
        let strength = 0;
        
        // 任务类型相同
        if (char1.task && char2.task && char1.task.type === char2.task.type) {
            strength += 0.5;
        }
        
        // 都在开发/测试区
        const pos1 = getCharacterPosition(char1);
        const pos2 = getCharacterPosition(char2);
        const dist = Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
        
        if (dist < 100) strength += 0.5;
        
        return Math.min(1, strength);
    },
    
    // 绘制协作线
    draw() {
        if (!this.show) return;
        
        // 定期更新
        if (Math.random() < 0.02) {
            this.detectCollaborations();
        }
        
        this.connections.forEach(conn => {
            const fromChar = characters.find(c => c.id === conn.from);
            const toChar = characters.find(c => c.id === conn.to);
            
            if (!fromChar || !toChar) return;
            
            const fromPos = getCharacterPosition(fromChar);
            const toPos = getCharacterPosition(toChar);
            
            // 绘制连线
            const alpha = conn.strength * 0.5;
            ctx.strokeStyle = `rgba(0, 228, 54, ${alpha})`;
            ctx.lineWidth = 2 + conn.strength * 2;
            
            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(toPos.x, toPos.y);
            ctx.stroke();
            
            // 绘制协作强度指示
            if (conn.strength > 0.5) {
                const midX = (fromPos.x + toPos.x) / 2;
                const midY = (fromPos.y + toPos.y) / 2;
                
                ctx.fillStyle = COLORS.green;
                ctx.font = 'bold 10px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText('🤝', midX, midY);
            }
        });
    },
    
    toggle() {
        this.show = !this.show;
        if (this.show) {
            this.detectCollaborations();
        }
        AudioSystem.playClick();
    }
};

// ==================== 迭代24: 任务共享系统 ====================
const TaskSharingSystem = {
    show: false,
    sharedTasks: [],
    
    // 分享任务给其他角色
    shareTask(fromCharId, toCharId, task) {
        const sharedTask = {
            id: Date.now(),
            from: fromCharId,
            to: toCharId,
            task: { ...task },
            sharedAt: Date.now(),
            accepted: false
        };
        
        this.sharedTasks.push(sharedTask);
        
        // 通知目标角色
        const toChar = characters.find(c => c.id === toCharId);
        if (toChar) {
            InteractionSystem.say(toCharId, `收到新任务: ${task.name || task.description}`, 4000);
        }
        
        AudioSystem.playTaskComplete();
        return sharedTask;
    },
    
    // 接受共享任务
    acceptTask(shareId) {
        const shared = this.sharedTasks.find(s => s.id === shareId);
        if (shared) {
            shared.accepted = true;
            
            const toChar = characters.find(c => c.id === shared.to);
            if (toChar) {
                toChar.task = shared.task;
            }
            
            AudioSystem.playTaskComplete();
        }
    },
    
    // 绘制共享任务指示
    draw() {
        if (!this.show) return;
        
        this.sharedTasks.forEach(shared => {
            const toChar = characters.find(c => c.id === shared.to);
            if (!toChar) return;
            
            const pos = getCharacterPosition(toChar);
            
            // 闪烁的任务图标
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            
            ctx.fillStyle = shared.accepted 
                ? `rgba(0, 228, 54, ${pulse})` 
                : `rgba(255, 165, 0, ${pulse})`;
            
            ctx.beginPath();
            ctx.arc(pos.x + 20, pos.y - 30, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = COLORS.white;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('📤', pos.x + 20, pos.y - 26);
        });
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
    }
};

// ==================== 迭代24: 快捷键更新 ====================
const ITERATION24_SHORTCUTS = {
    'i': () => InteractionSystem.toggle(),
    'I': () => InteractionSystem.toggle(),
    'c': () => CollaborationSystem.toggle(),
    'C': () => CollaborationSystem.toggle(),
    's': () => TaskSharingSystem.toggle(),
    'S': () => TaskSharingSystem.toggle(),
    'Alt-s': () => PersistenceSystem.save()
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, ITERATION24_SHORTCUTS);

// ==================== 迭代25: 快捷键更新 ====================
const ITERATION25_SHORTCUTS = {
    'Alt-n': () => NotificationSystem.requestPermission(),  // 请求通知权限
    'Alt-p': () => { if (window.CanvasZoomSystem) CanvasZoomSystem.reset(); }  // 重置缩放
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, ITERATION25_SHORTCUTS);

// ==================== 按钮更新 ====================
// 更新 DOMContentLoaded 以添加新按钮
const originalDOMReady = document.addEventListener('DOMContentLoaded', () => {
    // 原有代码...
    const toolbar = document.querySelector('.status-bar');
    if (toolbar) {
        // ...原有按钮
        
        // 互动按钮
        const interactBtn = document.createElement('button');
        interactBtn.id = 'interact-toggle';
        interactBtn.className = 'sound-btn';
        interactBtn.textContent = '💬';
        interactBtn.title = '角色互动 (I)';
        interactBtn.onclick = () => InteractionSystem.toggle();
        toolbar.insertBefore(interactBtn, toolbar.children[toolbar.children.length - 1]);
        
        // 协作按钮
        const collabBtn = document.createElement('button');
        collabBtn.id = 'collab-toggle';
        collabBtn.className = 'sound-btn';
        collabBtn.textContent = '🔗';
        collabBtn.title = '团队协作 (C)';
        collabBtn.onclick = () => CollaborationSystem.toggle();
        toolbar.insertBefore(collabBtn, toolbar.children[toolbar.children.length - 1]);
        
        // 任务共享按钮
        const shareBtn = document.createElement('button');
        shareBtn.id = 'share-toggle';
        shareBtn.className = 'sound-btn';
        shareBtn.textContent = '📤';
        shareBtn.title = '任务共享 (S)';
        shareBtn.onclick = () => TaskSharingSystem.toggle();
        toolbar.insertBefore(shareBtn, toolbar.children[toolbar.children.length - 1]);
        
        // 保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.id = 'save-toggle';
        saveBtn.className = 'sound-btn';
        saveBtn.textContent = '💾';
        saveBtn.title = '保存设置 (Alt+S)';
        saveBtn.onclick = () => PersistenceSystem.save();
        toolbar.insertBefore(saveBtn, toolbar.children[toolbar.children.length - 1]);
    }
});

// ==================== 更新渲染循环 ====================
// 在主渲染循环中添加新系统的绘制
const originalRender = render;
render = function() {
    // 原有渲染
    originalRender();
    
    // 新系统渲染
    if (InteractionSystem.show) InteractionSystem.draw();
    if (CollaborationSystem.show) CollaborationSystem.draw();
    if (TaskSharingSystem.show) TaskSharingSystem.draw();
};

// ==================== 初始化时加载数据 ====================
const originalInit = init;
init = function() {
    originalInit();
    
    // 加载保存的数据
    PersistenceSystem.load();
    
    // 启动自动保存
    PersistenceSystem.startAutoSave();
    
    console.log('🔄 第24次迭代功能已加载');
};

// ==================== 初始化完成 ====================
window.onload = init;

// ==================== 迭代25: PWA支持 & 触摸手势 & 通知系统 ====================

// ==================== 触摸手势系统 ====================
const TouchGestureSystem = {
    enabled: 'ontouchstart' in window,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    doubleTapDelay: 300,
    lastTapTime: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    pinchStartDistance: 0,
    currentScale: 1,
    
    init() {
        if (!this.enabled) return;
        
        const canvas = document.getElementById('office');
        if (!canvas) return;
        
        // 单指点击
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // 双指缩放
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        
        // 防止默认滚动
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        console.log('👆 触摸手势系统已初始化');
    },
    
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
            this.isDragging = true;
            this.dragStartX = this.touchStartX;
            this.dragStartY = this.touchStartY;
        } else if (e.touches.length === 2) {
            // 双指缩放
            this.pinchStartDistance = this.getDistance(
                e.touches[0].clientX, e.touches[0].clientY,
                e.touches[1].clientX, e.touches[1].clientY
            );
        }
    },
    
    handleTouchMove(e) {
        if (e.touches.length === 2) {
            // 缩放处理
            const currentDistance = this.getDistance(
                e.touches[0].clientX, e.touches[0].clientY,
                e.touches[1].clientX, e.touches[1].clientY
            );
            
            if (this.pinchStartDistance > 0) {
                const scale = currentDistance / this.pinchStartDistance;
                const newScale = Math.max(0.5, Math.min(3, this.currentScale * scale));
                
                // 应用缩放
                if (window.CanvasZoomSystem) {
                    CanvasZoomSystem.setScale(newScale);
                }
                
                this.pinchStartDistance = currentDistance;
            }
        }
    },
    
    handleTouchEnd(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        const touchDistance = this.getDistance(
            this.touchStartX, this.touchStartY,
            this.dragStartX, this.dragStartY
        );
        
        // 检测双击
        const now = Date.now();
        if (now - this.lastTapTime < this.doubleTapTime) {
            // 双击 - 复位缩放
            if (window.CanvasZoomSystem) {
                CanvasZoomSystem.reset();
            }
            this.lastTapTime = 0;
            return;
        }
        this.lastTapTime = now;
        
        // 检测点击 vs 拖拽
        if (touchDuration < 300 && touchDistance < 10) {
            // 短按 - 点击角色
            const canvas = document.getElementById('office');
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const x = (e.changedTouches[0].clientX - rect.left) * scaleX;
            const y = (e.changedTouches[0].clientY - rect.top) * scaleY;
            
            handleCanvasClick(x, y);
        }
        
        this.isDragging = false;
    },
    
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    get doubleTapTime() {
        return this.doubleTapDelay;
    }
};

// ==================== 通知系统 ====================
const NotificationSystem = {
    permission: 'default',
    enabled: false,
    taskNotifications: new Map(),
    
    init() {
        if (!('Notification' in window)) {
            console.warn('通知系统不可用');
            return;
        }
        
        this.permission = Notification.permission;
        this.enabled = this.permission === 'granted';
        
        if (this.permission === 'default') {
            // 延迟请求权限，让用户先交互
            setTimeout(() => this.requestPermission(), 3000);
        }
    },
    
    requestPermission() {
        if (this.permission !== 'default') return;
        
        Notification.requestPermission().then(permission => {
            this.permission = permission;
            this.enabled = permission === 'granted';
            console.log('通知权限:', permission);
            
            if (this.enabled) {
                this.send('Snoopy-Office', '通知系统已启用！🔔');
            }
        });
    },
    
    send(title, body, icon = '/icon-192.png', tag = 'snoopy-office') {
        if (!this.enabled) return false;
        
        try {
            new Notification(title, {
                body: body,
                icon: icon,
                badge: '/icon-192.png',
                tag: tag,
                requireInteraction: false,
                vibrate: [100, 50, 100]
            });
            return true;
        } catch (e) {
            console.warn('发送通知失败:', e);
            return false;
        }
    },
    
    // 任务状态变化通知
    onTaskChange(character, oldTask, newTask) {
        if (!this.enabled || character.id === 'ai') return;
        
        // 避免重复通知
        const key = `${character.id}-${newTask.id}`;
        if (this.taskNotifications.has(key)) return;
        
        let message = '';
        if (newTask.status === 'working') {
            message = `${character.name} 开始新任务: ${newTask.name}`;
            this.send('任务开始', message, '/icon-192.png', `task-${character.id}`);
        } else if (newTask.status === 'completed') {
            message = `${character.name} 完成任务: ${newTask.name}`;
            this.send('✅ 任务完成', message, '/icon-192.png', `task-${character.id}`);
            this.taskNotifications.set(key, true);
            
            // 清理旧通知记录
            setTimeout(() => this.taskNotifications.delete(key), 60000);
        }
    },
    
    // 角色状态变化通知
    onStatusChange(character, oldStatus, newStatus) {
        if (!this.enabled) return;
        
        if (oldStatus === 'idle' && newStatus === 'working') {
            this.send('💼 开始工作', `${character.name} 开始工作了`, '/icon-192.png', `status-${character.id}`);
        } else if (oldStatus === 'working' && newStatus === 'idle') {
            this.send('✅ 休息一下', `${character.name} 休息了`, '/icon-192.png', `status-${character.id}`);
        }
    }
};

// ==================== PWA 离线检测 ====================
const NetworkStatusSystem = {
    online: true,
    
    init() {
        this.online = navigator.onLine;
        
        window.addEventListener('online', () => {
            this.online = true;
            this.updateStatusUI();
            console.log('🟢 网络已连接');
            
            // 同步数据
            if (window.PersistenceSystem) {
                PersistenceSystem.sync();
            }
        });
        
        window.addEventListener('offline', () => {
            this.online = false;
            this.updateStatusUI();
            console.log('🔴 网络已断开');
        });
    },
    
    updateStatusUI() {
        const statusEl = document.getElementById('connection');
        if (statusEl) {
            statusEl.textContent = this.online ? '🟢 已连接' : '🔴 离线';
            statusEl.className = this.online ? '' : 'offline';
        }
    },
    
    isOnline() {
        return this.online;
    }
};

// ==================== 更新原初始化函数 ====================
const originalDOMReady25 = document.addEventListener('DOMContentLoaded', () => {
    // 原有代码...
    
    // 初始化新系统
    TouchGestureSystem.init();
    NotificationSystem.init();
    NetworkStatusSystem.init();
    
    // 更新工具栏添加通知按钮
    const toolbar = document.querySelector('.status-bar');
    if (toolbar) {
        // 通知权限按钮
        const notifyBtn = document.createElement('button');
        notifyBtn.id = 'notify-toggle';
        notifyBtn.className = 'sound-btn';
        notifyBtn.textContent = '🔔';
        notifyBtn.title = '启用通知';
        notifyBtn.onclick = () => {
            NotificationSystem.requestPermission();
        };
        toolbar.insertBefore(notifyBtn, toolbar.children[toolbar.children.length - 1]);
        
        // PWA 安装按钮（仅显示一次）
        if ('serviceWorker' in navigator && navigator.standalone === false) {
            const installBtn = document.createElement('button');
            installBtn.id = 'pwa-install';
            installBtn.className = 'sound-btn';
            installBtn.textContent = '📲';
            installBtn.title = '安装应用到桌面';
            installBtn.onclick = () => {
                // 提示安装 PWA
                if (confirm('是否将 Snoopy-Office 安装到桌面？')) {
                    requestNotificationPermission();
                }
            };
            toolbar.insertBefore(installBtn, toolbar.children[toolbar.children.length - 1]);
        }
    }
});

// 合并到 init
const originalInit25 = init;
init = function() {
    originalInit25();
    
    console.log('🔄 第25次迭代功能已加载: PWA + 触摸 + 通知');
};

// ==================== 迭代26: 性能优化 & 社交功能 & 数据导出 ====================

// ==================== 性能监控系统 ====================
const PerformanceMonitor = {
    fps: 60,
    frameCount: 0,
    lastTime: performance.now(),
    fpsHistory: [],
    maxHistory: 60,
    lowFpsCount: 0,
    targetFps: 60,
    autoAdjust: true,
    
    init() {
        this.lastTime = performance.now();
        console.log('📊 性能监控系统已初始化');
    },
    
    update() {
        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastTime;
        
        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > this.maxHistory) {
                this.fpsHistory.shift();
            }
            
            this.frameCount = 0;
            this.lastTime = now;
            
            // 低帧率检测
            if (this.fps < 30) {
                this.lowFpsCount++;
                if (this.lowFpsCount >= 3 && this.autoAdjust) {
                    this.autoReduceQuality();
                }
            } else {
                this.lowFpsCount = 0;
            }
            
            // 更新UI
            this.updateStatsUI();
        }
    },
    
    getAverageFps() {
        if (this.fpsHistory.length === 0) return 60;
        return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
    },
    
    autoReduceQuality() {
        // 自动降低渲染质量
        if (window.CanvasZoomSystem) {
            const currentScale = CanvasZoomSystem.getScale();
            if (currentScale > 1) {
                CanvasZoomSystem.setScale(Math.max(1, currentScale - 0.2));
            }
        }
        
        // 减少粒子效果
        if (window.WeatherSystem && WeatherSystem.active) {
            WeatherSystem.particles = WeatherSystem.particles.slice(0, 30);
        }
        
        console.log('⚡ 自动降低渲染质量以提升性能');
    },
    
    updateStatsUI() {
        const fpsEl = document.getElementById('stat-fps');
        if (!fpsEl) {
            // 创建FPS显示元素
            const statsPanel = document.querySelector('.stats-panel');
            if (statsPanel) {
                const fpsRow = document.createElement('div');
                fpsRow.className = 'stat-row';
                fpsRow.innerHTML = `<span class="stat-label">FPS:</span><span class="stat-value" id="stat-fps">${this.fps}</span>`;
                statsPanel.appendChild(fpsRow);
            }
        } else {
            fpsEl.textContent = this.fps;
        }
    },
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
        }
        return null;
    }
};

// ==================== 成就系统 ====================
const AchievementSystem = {
    achievements: [
        { id: 'first_task', name: '初试牛刀', desc: '完成第一个任务', icon: '🎯', condition: (stats) => stats.totalCompleted >= 1 },
        { id: 'ten_tasks', name: '小试身手', desc: '完成10个任务', icon: '💪', condition: (stats) => stats.totalCompleted >= 10 },
        { id: 'hundred_tasks', name: '功勋卓著', desc: '完成100个任务', icon: '🏆', condition: (stats) => stats.totalCompleted >= 100 },
        { id: 'early_bird', name: '早起鸟', desc: '在早晨完成任务', icon: '🌅', condition: (stats) => stats.earlyBird },
        { id: 'night_owl', name: '夜猫子', desc: '在深夜完成任务', icon: '🦉', condition: (stats) => stats.nightOwl },
        { id: 'team_player', name: '团队协作', desc: '所有角色同时工作', icon: '🤝', condition: (stats) => stats.maxWorking >= 8 },
        { id: 'speed_demon', name: '闪电侠', desc: '完成任务速度最快', icon: '⚡', condition: (stats) => stats.fastestTask < 30 },
        { id: 'explorer', name: '探索者', desc: '访问所有区域', icon: '🗺️', condition: (stats) => stats.zonesVisited >= 10 },
        { id: 'streak_3', name: '坚持不懈', desc: '连续3天使用', icon: '🔥', condition: (stats) => stats.streak >= 3 },
        { id: 'streak_7', name: '一周坚持', desc: '连续7天使用', icon: '💎', condition: (stats) => stats.streak >= 7 }
    ],
    unlocked: new Set(),
    stats: {
        totalCompleted: 0,
        earlyBird: false,
        nightOwl: false,
        maxWorking: 0,
        fastestTask: Infinity,
        zonesVisited: new Set(),
        streak: 0,
        lastVisit: null
    },
    
    init() {
        // 加载已解锁的成就
        const saved = localStorage.getItem('snoopy-achievements');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.unlocked = new Set(data.unlocked || []);
                this.stats = { ...this.stats, ...data.stats };
                if (data.stats?.zonesVisited) {
                    this.stats.zonesVisited = new Set(data.stats.zonesVisited);
                }
            } catch (e) {
                console.warn('加载成就数据失败:', e);
            }
        }
        
        // 更新连续访问
        this.updateStreak();
        
        console.log('🏅 成就系统已初始化');
    },
    
    save() {
        const data = {
            unlocked: Array.from(this.unlocked),
            stats: {
                ...this.stats,
                zonesVisited: Array.from(this.stats.zonesVisited)
            }
        };
        localStorage.setItem('snoopy-achievements', JSON.stringify(data));
    },
    
    updateStreak() {
        const today = new Date().toDateString();
        const lastVisit = this.stats.lastVisit;
        
        if (lastVisit === today) {
            return; // 今天已经访问过
        }
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastVisit === yesterday) {
            this.stats.streak++;
        } else if (lastVisit !== today) {
            this.stats.streak = 1;
        }
        
        this.stats.lastVisit = today;
        this.save();
    },
    
    check(character, task) {
        if (!task || task.status !== 'completed') return;
        
        // 更新统计
        this.stats.totalCompleted++;
        
        // 检查时间相关成就
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 9) this.stats.earlyBird = true;
        if (hour >= 22 || hour < 5) this.stats.nightOwl = true;
        
        // 检查任务速度
        if (task.duration && task.duration < this.stats.fastestTask) {
            this.stats.fastestTask = task.duration;
        }
        
        // 检查区域访问
        if (task.zone) {
            this.stats.zonesVisited.add(task.zone);
        }
        
        // 检查同时工作人数
        const workingCount = characters.filter(c => c.status === 'working').length;
        if (workingCount > this.stats.maxWorking) {
            this.stats.maxWorking = workingCount;
        }
        
        // 检查成就解锁
        this.achievements.forEach(ach => {
            if (!this.unlocked.has(ach.id) && ach.condition(this.stats)) {
                this.unlock(ach);
            }
        });
        
        this.save();
    },
    
    unlock(achievement) {
        this.unlocked.add(achievement.id);
        
        // 显示通知
        if (window.NotificationSystem && NotificationSystem.enabled) {
            NotificationSystem.send('🏅 成就解锁！', `${achievement.icon} ${achievement.name}: ${achievement.desc}`, '/icon-192.png', 'achievement');
        }
        
        // 显示成就弹窗
        this.showUnlockPopup(achievement);
        
        console.log(`🏅 成就解锁: ${achievement.name}`);
    },
    
    showUnlockPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">🏅 成就解锁！</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 添加样式
        if (!document.getElementById('achievement-styles')) {
            const style = document.createElement('style');
            style.id = 'achievement-styles';
            style.textContent = `
                .achievement-popup {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ffd700, #ffaa00);
                    color: #333;
                    padding: 16px 24px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    animation: achievementSlideIn 0.5s ease-out, achievementFadeOut 0.5s ease-in 3s forwards;
                    z-index: 10000;
                }
                .achievement-icon {
                    font-size: 40px;
                }
                .achievement-title {
                    font-size: 12px;
                    opacity: 0.8;
                }
                .achievement-name {
                    font-size: 18px;
                    font-weight: bold;
                }
                .achievement-desc {
                    font-size: 12px;
                    opacity: 0.8;
                }
                @keyframes achievementSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes achievementFadeOut {
                    to { opacity: 0; transform: translateY(20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 3秒后移除
        setTimeout(() => popup.remove(), 3500);
    },
    
    showPanel() {
        const panel = document.createElement('div');
        panel.id = 'achievement-panel';
        panel.className = 'panel';
        
        let html = `
            <div class="panel-header">
                <h2>🏅 成就</h2>
                <button class="close-btn" onclick="this.closest('.panel').remove()">×</button>
            </div>
            <div class="panel-content achievement-list">
        `;
        
        this.achievements.forEach(ach => {
            const unlocked = this.unlocked.has(ach.id);
            html += `
                <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${unlocked ? ach.icon : '🔒'}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${ach.name}</div>
                        <div class="achievement-desc">${ach.desc}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // 添加样式
        if (!document.getElementById('achievement-panel-styles')) {
            const style = document.createElement('style');
            style.id = 'achievement-panel-styles';
            style.textContent = `
                .achievement-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .achievement-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-bottom: 1px solid var(--border);
                    opacity: 0.5;
                }
                .achievement-item.unlocked {
                    opacity: 1;
                    background: rgba(255, 215, 0, 0.1);
                }
                .achievement-item .achievement-icon {
                    font-size: 32px;
                }
                .achievement-item .achievement-name {
                    font-weight: bold;
                    color: var(--text-primary);
                }
                .achievement-item .achievement-desc {
                    font-size: 12px;
                    color: var(--text-secondary);
                }
            `;
            document.head.appendChild(style);
        }
        
        panel.innerHTML = html;
        document.querySelector('main').appendChild(panel);
    },
    
    toggle() {
        const existing = document.getElementById('achievement-panel');
        if (existing) {
            existing.remove();
        } else {
            this.showPanel();
        }
        AudioSystem.playClick();
    }
};

// ==================== 每日挑战系统 ====================
const DailyChallengeSystem = {
    challenges: [
        { id: 'complete_5', name: '日理万机', desc: '完成5个任务', target: 5, type: 'complete' },
        { id: 'all_working', name: '全员出动', desc: '让所有角色同时工作', target: 8, type: 'simultaneous' },
        { id: 'zone_visit', name: '跑马观花', desc: '访问5个不同区域', target: 5, type: 'zones' },
        { id: 'focus_time', name: '专注时刻', desc: '持续工作30分钟', target: 30, type: 'focus' },
        { id: 'no_idle', name: '拒绝摸鱼', desc: '2小时内没有角色空闲', target: 120, type: 'no_idle' }
    ],
    todayProgress: {},
    lastDate: null,
    
    init() {
        this.load();
        
        // 检查是否新的一天
        const today = new Date().toDateString();
        if (this.lastDate !== today) {
            this.resetDaily();
        }
        
        console.log('🎯 每日挑战系统已初始化');
    },
    
    load() {
        const saved = localStorage.getItem('snoopy-daily-challenges');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.todayProgress = data.progress || {};
                this.lastDate = data.date;
            } catch (e) {
                console.warn('加载每日挑战数据失败:', e);
            }
        }
    },
    
    save() {
        localStorage.setItem('snoopy-daily-challenges', JSON.stringify({
            progress: this.todayProgress,
            date: new Date().toDateString()
        }));
    },
    
    resetDaily() {
        this.todayProgress = {};
        this.challenges.forEach(c => {
            this.todayProgress[c.id] = 0;
        });
        this.lastDate = new Date().toDateString();
        this.save();
    },
    
    update(type, value = 1) {
        const today = new Date().toDateString();
        if (this.lastDate !== today) {
            this.resetDaily();
        }
        
        // 更新相关挑战进度
        this.challenges.forEach(c => {
            if (c.type === type || (type === 'complete' && c.type === 'complete')) {
                if (!this.todayProgress[c.id]) this.todayProgress[c.id] = 0;
                this.todayProgress[c.id] += value;
                
                // 检查完成
                if (this.todayProgress[c.id] >= c.target && !this.isCompleted(c.id)) {
                    this.onComplete(c);
                }
            }
        });
        
        this.save();
        this.updateUI();
    },
    
    isCompleted(id) {
        return localStorage.getItem(`snoopy-challenge-${id}-${this.lastDate}`) === 'true';
    },
    
    onComplete(challenge) {
        localStorage.setItem(`snoopy-challenge-${challenge.id}-${this.lastDate}`, 'true');
        
        if (NotificationSystem && NotificationSystem.enabled) {
            NotificationSystem.send('🎯 每日挑战完成！', `${challenge.name}: ${challenge.desc}`, '/icon-192.png', 'challenge');
        }
        
        console.log(`🎯 每日挑战完成: ${challenge.name}`);
    },
    
    updateUI() {
        let panel = document.getElementById('daily-challenge-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'daily-challenge-panel';
            panel.className = 'panel';
            
            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                #daily-challenge-panel {
                    position: absolute;
                    top: 70px;
                    right: 10px;
                    width: 220px;
                    z-index: 100;
                }
                .challenge-item {
                    padding: 8px;
                    margin: 4px 0;
                    background: var(--bg-panel);
                    border-radius: 6px;
                    font-size: 12px;
                }
                .challenge-item.completed {
                    background: rgba(0, 228, 54, 0.2);
                    border: 1px solid #00e436;
                }
                .challenge-progress {
                    height: 4px;
                    background: var(--border);
                    border-radius: 2px;
                    margin-top: 4px;
                }
                .challenge-progress-fill {
                    height: 100%;
                    background: #00e436;
                    border-radius: 2px;
                    transition: width 0.3s;
                }
            `;
            document.head.appendChild(style);
            
            document.querySelector('main').appendChild(panel);
        }
        
        let html = `
            <div class="panel-header">
                <h2>🎯 今日挑战</h2>
                <button class="close-btn" onclick="this.closest('.panel').remove()">×</button>
            </div>
            <div class="panel-content">
        `;
        
        this.challenges.forEach(c => {
            const progress = this.todayProgress[c.id] || 0;
            const completed = progress >= c.target;
            const percent = Math.min(100, (progress / c.target) * 100);
            
            html += `
                <div class="challenge-item ${completed ? 'completed' : ''}">
                    <div>${c.name} ${completed ? '✅' : ''}</div>
                    <div style="opacity: 0.6; font-size: 10px;">${c.desc}</div>
                    <div class="challenge-progress">
                        <div class="challenge-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div style="font-size: 10px; text-align: right;">${progress}/${c.target}</div>
                </div>
            `;
        });
        
        html += '</div>';
        panel.innerHTML = html;
    },
    
    toggle() {
        const panel = document.getElementById('daily-challenge-panel');
        if (panel) {
            panel.remove();
        } else {
            this.updateUI();
        }
        AudioSystem.playClick();
    }
};

// ==================== 数据导出系统 ====================
const DataExportSystem = {
    exportData: null,
    
    init() {
        console.log('📦 数据导出系统已初始化');
    },
    
    // 收集所有数据
    collectData() {
        const data = {
            exportDate: new Date().toISOString(),
            summary: {
                totalCharacters: characters.length,
                totalTasks: CharacterSystem.taskHistory.length,
                totalZones: Object.keys(ZONES).length
            },
            characters: characters.map(c => ({
                id: c.id,
                name: c.name,
                role: c.role,
                status: c.status,
                currentTask: c.currentTask?.name || null,
                taskCount: CharacterSystem.taskHistory.filter(t => t.characterId === c.id).length,
                zones: [...new Set(CharacterSystem.taskHistory.filter(t => t.characterId === c.id).map(t => t.zone))]
            })),
            tasks: CharacterSystem.taskHistory.map(t => ({
                ...t,
                timestamp: t.timestamp?.toISOString()
            })),
            achievements: {
                unlocked: Array.from(AchievementSystem.unlocked),
                stats: {
                    ...AchievementSystem.stats,
                    zonesVisited: Array.from(AchievementSystem.stats.zonesVisited)
                }
            },
            dailyChallenges: DailyChallengeSystem.todayProgress,
            performance: {
                averageFps: PerformanceMonitor.getAverageFps(),
                memory: PerformanceMonitor.getMemoryUsage()
            }
        };
        
        return data;
    },
    
    // 导出JSON
    exportJSON() {
        const data = this.collectData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `snoopy-office-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📦 已导出JSON数据');
        if (NotificationSystem && NotificationSystem.enabled) {
            NotificationSystem.send('📦 数据已导出', 'JSON文件下载开始', '/icon-192.png', 'export');
        }
    },
    
    // 生成工作摘要报告
    generateReport() {
        const data = this.collectData();
        const today = new Date().toLocaleDateString('zh-CN');
        
        // 计算统计数据
        const completedTasks = data.tasks.filter(t => t.status === 'completed');
        const workingCharacters = data.characters.filter(c => c.status === 'working');
        
        let report = `# 📊 Snoopy-Office 工作摘要

**生成时间**: ${today}
**导出时间**: ${data.exportDate}

---

## 📈 概览

- **角色总数**: ${data.summary.totalCharacters}
- **今日完成任务**: ${completedTasks.length}
- **当前工作中**: ${workingCharacters.length}
- **访问区域数**: ${data.achievements.stats.zonesVisited?.size || 0}

---

## 👥 角色状态

| 角色 | 状态 | 任务数 | 当前任务 |
|------|------|--------|----------|
${data.characters.map(c => `| ${c.name} | ${c.status === 'working' ? '💼 工作' : '😴 待命'} | ${c.taskCount} | ${c.currentTask || '-'} |`).join('\n')}

---

## 🏅 成就进度

- **已解锁**: ${data.achievements.unlocked.length} / ${AchievementSystem.achievements.length}
- **完成任务总数**: ${data.achievements.stats.totalCompleted}
- **连续访问**: ${data.achievements.stats.streak} 天

---

## 🎯 今日挑战

${DailyChallengeSystem.challenges.map(c => {
    const progress = data.dailyChallenges[c.id] || 0;
    const completed = progress >= c.target;
    return `- [${completed ? 'x' : ' '}] ${c.name}: ${progress}/${c.target}`;
}).join('\n')}

---

## 📊 性能数据

- **平均FPS**: ${data.performance.averageFps}
- **内存使用**: ${data.performance.memory ? `${data.performance.memory.used}MB / ${data.performance.memory.total}MB` : '不支持'}

---

*由 Snoopy-Office 自动生成*
`;
        
        return report;
    },
    
    // 导出Markdown报告
    exportReport() {
        const report = this.generateReport();
        const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `snoopy-office-report-${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📊 已导出工作报告');
        if (NotificationSystem && NotificationSystem.enabled) {
            NotificationSystem.send('📊 报告已生成', 'Markdown文件下载开始', '/icon-192.png', 'export');
        }
    },
    
    // 分享数据（生成可分享的链接）
    async share() {
        const data = this.collectData();
        
        // 使用JSONBin.io或类似的免费JSON存储服务
        // 这里我们使用data:URI生成一个临时的分享
        const json = JSON.stringify(data);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        
        // 复制到剪贴板
        try {
            await navigator.clipboard.writeText(`Snoopy-Office 数据: ${encoded.substring(0, 50)}...`);
            console.log('📋 数据已复制到剪贴板');
            alert('数据已复制到剪贴板！');
        } catch (e) {
            console.error('复制失败:', e);
        }
    },
    
    // 显示导出面板
    showPanel() {
        const panel = document.createElement('div');
        panel.id = 'export-panel';
        panel.className = 'panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>📦 数据导出</h2>
                <button class="close-btn" onclick="this.closest('.panel').remove()">×</button>
            </div>
            <div class="panel-content">
                <button class="sound-btn" onclick="DataExportSystem.exportJSON()">📋 导出JSON</button>
                <button class="sound-btn" onclick="DataExportSystem.exportReport()">📊 导出报告</button>
                <button class="sound-btn" onclick="DataExportSystem.share()">🔗 分享数据</button>
            </div>
        `;
        
        document.querySelector('main').appendChild(panel);
    },
    
    toggle() {
        const panel = document.getElementById('export-panel');
        if (panel) {
            panel.remove();
        } else {
            this.showPanel();
        }
        AudioSystem.playClick();
    }
};

// ==================== 增强任务完成检测 ====================
const originalCheckTaskComplete = function(character) {
    // 原有的任务完成检测逻辑
    if (character.currentTask && character.currentTask.status === 'working') {
        character.currentTask.progress += 0.5 * speed;
        
        if (character.currentTask.progress >= 100) {
            character.currentTask.status = 'completed';
            character.currentTask.completedAt = new Date();
            
            // 完成任务
            CharacterSystem.addTaskHistory(character, {
                ...character.currentTask,
                status: 'completed',
                completedAt: new Date().toISOString()
            });
            
            // 成就系统检测
            if (window.AchievementSystem) {
                AchievementSystem.check(character, character.currentTask);
            }
            
            // 每日挑战检测
            if (window.DailyChallengeSystem) {
                DailyChallengeSystem.update('complete');
            }
            
            // 播放完成音效
            AudioSystem.playTaskComplete();
            
            // 烟花效果
            if (window.FireworkSystem) {
                FireworkSystem.create(character.x, character.y);
            }
            
            // 设置下一个任务
            setTimeout(() => {
                if (character.status === 'working') {
                    CharacterSystem.assignTask(character);
                }
            }, 1000);
            
            return true;
        }
    }
    return false;
};

// 覆盖原有的任务完成检测
if (typeof checkTaskComplete === 'function') {
    window.originalCheckTaskComplete = checkTaskComplete;
    checkTaskComplete = function(character) {
        const result = originalCheckTaskComplete(character);
        if (result && window.AchievementSystem) {
            AchievementSystem.check(character, character.currentTask);
        }
        return result;
    };
}

// ==================== 更新初始化函数 ====================
const originalInit26 = init;
init = function() {
    originalInit26();
    
    // 初始化第26次迭代系统
    PerformanceMonitor.init();
    AchievementSystem.init();
    DailyChallengeSystem.init();
    DataExportSystem.init();
    
    console.log('🔄 第26次迭代功能已加载: 性能监控 + 成就系统 + 每日挑战 + 数据导出');
};

// ==================== 用户反馈系统 ====================
const FeedbackSystem = {
    panel: null,
    isVisible: false,
    
    init: function() {
        this.createPanel();
        this.bindKeyboard();
    },
    
    createPanel: function() {
        const panel = document.createElement('div');
        panel.id = 'feedback-panel';
        panel.className = 'panel hidden';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>💬 反馈建议</h2>
                <button class="close-btn" onclick="FeedbackSystem.hide()">×</button>
            </div>
            <div class="panel-content">
                <div class="feedback-type">
                    <label>反馈类型:</label>
                    <select id="feedback-type">
                        <option value="bug">🐛 报告问题</option>
                        <option value="feature">✨ 功能建议</option>
                        <option value="improvement">💡 改进意见</option>
                        <option value="other">💬 其他</option>
                    </select>
                </div>
                <div class="feedback-content">
                    <label>详细内容:</label>
                    <textarea id="feedback-text" placeholder="请描述您的建议或问题..." rows="5"></textarea>
                </div>
                <div class="feedback-contact">
                    <label>联系方式 (可选):</label>
                    <input type="text" id="feedback-contact" placeholder="邮箱或其他联系方式">
                </div>
                <div class="feedback-actions">
                    <button class="sound-btn" onclick="FeedbackSystem.submit()">📨 提交反馈</button>
                    <button class="sound-btn" onclick="FeedbackSystem.hide()">取消</button>
                </div>
                <div class="feedback-history">
                    <h3>历史反馈</h3>
                    <div id="feedback-list"></div>
                </div>
            </div>
        `;
        document.querySelector('main').appendChild(panel);
        this.panel = panel;
        this.loadHistory();
    },
    
    bindKeyboard: function() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'q' || e.key === 'Q') {
                if (!e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.toggle();
                }
            }
        });
    },
    
    toggle: function() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    show: function() {
        if (this.panel) {
            this.panel.classList.remove('hidden');
            this.isVisible = true;
            playSound('click');
        }
    },
    
    hide: function() {
        if (this.panel) {
            this.panel.classList.add('hidden');
            this.isVisible = false;
        }
    },
    
    submit: function() {
        const type = document.getElementById('feedback-type').value;
        const text = document.getElementById('feedback-text').value.trim();
        const contact = document.getElementById('feedback-contact').value.trim();
        
        if (!text) {
            alert('请输入反馈内容');
            return;
        }
        
        const feedback = {
            id: Date.now(),
            type: type,
            text: text,
            contact: contact,
            timestamp: new Date().toISOString()
        };
        
        // 保存到localStorage
        const history = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
        history.unshift(feedback);
        localStorage.setItem('feedbackHistory', JSON.stringify(history.slice(0, 10)));
        
        // 显示成功消息
        alert('感谢您的反馈！🎉');
        
        // 清空表单
        document.getElementById('feedback-text').value = '';
        document.getElementById('feedback-contact').value = '';
        
        // 刷新历史记录
        this.loadHistory();
        
        playSound('success');
    },
    
    loadHistory: function() {
        const history = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
        const list = document.getElementById('feedback-list');
        
        if (!list) return;
        
        if (history.length === 0) {
            list.innerHTML = '<p class="empty-message">暂无反馈记录</p>';
            return;
        }
        
        list.innerHTML = history.map(f => `
            <div class="feedback-item">
                <div class="feedback-item-header">
                    <span class="feedback-type-badge">${this.getTypeLabel(f.type)}</span>
                    <span class="feedback-time">${new Date(f.timestamp).toLocaleDateString()}</span>
                </div>
                <p class="feedback-item-text">${f.text}</p>
            </div>
        `).join('');
    },
    
    getTypeLabel: function(type) {
        const labels = {
            bug: '🐛 问题',
            feature: '✨ 建议',
            improvement: '💡 改进',
            other: '💬 其他'
        };
        return labels[type] || '💬 其他';
    }
};

// 添加CSS样式
const feedbackStyle = document.createElement('style');
feedbackStyle.textContent = `
    #feedback-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;
    }
    
    .feedback-type, .feedback-content, .feedback-contact {
        margin-bottom: 15px;
    }
    
    .feedback-type label, .feedback-content label, .feedback-contact label {
        display: block;
        margin-bottom: 5px;
        color: var(--text);
        font-weight: bold;
    }
    
    #feedback-type, #feedback-text, #feedback-contact {
        width: 100%;
        padding: 8px;
        border: 2px solid var(--border);
        border-radius: 4px;
        background: var(--bg);
        color: var(--text);
        font-family: inherit;
    }
    
    #feedback-text {
        resize: vertical;
        min-height: 100px;
    }
    
    .feedback-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }
    
    .feedback-history h3 {
        margin: 15px 0 10px;
        color: var(--text);
        border-bottom: 1px solid var(--border);
        padding-bottom: 5px;
    }
    
    .feedback-item {
        padding: 10px;
        background: var(--bg);
        border-radius: 4px;
        margin-bottom: 10px;
    }
    
    .feedback-item-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }
    
    .feedback-type-badge {
        font-size: 0.8rem;
        padding: 2px 6px;
        background: var(--accent);
        border-radius: 3px;
    }
    
    .feedback-time {
        font-size: 0.75rem;
        color: var(--text-muted);
    }
    
    .feedback-item-text {
        font-size: 0.85rem;
        color: var(--text);
        margin: 0;
    }
    
    .empty-message {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
    }
`;
document.head.appendChild(feedbackStyle);

// ==================== 迭代28: 角色互动小游戏 ====================
const CharInteraction = {
    active: false,
    selectedChars: [],
    gameMode: null, // 'quiz', 'race', 'chat'
    quizQuestions: [
        { q: '谁最适合写代码?', answers: ['前端开发', '小说家', '产品经理'], correct: 0 },
        { q: '谁负责测试?', answers: ['安全专家', '测试工程师', '项目经理'], correct: 1 },
        { q: '谁搜索信息?', answers: ['新闻矿工', 'AI助手', '老板'], correct: 0 },
        { q: '谁整理需求?', answers: ['项目经理', '产品经理', '后端开发'], correct: 1 },
        { q: '谁负责安全?', answers: ['测试工程师', '前端开发', '安全专家'], correct: 2 }
    ],
    currentQuestion: 0,
    score: 0,
    timer: 0,
    racePositions: {},
    winner: null,
    
    toggle() {
        this.active = !this.active;
        AudioSystem.playClick();
        console.log(`🎮 角色互动: ${this.active ? '开启' : '关闭'}`);
    },
    
    startQuiz() {
        this.gameMode = 'quiz';
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedChars = [];
        console.log('🎮 开始问答游戏');
    },
    
    startRace() {
        this.gameMode = 'race';
        this.racePositions = {};
        this.winner = null;
        this.selectedChars = characters.slice(0, 4).map(c => ({ ...c }));
        this.selectedChars.forEach(c => this.racePositions[c.id] = 0);
        this.timer = Date.now();
        console.log('🏃 开始赛跑游戏');
    },
    
    startChat() {
        this.gameMode = 'chat';
        this.selectedChars = characters.slice(0, 2).map(c => ({ ...c }));
        console.log('💬 开始聊天游戏');
    },
    
    update() {
        if (!this.active) return;
        
        if (this.gameMode === 'race' && this.selectedChars.length > 0) {
            // 赛跑模式更新
            this.selectedChars.forEach(char => {
                if (Math.random() < 0.3) {
                    this.racePositions[char.id] += Math.random() * 15 + 5;
                }
            });
            
            // 检查获胜者
            const maxPos = Math.max(...Object.values(this.racePositions));
            if (maxPos >= 500) {
                const winnerId = Object.keys(this.racePositions).find(id => this.racePositions[id] === maxPos);
                this.winner = this.selectedChars.find(c => c.id === winnerId);
            }
        }
    },
    
    draw() {
        if (!this.active) return;
        
        const panelW = 400, panelH = 350;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 面板背景
        ctx.fillStyle = 'rgba(29, 43, 83, 0.95)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // 标题
        ctx.fillStyle = COLORS.yellow;
        ctx.font = 'bold 20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 角色互动游戏', panelX + panelW/2, panelY + 30);
        
        if (!this.gameMode) {
            // 游戏选择菜单
            this.drawMenu(panelX, panelY, panelW, panelH);
        } else if (this.gameMode === 'quiz') {
            this.drawQuiz(panelX, panelY, panelW, panelH);
        } else if (this.gameMode === 'race') {
            this.drawRace(panelX, panelY, panelW, panelH);
        } else if (this.gameMode === 'chat') {
            this.drawChat(panelX, panelY, panelW, panelH);
        }
        
        // 关闭按钮
        ctx.fillStyle = COLORS.red;
        ctx.font = 'bold 16px "Courier New"';
        ctx.fillText('✕ 关闭', panelX + panelW - 50, panelY + 25);
    },
    
    drawMenu(px, py, pw, ph) {
        const btnW = 200, btnH = 40;
        const startY = py + 60;
        
        ctx.font = '16px "Courier New"';
        ctx.textAlign = 'center';
        
        // 问答按钮
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(px + pw/2 - btnW/2, startY, btnW, btnH);
        ctx.fillStyle = COLORS.white;
        ctx.fillText('🧠 知识问答', px + pw/2, startY + 26);
        
        // 赛跑按钮
        ctx.fillStyle = COLORS.blue;
        ctx.fillRect(px + pw/2 - btnW/2, startY + 60, btnW, btnH);
        ctx.fillText('🏃 角色赛跑', px + pw/2, startY + 86);
        
        // 聊天按钮
        ctx.fillStyle = COLORS.pink;
        ctx.fillRect(px + pw/2 - btnW/2, startY + 120, btnW, btnH);
        ctx.fillText('💬 随机聊天', px + pw/2, startY + 146);
    },
    
    drawQuiz(px, py, pw, ph) {
        if (this.currentQuestion >= this.quizQuestions.length) {
            ctx.fillStyle = COLORS.white;
            ctx.font = 'bold 24px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`游戏结束! 得分: ${this.score}/${this.quizQuestions.length}`, px + pw/2, py + ph/2);
            ctx.font = '14px "Courier New"';
            ctx.fillText('按 ESC 返回', px + pw/2, py + ph/2 + 40);
            return;
        }
        
        const q = this.quizQuestions[this.currentQuestion];
        
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(`Q${this.currentQuestion + 1}: ${q.q}`, px + pw/2, py + 70);
        
        const btnW = 180, btnH = 35;
        q.answers.forEach((ans, i) => {
            const y = py + 110 + i * 50;
            ctx.fillStyle = COLORS.darkGreen;
            ctx.fillRect(px + pw/2 - btnW/2, y, btnW, btnH);
            ctx.fillStyle = COLORS.white;
            ctx.font = '14px "Courier New"';
            ctx.fillText(`${i+1}. ${ans}`, px + pw/2, y + 23);
        });
    },
    
    drawRace(px, py, pw, ph) {
        const trackY = py + 80;
        
        // 赛道
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 20, trackY, pw - 40, 150);
        
        // 终点线
        ctx.strokeStyle = COLORS.white;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(px + pw - 30, trackY);
        ctx.lineTo(px + pw - 30, trackY + 150);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 角色位置
        this.selectedChars.forEach((char, i) => {
            const y = trackY + 20 + i * 35;
            const x = 30 + (this.racePositions[char.id] || 0);
            
            ctx.fillStyle = char.color;
            ctx.fillRect(px + x, y, 25, 25);
            
            ctx.fillStyle = COLORS.white;
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText(char.name.split(' ')[0], px + x + 30, y + 17);
        });
        
        if (this.winner) {
            ctx.fillStyle = COLORS.yellow;
            ctx.font = 'bold 20px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`🏆 获胜者: ${this.winner.name}`, px + pw/2, py + ph - 30);
        }
    },
    
    drawChat(px, py, pw, ph) {
        const chatY = py + 70;
        const bubbleW = pw - 60, bubbleH = 60;
        
        // 角色1
        ctx.fillStyle = this.selectedChars[0]?.color || COLORS.blue;
        ctx.fillRect(px + 20, chatY, 30, 30);
        ctx.fillStyle = COLORS.white;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(this.selectedChars[0]?.name || '角色1', px + 20, chatY + 45);
        
        ctx.fillStyle = COLORS.lightGray;
        ctx.fillRect(px + 60, chatY + 10, bubbleW, bubbleH);
        ctx.fillStyle = COLORS.black;
        ctx.font = '12px "Courier New"';
        ctx.fillText('今天任务进度不错!', px + 70, chatY + 40);
        
        // 角色2
        ctx.fillStyle = this.selectedChars[1]?.color || COLORS.green;
        ctx.fillRect(px + pw - 50, chatY + 90, 30, 30);
        ctx.fillStyle = COLORS.white;
        ctx.fillText(this.selectedChars[1]?.name || '角色2', px + pw - 100, chatY + 135);
        
        ctx.fillStyle = COLORS.blue;
        ctx.fillRect(px + 20, chatY + 100, bubbleW, bubbleH);
        ctx.fillStyle = COLORS.white;
        ctx.fillText('是啊,测试通过了!', px + 30, chatY + 130);
        
        // 输入提示
        ctx.fillStyle = COLORS.orange;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('💡 点击角色开始互动', px + pw/2, py + ph - 25);
    },
    
    handleClick(x, y) {
        if (!this.active) return false;
        
        const panelW = 400, panelH = 350;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 关闭按钮
        if (x > panelX + panelW - 70 && x < panelX + panelW - 10 && 
            y > panelY + 5 && y < panelY + 35) {
            this.active = false;
            this.gameMode = null;
            AudioSystem.playClick();
            return true;
        }
        
        if (!this.gameMode) {
            const btnW = 200, btnH = 40;
            const startY = panelY + 60;
            
            // 问答
            if (x > panelX + panelW/2 - btnW/2 && x < panelX + panelW/2 + btnW/2 &&
                y > startY && y < startY + btnH) {
                this.startQuiz();
                return true;
            }
            // 赛跑
            if (x > panelX + panelW/2 - btnW/2 && x < panelX + panelW/2 + btnW/2 &&
                y > startY + 60 && y < startY + 100) {
                this.startRace();
                return true;
            }
            // 聊天
            if (x > panelX + panelW/2 - btnW/2 && x < panelX + panelW/2 + btnW/2 &&
                y > startY + 120 && y < startY + 160) {
                this.startChat();
                return true;
            }
        }
        
        return true;
    }
};

// ==================== 迭代28: 效率趋势分析 ====================
const EfficiencyAnalytics = {
    show: false,
    data: {
        daily: [],
        weekly: [],
        monthly: []
    },
    currentView: 'daily', // daily, weekly, monthly
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`📊 效率分析: ${this.show ? '开启' : '关闭'}`);
    },
    
    cycleView() {
        const views = ['daily', 'weekly', 'monthly'];
        const idx = views.indexOf(this.currentView);
        this.currentView = views[(idx + 1) % views.length];
    },
    
    // 生成报告数据
    generateReport() {
        const now = new Date();
        
        // 模拟历史数据
        this.data.daily = this.generateDailyData();
        this.data.weekly = this.generateWeeklyData();
        this.data.monthly = this.generateMonthlyData();
        
        return {
            period: this.currentView,
            generatedAt: now.toLocaleString('zh-CN'),
            summary: this.getSummary(),
            topPerformer: StatsSystem.getTopPerformer(),
            trend: this.calculateTrend()
        };
    },
    
    generateDailyData() {
        const data = [];
        for (let i = 23; i >= 0; i--) {
            const hour = new Date();
            hour.setHours(hour.getHours() - i, 0, 0, 0);
            data.push({
                time: hour.getHours() + ':00',
                efficiency: Math.floor(40 + Math.random() * 40),
                tasks: Math.floor(Math.random() * 10)
            });
        }
        return data;
    },
    
    generateWeeklyData() {
        const data = [];
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        for (let i = 6; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);
            data.push({
                day: days[day.getDay() === 0 ? 6 : day.getDay() - 1],
                efficiency: Math.floor(50 + Math.random() * 35),
                tasks: Math.floor(15 + Math.random() * 20)
            });
        }
        return data;
    },
    
    generateMonthlyData() {
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);
            data.push({
                date: `${day.getMonth() + 1}/${day.getDate()}`,
                efficiency: Math.floor(45 + Math.random() * 40),
                tasks: Math.floor(10 + Math.random() * 25)
            });
        }
        return data;
    },
    
    getSummary() {
        const currentData = this.data[this.currentView];
        if (!currentData || currentData.length === 0) return {};
        
        const avgEfficiency = Math.floor(currentData.reduce((s, d) => s + d.efficiency, 0) / currentData.length);
        const totalTasks = currentData.reduce((s, d) => s + d.tasks, 0);
        
        return { avgEfficiency, totalTasks };
    },
    
    calculateTrend() {
        const data = this.data[this.currentView];
        if (data.length < 2) return 0;
        
        const recent = data.slice(-3);
        const older = data.slice(-6, -3);
        
        if (recent.length === 0 || older.length === 0) return 0;
        
        const recentAvg = recent.reduce((s, d) => s + d.efficiency, 0) / recent.length;
        const olderAvg = older.reduce((s, d) => s + d.efficiency, 0) / older.length;
        
        return Math.floor(recentAvg - olderAvg);
    },
    
    draw() {
        if (!this.show) return;
        
        const panelW = 500, panelH = 400;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 面板背景
        ctx.fillStyle = 'rgba(29, 43, 83, 0.95)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = COLORS.blue;
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // 标题
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('📊 效率趋势分析', panelX + panelW/2, panelY + 30);
        
        // 视图切换按钮
        this.drawViewButtons(panelX, panelY, panelW);
        
        // 绘制图表
        this.drawChart(panelX, panelY, panelW, panelH);
        
        // 关闭按钮
        ctx.fillStyle = COLORS.red;
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillText('✕ 关闭', panelX + panelW - 45, panelY + 20);
    },
    
    drawViewButtons(px, py, pw) {
        const views = [
            { key: 'daily', label: '📅 日' },
            { key: 'weekly', label: '📆 周' },
            { key: 'monthly', label: '📅 月' }
        ];
        
        const btnW = 80, btnH = 28;
        const startX = px + pw/2 - 120;
        
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        
        views.forEach((v, i) => {
            const x = startX + i * 90;
            ctx.fillStyle = this.currentView === v.key ? COLORS.green : COLORS.darkGray;
            ctx.fillRect(x, py + 45, btnW, btnH);
            ctx.fillStyle = COLORS.white;
            ctx.fillText(v.label, x + btnW/2, py + 65);
        });
    },
    
    drawChart(px, py, pw, ph) {
        const data = this.data[this.currentView];
        if (!data || data.length === 0) return;
        
        const chartX = px + 40;
        const chartY = py + 100;
        const chartW = pw - 80;
        const chartH = ph - 150;
        
        // 绘制网格
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = chartY + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(chartX, y);
            ctx.lineTo(chartX + chartW, y);
            ctx.stroke();
            
            ctx.fillStyle = '#888';
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'right';
            ctx.fillText((100 - i * 20) + '%', chartX - 5, y + 4);
        }
        
        // 绘制数据线
        const maxVal = 100;
        const step = chartW / (data.length - 1);
        
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((d, i) => {
            const x = chartX + i * step;
            const y = chartY + chartH - (d.efficiency / maxVal) * chartH;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            // 数据点
            ctx.fillStyle = COLORS.green;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.stroke();
        
        // 摘要信息
        const summary = this.getSummary();
        const trend = this.calculateTrend();
        
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.white;
        ctx.font = '14px "Courier New"';
        ctx.fillText(`平均效率: ${summary.avgEfficiency}%`, px + 40, py + ph - 50);
        ctx.fillText(`完成任务: ${summary.totalTasks}`, px + 40, py + ph - 30);
        
        const trendColor = trend >= 0 ? COLORS.green : COLORS.red;
        const trendIcon = trend >= 0 ? '📈' : '📉';
        ctx.fillStyle = trendColor;
        ctx.fillText(`${trendIcon} 趋势: ${trend > 0 ? '+' : ''}${trend}%`, px + 200, py + ph - 40);
        
        // 导出按钮
        ctx.fillStyle = COLORS.orange;
        ctx.fillRect(px + pw - 100, py + ph - 45, 80, 25);
        ctx.fillStyle = COLORS.white;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('📥 导出报告', px + pw - 60, py + ph - 28);
    },
    
    handleClick(x, y) {
        if (!this.show) return false;
        
        const panelW = 500, panelH = 400;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 关闭
        if (x > panelX + panelW - 60 && x < panelX + panelW - 10 && 
            y > panelY + 5 && y < panelY + 25) {
            this.show = false;
            AudioSystem.playClick();
            return true;
        }
        
        // 视图切换
        const views = ['daily', 'weekly', 'monthly'];
        const btnW = 80, btnH = 28;
        const startX = panelX + panelW/2 - 120;
        
        views.forEach((v, i) => {
            const bx = startX + i * 90;
            if (x > bx && x < bx + btnW && y > panelY + 45 && y < panelY + 73) {
                this.currentView = v;
                AudioSystem.playClick();
            }
        });
        
        // 导出报告
        if (x > panelX + panelW - 100 && x < panelX + panelW - 20 &&
            y > panelY + panelH - 45 && y < panelY + panelH - 20) {
            this.exportReport();
        }
        
        return true;
    },
    
    exportReport() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `效率报告_${report.generatedAt.replace(/[/:]/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        AudioSystem.playTaskComplete();
        console.log('📥 报告已导出');
    }
};

// ==================== 迭代28: 高级搜索增强 ====================
const AdvancedSearch = {
    show: false,
    query: '',
    filters: {
        status: 'all',
        zone: 'all',
        role: 'all',
        minProgress: 0,
        maxProgress: 100
    },
    results: [],
    selectedIndex: 0,
    
    toggle() {
        this.show = !this.show;
        if (this.show) {
            this.query = '';
            this.search();
        }
        AudioSystem.playClick();
        console.log(`🔎 高级搜索: ${this.show ? '开启' : '关闭'}`);
    },
    
    search() {
        this.results = characters.filter(char => {
            // 文本搜索
            if (this.query) {
                const q = this.query.toLowerCase();
                const match = char.name.toLowerCase().includes(q) ||
                    char.role.toLowerCase().includes(q) ||
                    char.task.toLowerCase().includes(q) ||
                    char.zone.toLowerCase().includes(q);
                if (!match) return false;
            }
            
            // 状态过滤
            if (this.filters.status !== 'all' && char.status !== this.filters.status) return false;
            
            // 区域过滤
            if (this.filters.zone !== 'all' && char.zone !== this.filters.zone) return false;
            
            // 角色过滤
            if (this.filters.role !== 'all' && char.role !== this.filters.role) return false;
            
            // 进度过滤
            if (char.progress < this.filters.minProgress || char.progress > this.filters.maxProgress) return false;
            
            return true;
        });
        
        this.selectedIndex = 0;
    },
    
    setQuery(q) {
        this.query = q;
        this.search();
    },
    
    setFilter(type, value) {
        this.filters[type] = value;
        this.search();
    },
    
    draw() {
        if (!this.show) return;
        
        const panelW = 450, panelH = 500;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 面板背景
        ctx.fillStyle = 'rgba(29, 43, 83, 0.97)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // 标题
        ctx.fillStyle = COLORS.yellow;
        ctx.font = 'bold 20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('🔎 高级搜索', panelX + panelW/2, panelY + 30);
        
        // 搜索框
        this.drawSearchBox(panelX, panelY, panelW);
        
        // 过滤器
        this.drawFilters(panelX, panelY, panelW);
        
        // 结果列表
        this.drawResults(panelX, panelY, panelW, panelH);
        
        // 关闭
        ctx.fillStyle = COLORS.red;
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillText('✕ 关闭', panelX + panelW - 45, panelY + 20);
    },
    
    drawSearchBox(px, py, pw) {
        const boxX = px + 20, boxY = py + 50;
        const boxW = pw - 40, boxH = 35;
        
        ctx.fillStyle = '#222';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = COLORS.lightGray;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        
        ctx.fillStyle = COLORS.white;
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(this.query || '🔍 输入关键词搜索...', boxX + 10, boxY + 23);
    },
    
    drawFilters(px, py, pw) {
        const startY = py + 100;
        
        // 状态过滤
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('状态:', px + 20, startY);
        
        ['all', 'working', 'idle'].forEach((s, i) => {
            const x = px + 60 + i * 70;
            ctx.fillStyle = this.filters.status === s ? COLORS.green : COLORS.darkGray;
            ctx.fillRect(x, startY - 12, 55, 20);
            ctx.fillStyle = COLORS.white;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(s === 'all' ? '全部' : (s === 'working' ? '工作中' : '待命'), x + 27, startY + 2);
        });
        
        // 角色过滤
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('角色:', px + 20, startY + 35);
        
        const roles = [
            { key: 'all', label: '全部' },
            { key: '产品', label: '产品' },
            { key: '开发', label: '开发' },
            { key: '测试', label: '测试' }
        ];
        roles.forEach((r, i) => {
            const x = px + 60 + i * 70;
            ctx.fillStyle = this.filters.role === r.key ? COLORS.blue : COLORS.darkGray;
            ctx.fillRect(x, startY + 23, 55, 20);
            ctx.fillStyle = COLORS.white;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(r.label, x + 27, startY + 37);
        });
        
        // 进度范围
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('进度:', px + 20, startY + 70);
        
        ctx.fillStyle = COLORS.darkGray;
        ctx.fillRect(px + 60, startY + 58, 200, 20);
        ctx.fillStyle = COLORS.green;
        const progressW = (this.filters.maxProgress - this.filters.minProgress) * 2;
        const progressX = 60 + this.filters.minProgress * 2;
        ctx.fillRect(px + progressX, startY + 58, progressW, 20);
        
        ctx.fillStyle = COLORS.white;
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.filters.minProgress}-${this.filters.maxProgress}%`, px + 160, startY + 72);
    },
    
    drawResults(px, py, pw, ph) {
        const startY = py + 200;
        const maxResults = 6;
        
        ctx.fillStyle = COLORS.white;
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`找到 ${this.results.length} 个结果:`, px + 20, startY);
        
        const listY = startY + 15;
        const itemH = 40;
        
        this.results.slice(0, maxResults).forEach((char, i) => {
            const y = listY + i * itemH;
            const selected = i === this.selectedIndex;
            
            ctx.fillStyle = selected ? COLORS.darkBlue : '#222';
            ctx.fillRect(px + 15, y, pw - 30, itemH - 5);
            
            if (selected) {
                ctx.strokeStyle = COLORS.yellow;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 15, y, pw - 30, itemH - 5);
            }
            
            ctx.fillStyle = char.color;
            ctx.fillRect(px + 25, y + 8, 20, 20);
            
            ctx.fillStyle = COLORS.white;
            ctx.font = '12px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText(char.name, px + 50, y + 15);
            
            ctx.fillStyle = COLORS.lightGray;
            ctx.font = '10px "Courier New"';
            ctx.fillText(`${char.task} [${char.progress}%]`, px + 50, y + 28);
            
            // 状态图标
            ctx.fillText(char.status === 'working' ? '💻' : '💤', px + pw - 40, y + 15);
        });
    },
    
    handleClick(x, y) {
        if (!this.show) return false;
        
        const panelW = 450, panelH = 500;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 关闭
        if (x > panelX + panelW - 55 && x < panelX + panelW - 10 && 
            y > panelY + 5 && y < panelY + 25) {
            this.show = false;
            AudioSystem.playClick();
            return true;
        }
        
        // 搜索框
        if (x > panelX + 20 && x < panelX + panelW - 20 &&
            y > panelY + 50 && y < panelY + 85) {
            // 聚焦搜索框 - 需要HTML输入
            const input = document.getElementById('advanced-search-input');
            if (input) {
                input.focus();
                return true;
            }
        }
        
        // 状态过滤器
        const startY = panelY + 100;
        ['all', 'working', 'idle'].forEach((s, i) => {
            const fx = panelX + 60 + i * 70;
            if (x > fx && x < fx + 55 && y > startY - 12 && y < startY + 8) {
                this.filters.status = s;
                this.search();
                AudioSystem.playClick();
            }
        });
        
        // 角色过滤器
        const roles = [{ key: 'all' }, { key: '产品' }, { key: '开发' }, { key: '测试' }];
        roles.forEach((r, i) => {
            const fx = panelX + 60 + i * 70;
            if (x > fx && x < fx + 55 && y > startY + 23 && y < startY + 43) {
                this.filters.role = r.key;
                this.search();
                AudioSystem.playClick();
            }
        });
        
        // 结果选择
        const listY = startY + 15;
        this.results.slice(0, 6).forEach((char, i) => {
            const itemY = listY + i * 40;
            if (x > panelX + 15 && x < panelX + panelW - 15 &&
                y > itemY && y < itemY + 35) {
                selectedCharacter = char.id;
                showCharacterPanel(char);
                AudioSystem.playSelect();
            }
        });
        
        return true;
    },
    
    nextResult() {
        if (this.results.length > 0) {
            this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        }
    },
    
    prevResult() {
        if (this.results.length > 0) {
            this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
        }
    }
};

// ==================== 添加快捷键支持 ====================
const KEYBOARD_SHORTCUTS_28 = {
    'i': () => CharInteraction.toggle(),
    'I': () => CharInteraction.toggle(),
    'e': () => EfficiencyAnalytics.toggle(),
    'E': () => EfficiencyAnalytics.toggle(),
    'a': () => AdvancedSearch.toggle(),
    'A': () => AdvancedSearch.toggle()
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, KEYBOARD_SHORTCUTS_28);

// 修改游戏循环以包含新系统
const originalGameLoop28 = gameLoop;
gameLoop = function() {
    originalGameLoop28();
    CharInteraction.update();
};

// 修改渲染函数
const originalRender28 = render;
render = function() {
    originalRender28();
    if (CharInteraction.active) CharInteraction.draw();
    if (EfficiencyAnalytics.show) EfficiencyAnalytics.draw();
    if (AdvancedSearch.show) AdvancedSearch.draw();
};

// 修改点击处理
const originalHandleClick28 = handleClick;
handleClick = function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (CharInteraction.active && CharInteraction.handleClick(x, y)) return;
    if (EfficiencyAnalytics.show && EfficiencyAnalytics.handleClick(x, y)) return;
    if (AdvancedSearch.show && AdvancedSearch.handleClick(x, y)) return;
    
    originalHandleClick28(e);
};

// 添加HTML搜索输入框
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.createElement('input');
    searchInput.id = 'advanced-search-input';
    searchInput.type = 'text';
    searchInput.placeholder = '高级搜索...';
    searchInput.style.cssText = 'position:fixed;top:-100px;left:-100px;';
    searchInput.addEventListener('input', (e) => {
        AdvancedSearch.setQuery(e.target.value);
    });
    document.body.appendChild(searchInput);
});

// ==================== 装饰系统 (Iteration 29) ====================
const DecorSystem = {
    show: false,
    decorations: [],
    currentTheme: 'none', // none, christmas, halloween, spring, summer
    themes: {
        none: { name: '🎴 无装饰', items: [] },
        christmas: { 
            name: '🎄 圣诞主题', 
            items: [
                { type: 'tree', x: 700, y: 500 },
                { type: 'snowman', x: 650, y: 520 },
                { type: 'gift', x: 720, y: 550 },
                { type: 'gift', x: 680, y: 560 },
                { type: 'star', x: 400, y: 30 }
            ]
        },
        halloween: { 
            name: '🎃 万圣节', 
            items: [
                { type: 'pumpkin', x: 700, y: 520 },
                { type: 'ghost', x: 50, y: 100 },
                { type: 'web', x: 750, y: 50 },
                { type: 'candle', x: 600, y: 550 }
            ]
        },
        spring: { 
            name: '🌸 春季主题', 
            items: [
                { type: 'flower', x: 100, y: 500 },
                { type: 'flower', x: 200, y: 520 },
                { type: 'flower', x: 300, y: 480 },
                { type: 'butterfly', x: 400, y: 300 },
                { type: 'butterfly', x: 500, y: 250 }
            ]
        },
        summer: { 
            name: '☀️ 夏季主题', 
            items: [
                { type: 'sun', x: 700, y: 50 },
                { type: 'palm', x: 50, y: 450 },
                { type: 'icecream', x: 600, y: 500 },
                { type: 'beachball', x: 700, y: 550 }
            ]
        },
        // ========== Iteration 30 新增 ==========
        midautumn: { 
            name: '🌙 中秋节主题', 
            items: [
                { type: 'moon', x: 700, y: 60 },
                { type: 'rabbit', x: 650, y: 80 },
                { type: 'lantern', x: 100, y: 50 },
                { type: 'lantern', x: 300, y: 40 },
                { type: 'lantern', x: 500, y: 50 },
                { type: 'tangyuan', x: 50, y: 500 },
                { type: 'tangyuan', x: 80, y: 520 }
            ]
        },
        spring: {
            name: '🧧 春节主题',
            items: [
                { type: 'spring lantern', x: 100, y: 50 },
                { type: 'spring lantern', x: 300, y: 40 },
                { type: 'spring lantern', x: 500, y: 50 },
                { type: 'firecracker', x: 700, y: 550 },
                { type: 'firecracker', x: 730, y: 540 },
                { type: 'fu', x: 400, y: 30 },
                { type: 'fireworks', x: 600, y: 100 }
            ]
        }
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`🎴 装饰系统: ${this.show ? '开启' : '关闭'}`);
    },
    
    cycleTheme() {
        const themeKeys = Object.keys(this.themes);
        const idx = themeKeys.indexOf(this.currentTheme);
        this.currentTheme = themeKeys[(idx + 1) % themeKeys.length];
        this.decorations = this.themes[this.currentTheme].items;
        AudioSystem.playSelect();
        console.log(`🎄 主题: ${this.themes[this.currentTheme].name}`);
    },
    
    drawDecorations(ctx) {
        if (!this.show || this.currentTheme === 'none') return;
        
        this.decorations.forEach(dec => {
            ctx.save();
            switch(dec.type) {
                case 'tree':
                    // 圣诞树
                    ctx.fillStyle = COLORS.darkGreen;
                    ctx.beginPath();
                    ctx.moveTo(dec.x, dec.y - 40);
                    ctx.lineTo(dec.x + 20, dec.y);
                    ctx.lineTo(dec.x - 20, dec.y);
                    ctx.fill();
                    ctx.fillStyle = COLORS.brown;
                    ctx.fillRect(dec.x - 5, dec.y, 10, 15);
                    // 装饰球
                    if (Math.random() > 0.5) {
                        ctx.fillStyle = COLORS.red;
                        ctx.beginPath();
                        ctx.arc(dec.x, dec.y - 20, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'snowman':
                    ctx.fillStyle = COLORS.white;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y - 20, 15, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(dec.x, dec.y + 5, 20, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = COLORS.orange;
                    ctx.beginPath(); ctx.moveTo(dec.x, dec.y - 20); ctx.lineTo(dec.x + 10, dec.y - 15); ctx.lineTo(dec.x, dec.y - 10); ctx.fill();
                    break;
                case 'gift':
                    ctx.fillStyle = COLORS.red;
                    ctx.fillRect(dec.x, dec.y, 20, 15);
                    ctx.fillStyle = COLORS.yellow;
                    ctx.fillRect(dec.x + 8, dec.y, 4, 15);
                    ctx.fillRect(dec.x, dec.y + 5, 20, 4);
                    break;
                case 'star':
                    ctx.fillStyle = COLORS.yellow;
                    this.drawStar(ctx, dec.x, dec.y, 5, 15, 7);
                    break;
                case 'pumpkin':
                    ctx.fillStyle = COLORS.orange;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 20, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = COLORS.darkGreen;
                    ctx.fillRect(dec.x - 3, dec.y - 25, 6, 10);
                    // 眼睛
                    ctx.fillStyle = COLORS.black;
                    ctx.fillRect(dec.x - 8, dec.y - 5, 5, 8);
                    ctx.fillRect(dec.x + 3, dec.y - 5, 5, 8);
                    break;
                case 'ghost':
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.beginPath();
                    ctx.arc(dec.x, dec.y, 15, 0, Math.PI * 2);
                    ctx.lineTo(dec.x - 15, dec.y + 20);
                    ctx.lineTo(dec.x - 5, dec.y + 15);
                    ctx.lineTo(dec.x, dec.y + 20);
                    ctx.lineTo(dec.x + 5, dec.y + 15);
                    ctx.lineTo(dec.x + 15, dec.y + 20);
                    ctx.fill();
                    break;
                case 'web':
                    ctx.strokeStyle = 'rgba(200,200,200,0.6)';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 8; i++) {
                        ctx.beginPath();
                        ctx.moveTo(dec.x, dec.y);
                        ctx.lineTo(dec.x + Math.cos(i * Math.PI / 4) * 50, dec.y + Math.sin(i * Math.PI / 4) * 50);
                        ctx.stroke();
                    }
                    break;
                case 'flower':
                    ctx.fillStyle = COLORS.pink;
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * Math.PI * 2) / 5;
                        ctx.beginPath();
                        ctx.arc(dec.x + Math.cos(angle) * 8, dec.y + Math.sin(angle) * 8, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillStyle = COLORS.yellow;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 4, 0, Math.PI * 2); ctx.fill();
                    break;
                case 'butterfly':
                    const flutter = Math.sin(Date.now() / 100) * 5;
                    ctx.fillStyle = COLORS.pink;
                    ctx.beginPath(); ctx.ellipse(dec.x - 8, dec.y, 8, 5 + flutter, -0.3, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.ellipse(dec.x + 8, dec.y, 8, 5 - flutter, 0.3, 0, Math.PI * 2); ctx.fill();
                    break;
                case 'sun':
                    ctx.fillStyle = COLORS.yellow;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 25, 0, Math.PI * 2); ctx.fill();
                    for (let i = 0; i < 8; i++) {
                        const angle = (i * Math.PI / 4);
                        ctx.fillRect(dec.x + Math.cos(angle) * 30, dec.y + Math.sin(angle) * 30, 4, 15);
                    }
                    break;
                case 'palm':
                    ctx.fillStyle = COLORS.brown;
                    ctx.fillRect(dec.x - 5, dec.y, 10, 60);
                    ctx.fillStyle = COLORS.darkGreen;
                    for (let i = 0; i < 5; i++) {
                        const angle = -Math.PI / 2 + (i - 2) * 0.4;
                        ctx.beginPath();
                        ctx.ellipse(dec.x + Math.cos(angle) * 40, dec.y + Math.sin(angle) * 40, 30, 8, angle, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'icecream':
                    ctx.fillStyle = COLORS.pink;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = COLORS.peach;
                    ctx.fillRect(dec.x - 8, dec.y, 16, 20);
                    ctx.fillStyle = COLORS.brown;
                    ctx.fillRect(dec.x - 3, dec.y + 20, 6, 10);
                    break;
                case 'beachball':
                    const colors = [COLORS.red, COLORS.white, COLORS.blue];
                    colors.forEach((c, i) => {
                        ctx.fillStyle = c;
                        ctx.beginPath();
                        ctx.arc(dec.x, dec.y, 12, i * Math.PI / 1.5, (i + 1) * Math.PI / 1.5);
                        ctx.lineTo(dec.x, dec.y);
                        ctx.fill();
                    });
                    break;
                case 'candle':
                    ctx.fillStyle = COLORS.white;
                    ctx.fillRect(dec.x - 4, dec.y, 8, 20);
                    ctx.fillStyle = COLORS.yellow;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y - 5, 4, 0, Math.PI * 2); ctx.fill();
                    break;
                // ========== Iteration 30 新增 ==========
                case 'moon':
                    // 中秋明月
                    ctx.fillStyle = '#F5E6A3';
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 30, 0, Math.PI * 2); ctx.fill();
                    // 月亮上的阴影
                    ctx.fillStyle = '#E8D590';
                    ctx.beginPath(); ctx.arc(dec.x - 8, dec.y - 5, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(dec.x + 5, dec.y + 8, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(dec.x - 3, dec.y + 12, 4, 0, Math.PI * 2); ctx.fill();
                    break;
                case 'rabbit':
                    // 玉兔
                    ctx.fillStyle = COLORS.white;
                    // 身体
                    ctx.beginPath(); ctx.ellipse(dec.x, dec.y, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
                    // 头
                    ctx.beginPath(); ctx.arc(dec.x - 10, dec.y - 5, 8, 0, Math.PI * 2); ctx.fill();
                    // 耳朵
                    ctx.beginPath(); ctx.ellipse(dec.x - 14, dec.y - 15, 3, 10, -0.2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.ellipse(dec.x - 8, dec.y - 15, 3, 10, 0.2, 0, Math.PI * 2); ctx.fill();
                    // 眼睛
                    ctx.fillStyle = COLORS.red;
                    ctx.beginPath(); ctx.arc(dec.x - 12, dec.y - 6, 2, 0, Math.PI * 2); ctx.fill();
                    break;
                case 'lantern':
                    // 中秋灯笼
                    ctx.fillStyle = COLORS.red;
                    ctx.beginPath();
                    ctx.moveTo(dec.x, dec.y - 15);
                    ctx.lineTo(dec.x + 15, dec.y - 5);
                    ctx.lineTo(dec.x + 15, dec.y + 15);
                    ctx.lineTo(dec.x, dec.y + 25);
                    ctx.lineTo(dec.x - 15, dec.y + 15);
                    ctx.lineTo(dec.x - 15, dec.y - 5);
                    ctx.closePath();
                    ctx.fill();
                    // 灯笼光芒
                    ctx.fillStyle = COLORS.yellow;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 5, 0, Math.PI * 2); ctx.fill();
                    // 灯笼顶部
                    ctx.fillStyle = COLORS.brown;
                    ctx.fillRect(dec.x - 4, dec.y - 20, 8, 5);
                    break;
                case 'tangyuan':
                    // 汤圆
                    ctx.fillStyle = COLORS.white;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = COLORS.pink;
                    ctx.beginPath(); ctx.arc(dec.x - 3, dec.y - 3, 3, 0, Math.PI * 2); ctx.fill();
                    break;
                case 'spring lantern':
                    // 春节灯笼
                    ctx.fillStyle = COLORS.red;
                    ctx.fillRect(dec.x - 10, dec.y, 20, 25);
                    // 金色边缘
                    ctx.fillStyle = COLORS.yellow;
                    ctx.fillRect(dec.x - 10, dec.y, 20, 3);
                    ctx.fillRect(dec.x - 10, dec.y + 22, 20, 3);
                    // 流苏
                    ctx.fillStyle = COLORS.red;
                    ctx.fillRect(dec.x - 2, dec.y + 25, 4, 10);
                    // 顶部
                    ctx.fillStyle = COLORS.brown;
                    ctx.fillRect(dec.x - 5, dec.y - 5, 10, 5);
                    break;
                case 'firecracker':
                    // 鞭炮
                    ctx.fillStyle = COLORS.red;
                    ctx.fillRect(dec.x, dec.y, 8, 20);
                    ctx.fillStyle = COLORS.yellow;
                    ctx.fillRect(dec.x + 2, dec.y, 2, 20);
                    // 引线
                    ctx.strokeStyle = COLORS.brown;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(dec.x + 4, dec.y);
                    ctx.quadraticCurveTo(dec.x + 10, dec.y - 5, dec.x + 8, dec.y - 10);
                    ctx.stroke();
                    break;
                case 'fu':
                    // 福字
                    ctx.fillStyle = COLORS.red;
                    ctx.fillRect(dec.x - 20, dec.y - 15, 40, 30);
                    ctx.fillStyle = COLORS.yellow;
                    ctx.font = 'bold 20px "Noto Sans SC", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('福', dec.x, dec.y + 8);
                    break;
                case 'fireworks':
                    // 烟花
                    const fwColors = [COLORS.red, COLORS.yellow, COLORS.pink, COLORS.orange];
                    for (let i = 0; i < 8; i++) {
                        ctx.strokeStyle = fwColors[i % fwColors.length];
                        ctx.lineWidth = 2;
                        const angle = (i * Math.PI) / 4;
                        ctx.beginPath();
                        ctx.moveTo(dec.x, dec.y);
                        ctx.lineTo(dec.x + Math.cos(angle) * 20, dec.y + Math.sin(angle) * 20);
                        ctx.stroke();
                    }
                    ctx.fillStyle = COLORS.white;
                    ctx.beginPath(); ctx.arc(dec.x, dec.y, 4, 0, Math.PI * 2); ctx.fill();
                    break;
            }
            ctx.restore();
        });
    },
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
};

// ==================== 团队协作任务系统 (Iteration 29) ====================
const TeamCollaboration = {
    show: false,
    tasks: [],
    selectedTask: null,
    dependencyGraph: [],
    
    init() {
        // 模拟团队协作任务数据
        this.tasks = [
            { id: 1, name: '🚀 新功能开发', members: ['fe', 'be', 'qa'], status: 'progress', progress: 65, dependencies: [] },
            { id: 2, name: '📝 文档更新', members: ['pm'], status: 'progress', progress: 80, dependencies: [1] },
            { id: 3, name: '🔒 安全审计', members: ['security'], status: 'pending', progress: 0, dependencies: [2] },
            { id: 4, name: '🎨 UI优化', members: ['fe', 'pm'], status: 'done', progress: 100, dependencies: [] },
            { id: 5, name: '⚡ 性能优化', members: ['fe', 'be'], status: 'progress', progress: 40, dependencies: [4] }
        ];
        this.buildDependencyGraph();
    },
    
    buildDependencyGraph() {
        this.dependencyGraph = this.tasks.map(task => {
            const deps = task.dependencies.map(depId => this.tasks.find(t => t.id === depId)).filter(Boolean);
            return { task, dependencies: deps };
        });
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`👥 团队协作: ${this.show ? '开启' : '关闭'}`);
    },
    
    draw() {
        if (!this.show) return;
        
        const panelW = 500, panelH = 450;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        
        // 边框
        ctx.strokeStyle = COLORS.blue;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // 标题
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('👥 团队协作任务看板', panelX + panelW / 2, panelY + 25);
        
        // 关闭按钮
        ctx.fillStyle = COLORS.red;
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('×', panelX + panelW - 20, panelY + 25);
        
        // 任务列表
        const listStartY = panelY + 50;
        const taskH = 65;
        
        this.tasks.forEach((task, i) => {
            const y = listStartY + i * taskH;
            
            // 任务背景
            ctx.fillStyle = task.status === 'done' ? 'rgba(0, 200, 0, 0.2)' : 
                           task.status === 'progress' ? 'rgba(0, 150, 255, 0.2)' : 
                           'rgba(100, 100, 100, 0.2)';
            ctx.fillRect(panelX + 20, y, panelW - 40, taskH - 10);
            
            // 状态边框
            ctx.strokeStyle = task.status === 'done' ? COLORS.green : 
                             task.status === 'progress' ? COLORS.blue : COLORS.gray;
            ctx.lineWidth = 2;
            ctx.strokeRect(panelX + 20, y, panelW - 40, taskH - 10);
            
            // 任务名
            ctx.fillStyle = COLORS.white;
            ctx.font = '14px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText(task.name, panelX + 30, y + 20);
            
            // 成员头像
            ctx.font = '12px Arial';
            const memberEmojis = { fe: '💻', be: '⚙️', qa: '🧪', pm: '📋', security: '🔒' };
            task.members.forEach((m, mi) => {
                ctx.fillText(memberEmojis[m] || '👤', panelX + 30 + mi * 25, y + 40);
            });
            
            // 进度条
            const progressX = panelX + 150;
            ctx.fillStyle = '#333';
            ctx.fillRect(progressX, y + 15, 150, 12);
            ctx.fillStyle = task.status === 'done' ? COLORS.green : COLORS.blue;
            ctx.fillRect(progressX, y + 15, task.progress * 1.5, 12);
            
            ctx.fillStyle = COLORS.white;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`${task.progress}%`, progressX + 75, y + 25);
            
            // 依赖指示
            if (task.dependencies.length > 0) {
                ctx.fillStyle = COLORS.orange;
                ctx.font = '10px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`📎依赖${task.dependencies.length}`, panelX + panelW - 30, y + 20);
            }
            
            // 状态标签
            const statusText = task.status === 'done' ? '✅ 完成' : 
                              task.status === 'progress' ? '🔄 进行中' : '⏳ 待开始';
            ctx.fillStyle = task.status === 'done' ? COLORS.green : 
                           task.status === 'progress' ? COLORS.blue : COLORS.gray;
            ctx.font = '10px "Courier New"';
            ctx.textAlign = 'right';
            ctx.fillText(statusText, panelX + panelW - 30, y + 40);
        });
        
        // 图例
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '11px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('💻 前端 | ⚙️ 后端 | 🧪 测试 | 📋 产品 | 🔒 安全', panelX + 30, panelY + panelH - 20);
    },
    
    handleClick(x, y) {
        if (!this.show) return false;
        
        const panelW = 500, panelH = 450;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 关闭
        if (x > panelX + panelW - 35 && x < panelX + panelW - 10 && 
            y > panelY + 5 && y < panelY + 25) {
            this.show = false;
            AudioSystem.playClick();
            return true;
        }
        
        return true;
    }
};

// ==================== 云端数据同步系统 (Iteration 29) ====================
const CloudSyncSystem = {
    show: false,
    lastSync: null,
    syncStatus: 'idle', // idle, syncing, success, error
    cloudData: {},
    autoSync: true,
    syncInterval: 60000, // 1分钟
    encryptionKey: 'snoopyoffice2026', // 默认加密密钥
    
    // 简易加密函数 (XOR + Base64)
    encrypt(data, key) {
        const str = JSON.stringify(data);
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    },
    
    // 简易解密函数
    decrypt(encrypted, key) {
        try {
            const str = atob(encrypted);
            let result = '';
            for (let i = 0; i < str.length; i++) {
                result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return JSON.parse(result);
        } catch (e) {
            console.error('解密失败:', e);
            return null;
        }
    },
    
    // 加密导出
    exportEncrypted() {
        const state = {
            characters: characters,
            stats: StatsSystem.history,
            achievements: AchievementSystem.achievements,
            dailyChallenges: DailyChallengeSystem.challenges,
            exportedAt: new Date().toISOString()
        };
        
        // 加密数据
        const encrypted = this.encrypt(state, this.encryptionKey);
        
        const blob = new Blob([encrypted], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snoopyoffice_encrypted_${new Date().toISOString().slice(0,10)}.enc`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('🔐 数据已加密导出');
        AudioSystem.playClick();
    },
    
    // 解密导入
    importEncrypted(file, password = null) {
        const key = password || this.encryptionKey;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const encrypted = e.target.result;
                const state = this.decrypt(encrypted, key);
                if (state) {
                    this.applyState(state);
                    console.log('🔐 数据解密并导入成功!');
                    AudioSystem.playTaskComplete();
                } else {
                    console.error('🔐 解密失败，密码可能不正确');
                    AudioSystem.playError();
                }
            } catch (error) {
                console.error('🔐 导入失败:', error);
                AudioSystem.playError();
            }
        };
        reader.readAsText(file);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`☁️ 云端同步: ${this.show ? '开启' : '关闭'}`);
    },
    
    async syncToCloud() {
        if (this.syncStatus === 'syncing') return;
        
        this.syncStatus = 'syncing';
        console.log('☁️ 正在同步到云端...');
        
        try {
            // 收集当前状态
            const state = {
                characters: characters,
                stats: StatsSystem.history.slice(-50),
                achievements: AchievementSystem.achievements,
                dailyChallenges: DailyChallengeSystem.challenges,
                timestamp: Date.now()
            };
            
            // 存储到 localStorage 作为本地备份
            localStorage.setItem('snoopyoffice_backup', JSON.stringify(state));
            
            // 模拟云端同步成功
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.cloudData = state;
            this.lastSync = new Date();
            this.syncStatus = 'success';
            console.log('☁️ 云端同步完成!');
            
            AudioSystem.playTaskComplete();
        } catch (error) {
            console.error('☁️ 同步失败:', error);
            this.syncStatus = 'error';
            AudioSystem.playError();
        }
    },
    
    async restoreFromCloud() {
        console.log('☁️ 正在从云端恢复...');
        
        try {
            // 先尝试从 localStorage 恢复
            const backup = localStorage.getItem('snoopyoffice_backup');
            if (backup) {
                const state = JSON.parse(backup);
                this.applyState(state);
                this.syncStatus = 'success';
                console.log('☁️ 数据恢复成功!');
                AudioSystem.playTaskComplete();
                return true;
            }
            
            console.log('☁️ 没有找到备份数据');
            return false;
        } catch (error) {
            console.error('☁️ 恢复失败:', error);
            this.syncStatus = 'error';
            AudioSystem.playError();
            return false;
        }
    },
    
    applyState(state) {
        if (state.characters) {
            characters = state.characters;
            // 更新显示
            updateStats();
        }
        if (state.achievements) {
            AchievementSystem.achievements = state.achievements;
        }
        if (state.dailyChallenges) {
            DailyChallengeSystem.challenges = state.dailyChallenges;
        }
    },
    
    exportToFile() {
        const state = {
            characters: characters,
            stats: StatsSystem.history,
            achievements: AchievementSystem.achievements,
            dailyChallenges: DailyChallengeSystem.challenges,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snoopyoffice_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📦 数据已导出到文件');
        AudioSystem.playClick();
    },
    
    importFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target.result);
                this.applyState(state);
                console.log('📥 数据导入成功!');
                AudioSystem.playTaskComplete();
            } catch (error) {
                console.error('📥 导入失败:', error);
                AudioSystem.playError();
            }
        };
        reader.readAsText(file);
    },
    
    draw() {
        if (!this.show) return;
        
        const panelW = 400, panelH = 300;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // 标题
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('☁️ 云端数据同步', panelX + panelW / 2, panelY + 30);
        
        // 状态
        const statusIcon = this.syncStatus === 'syncing' ? '🔄' :
                          this.syncStatus === 'success' ? '✅' :
                          this.syncStatus === 'error' ? '❌' : '⏳';
        const statusText = this.syncStatus === 'syncing' ? '同步中...' :
                          this.syncStatus === 'success' ? '同步成功' :
                          this.syncStatus === 'error' ? '同步失败' : '等待同步';
        
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '14px "Courier New"';
        ctx.fillText(`${statusIcon} ${statusText}`, panelX + panelW / 2, panelY + 70);
        
        // 最后同步时间
        if (this.lastSync) {
            ctx.font = '12px "Courier New"';
            ctx.fillText(`上次同步: ${this.lastSync.toLocaleString()}`, panelX + panelW / 2, panelY + 95);
        }
        
        // 按钮区域
        const btnY = panelY + 130;
        const btnW = 150, btnH = 35;
        
        // 同步按钮
        ctx.fillStyle = COLORS.blue;
        ctx.fillRect(panelX + 25, btnY, btnW, btnH);
        ctx.fillStyle = COLORS.white;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('☁️ 立即同步', panelX + 25 + btnW / 2, btnY + 22);
        
        // 恢复按钮
        ctx.fillStyle = COLORS.orange;
        ctx.fillRect(panelX + panelW - 175, btnY, btnW, btnH);
        ctx.fillStyle = COLORS.white;
        ctx.fillText('📥 恢复数据', panelX + panelW - 175 + btnW / 2, btnY + 22);
        
        // 导出按钮
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(panelX + 25, btnY + 50, btnW, btnH);
        ctx.fillStyle = COLORS.white;
        ctx.fillText('📦 导出文件', panelX + 25 + btnW / 2, btnY + 72);
        
        // 导入按钮
        ctx.fillStyle = COLORS.purple;
        ctx.fillRect(panelX + panelW - 175, btnY + 50, btnW, btnH);
        ctx.fillStyle = COLORS.white;
        ctx.fillText('📥 导入文件', panelX + panelW - 175 + btnW / 2, btnY + 72);
        
        // 说明
        ctx.fillStyle = COLORS.lightGray;
        ctx.font = '10px "Courier New"';
        ctx.fillText('💡 数据会自动保存到本地存储', panelX + panelW / 2, panelY + panelH - 25);
        
        // 加密导出按钮
        ctx.fillStyle = COLORS.red;
        ctx.fillRect(panelX + 25, btnY + 100, 70, 28);
        ctx.fillStyle = COLORS.white;
        ctx.font = '10px "Courier New"';
        ctx.fillText('🔐 加密导出', panelX + 25 + 35, btnY + 118);
        
        // 加密导入按钮
        ctx.fillStyle = COLORS.darkRed;
        ctx.fillRect(panelX + 105, btnY + 100, 70, 28);
        ctx.fillStyle = COLORS.white;
        ctx.fillText('🔓 加密导入', panelX + 105 + 35, btnY + 118);
    },
    
    handleClick(x, y) {
        if (!this.show) return false;
        
        const panelW = 400, panelH = 300;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        const btnY = panelY + 130;
        const btnW = 150, btnH = 35;
        
        // 同步按钮
        if (x > panelX + 25 && x < panelX + 25 + btnW && y > btnY && y < btnY + btnH) {
            this.syncToCloud();
            AudioSystem.playClick();
            return true;
        }
        
        // 恢复按钮
        if (x > panelX + panelW - 175 && x < panelX + panelW - 25 && y > btnY && y < btnY + btnH) {
            this.restoreFromCloud();
            return true;
        }
        
        // 导出按钮
        if (x > panelX + 25 && x < panelX + 25 + btnW && y > btnY + 50 && y < btnY + 50 + btnH) {
            this.exportToFile();
            return true;
        }
        
        // 导入按钮 - 触发文件选择
        if (x > panelX + panelW - 175 && x < panelX + panelW - 25 && y > btnY + 50 && y < btnY + 50 + btnH) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                if (e.target.files[0]) {
                    this.importFromFile(e.target.files[0]);
                }
            };
            input.click();
            return true;
        }
        
        // 加密导出按钮
        if (x > panelX + 25 && x < panelX + 95 && y > btnY + 100 && y < btnY + 128) {
            this.exportEncrypted();
            return true;
        }
        
        // 加密导入按钮
        if (x > panelX + 105 && x < panelX + 175 && y > btnY + 100 && y < btnY + 128) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.enc,.json';
            input.onchange = (e) => {
                if (e.target.files[0]) {
                    this.importEncrypted(e.target.files[0]);
                }
            };
            input.click();
            return true;
        }
        
        // 点击背景关闭
        if (x > panelX && x < panelX + panelW && y > panelY && y < panelY + panelH) {
            return true;
        }
        
        this.show = false;
        return true;
    }
};

// ==================== 迭代29快捷键 ====================
const KEYBOARD_SHORTCUTS_29 = {
    'd': () => DecorSystem.toggle(),
    'D': () => DecorSystem.toggle(),
    'y': () => DecorSystem.cycleTheme(),
    'Y': () => DecorSystem.cycleTheme(),
    'c': () => TeamCollaboration.toggle(),
    'C': () => TeamCollaboration.toggle(),
    'z': () => CloudSyncSystem.toggle(),
    'Z': () => CloudSyncSystem.toggle()
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, KEYBOARD_SHORTCUTS_29);

// 修改渲染函数包含新系统
const originalRender29 = render;
render = function() {
    originalRender29();
    DecorSystem.drawDecorations(ctx);
    if (TeamCollaboration.show) TeamCollaboration.draw();
    if (CloudSyncSystem.show) CloudSyncSystem.draw();
};

// 修改点击处理包含新系统
const originalHandleClick29 = handleClick;
handleClick = function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (TeamCollaboration.show && TeamCollaboration.handleClick(x, y)) return;
    if (CloudSyncSystem.show && CloudSyncSystem.handleClick(x, y)) return;
    
    originalHandleClick29(e);
};

// ==================== 角色情感系统 (Iteration 31) ====================
const EmotionSystem = {
    show: false,
    emotions: ['happy', 'neutral', 'tired', 'stressed', 'excited', 'focused'],
    characterEmotions: {},
    
    // 每个角色当前情感
    getEmotion(charId) {
        return this.characterEmotions[charId] || 'neutral';
    },
    
    // 根据状态自动更新情感
    updateEmotion(char) {
        const taskLength = char.task?.length || 0;
        const progress = char.progress || 0;
        
        let emotion = 'neutral';
        
        if (progress > 80) {
            emotion = Math.random() > 0.5 ? 'happy' : 'excited';
        } else if (progress > 50) {
            emotion = 'focused';
        } else if (taskLength > 30) {
            emotion = Math.random() > 0.7 ? 'stressed' : 'tired';
        } else if (char.status === 'idle') {
            emotion = Math.random() > 0.5 ? 'happy' : 'neutral';
        }
        
        this.characterEmotions[char.id] = emotion;
        return emotion;
    },
    
    // 获取情感emoji
    getEmoji(emotion) {
        const emojis = {
            happy: '😊',
            neutral: '😐',
            tired: '😴',
            stressed: '😰',
            excited: '🤩',
            focused: '🎯'
        };
        return emojis[emotion] || '😐';
    },
    
    // 获取情感颜色
    getColor(emotion) {
        const colors = {
            happy: COLORS.yellow,
            neutral: COLORS.lightGray,
            tired: COLORS.indigo,
            stressed: COLORS.red,
            excited: COLORS.orange,
            focused: COLORS.green
        };
        return colors[emotion] || COLORS.lightGray;
    },
    
    // 绘制情感指示器
    drawEmotionIndicator(ctx, x, y, char) {
        const emotion = this.getEmotion(char.id);
        const emoji = this.getEmoji(emotion);
        const color = this.getColor(emotion);
        
        // 绘制情感气泡
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 20, y - 5, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制emoji
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(emoji, x + 20, y - 1);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`💭 情感显示: ${this.show ? '开启' : '关闭'}`);
    }
};

// ==================== AI任务建议系统 (Iteration 31) ====================
const AITaskAdvisor = {
    show: false,
    suggestions: [],
    history: [],
    
    // 基于角色历史生成建议
    generateSuggestions() {
        const suggestions = [];
        
        characters.forEach(char => {
            const historyLength = char.history?.length || 0;
            const avgProgress = char.progress || 0;
            
            // 基于历史任务数量建议
            if (historyLength < 3) {
                suggestions.push({
                    charId: char.id,
                    charName: char.name,
                    type: '新人指导',
                    text: `欢迎新成员 ${char.name}！建议分配简单任务熟悉环境`,
                    priority: 'high'
                });
            }
            
            // 基于效率建议
            if (avgProgress < 30 && char.status === 'working') {
                suggestions.push({
                    charId: char.id,
                    charName: char.name,
                    type: '效率优化',
                    text: `${char.name} 进度较慢，建议简化任务或增加资源`,
                    priority: 'medium'
                });
            }
            
            // 基于工作时长建议休息
            if (avgProgress > 60 && Math.random() > 0.6) {
                suggestions.push({
                    charId: char.id,
                    charName: char.name,
                    type: '关怀建议',
                    text: `${char.name} 工作高效！建议短暂休息保持状态`,
                    priority: 'low'
                });
            }
        });
        
        // 团队协作建议
        const workingCount = characters.filter(c => c.status === 'working').length;
        if (workingCount > 6) {
            suggestions.push({
                charId: 'team',
                charName: '团队',
                type: '协作建议',
                text: '多个任务并行中，建议优先处理高优先级任务',
                priority: 'medium'
            });
        }
        
        this.suggestions = suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        return suggestions;
    },
    
    // 绘制建议面板
    draw() {
        if (!this.show || this.suggestions.length === 0) return;
        
        const panelW = 280;
        const panelH = Math.min(400, 80 + this.suggestions.length * 70);
        const panelX = canvas.width - panelW - 20;
        const panelY = 20;
        
        // 面板背景
        ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].panel;
        ctx.strokeStyle = ThemeSystem.themes[ThemeSystem.current].border;
        ctx.lineWidth = 2;
        roundRect(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.fill();
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
        ctx.font = 'bold 14px "Press Start 2P", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🤖 AI 任务建议', panelX + 15, panelY + 30);
        
        // 建议列表
        let y = panelY + 50;
        this.suggestions.slice(0, 5).forEach((sug, i) => {
            const priorityColors = {
                high: COLORS.red,
                medium: COLORS.orange,
                low: COLORS.green
            };
            
            // 优先级指示
            ctx.fillStyle = priorityColors[sug.priority];
            ctx.beginPath();
            ctx.arc(panelX + 20, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 角色名和类型
            ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
            ctx.font = '10px sans-serif';
            ctx.fillText(`${sug.charName} - ${sug.type}`, panelX + 32, y - 3);
            
            // 建议文本
            ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text + 'aa';
            ctx.font = '9px sans-serif';
            const text = sug.text.length > 35 ? sug.text.slice(0, 35) + '...' : sug.text;
            ctx.fillText(text, panelX + 15, y + 12);
            
            y += 65;
        });
    },
    
    toggle() {
        if (!this.show) {
            this.generateSuggestions();
        }
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`🤖 AI建议: ${this.show ? '开启' : '关闭'}`);
    }
};

// ==================== AR/WebXR支持框架 (Iteration 31) ====================
const ARSystem = {
    supported: false,
    session: null,
    mode: 'none', // none, vr, ar
    
    init() {
        // 检测WebXR支持
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-vr').then((vrSupported) => {
                navigator.xr.isSessionSupported('immersive-ar').then((arSupported) => {
                    this.supported = arSupported || vrSupported;
                    console.log(`🥽 XR支持: VR=${vrSupported}, AR=${arSupported}`);
                });
            });
        }
    },
    
    // 启动AR模式
    async startAR() {
        if (!this.supported) {
            console.log('🥽 WebXR 不支持');
            this.showARNotSupported();
            return;
        }
        
        try {
            this.session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['dom-overlay']
            });
            
            this.mode = 'ar';
            console.log('🥽 AR会话已启动');
            
            this.session.addEventListener('end', () => {
                this.mode = 'none';
                this.session = null;
            });
            
        } catch (e) {
            console.error('AR启动失败:', e);
            this.showARNotSupported();
        }
    },
    
    // 显示AR不支持提示
    showARNotSupported() {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: ${ThemeSystem.themes[ThemeSystem.current].panel};
            padding: 20px; border-radius: 10px; border: 2px solid ${COLORS.red};
            color: ${ThemeSystem.themes[ThemeSystem.current].text}; z-index: 10000;
            font-family: sans-serif; text-align: center;
        `;
        msg.innerHTML = `
            <h3>🥽 AR模式</h3>
            <p>您的设备不支持WebXR AR</p>
            <p>请使用支持的设备体验AR</p>
            <button onclick="this.parentElement.remove()" style="margin-top:10px;padding:8px 20px;cursor:pointer">关闭</button>
        `;
        document.body.appendChild(msg);
    },
    
    // 退出AR
    async stopAR() {
        if (this.session) {
            await this.session.end();
            this.mode = 'none';
        }
    },
    
    // 获取AR按钮文本
    getButtonText() {
        if (!this.supported) return '🥽 AR (不支持)';
        return this.mode === 'none' ? '🥽 启动AR' : '🥽 退出AR';
    }
};

// 初始化AR系统
ARSystem.init();

// ==================== 快捷键 ====================
const KEYBOARD_SHORTCUTS_31 = {
    'e': () => EmotionSystem.toggle(),
    'E': () => EmotionSystem.toggle(),
    'a': () => AITaskAdvisor.toggle(),
    'A': () => AITaskAdvisor.toggle(),
    'x': () => ARSystem.supported ? (ARSystem.mode === 'none' ? ARSystem.startAR() : ARSystem.stopAR()) : ARSystem.showARNotSupported(),
    'X': () => ARSystem.supported ? (ARSystem.mode === 'none' ? ARSystem.startAR() : ARSystem.stopAR()) : ARSystem.showARNotSupported()
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, KEYBOARD_SHORTCUTS_31);

// 修改渲染函数包含新系统
const originalRender31 = render;
render = function() {
    originalRender31();
    if (EmotionSystem.show) {
        characters.forEach(char => {
            EmotionSystem.updateEmotion(char);
        });
    }
    AITaskAdvisor.draw();
};

// 修改点击处理添加AR按钮支持
const originalHandleClick31 = handleClick;
handleClick = function(e) {
    // AR按钮点击区域 (右下角)
    const arBtnX = canvas.width - 100;
    const arBtnY = canvas.height - 50;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (x > arBtnX && x < arBtnX + 80 && y > arBtnY && y < arBtnY + 30) {
        if (ARSystem.supported) {
            ARSystem.mode === 'none' ? ARSystem.startAR() : ARSystem.stopAR();
        } else {
            ARSystem.showARNotSupported();
        }
        return;
    }
    
    originalHandleClick31(e);
};

// ==================== 初始化 ====================
const originalInit31 = init;
init = function() {
    originalInit31();
    EmotionSystem.show = false;
    AITaskAdvisor.generateSuggestions();
    console.log('🎮 迭代31功能已加载: 情感系统 | AI建议 | AR支持');
    console.log('⌨️ 新快捷键: E 情感 | A AI建议 | X AR模式');
};

// ==================== AI聊天助手系统 (Iteration 32) ====================
const AIChatAssistant = {
    show: false,
    messages: [],
    inputText: '',
    processing: false,
    
    // 模拟AI响应
    generateResponse(input) {
        const lowerInput = input.toLowerCase();
        let response = '';
        let type = 'info';
        
        // 任务相关
        if (lowerInput.includes('任务') || lowerInput.includes('分配')) {
            const idleChars = characters.filter(c => c.status === 'idle');
            if (idleChars.length > 0) {
                const randomChar = idleChars[Math.floor(Math.random() * idleChars.length)];
                response = `好的！我建议给 ${randomChar.name} 分配新任务：${this.getRandomTask()}`;
                type = 'task';
            } else {
                response = '目前所有角色都在工作中，建议等待或调整任务优先级。';
                type = 'info';
            }
        }
        // 状态查询
        else if (lowerInput.includes('状态') || lowerInput.includes('怎么样')) {
            const working = characters.filter(c => c.status === 'working').length;
            const idle = characters.length - working;
            response = `当前团队状态：${working}人工作中，${idle}人待命。整体效率 ${Math.round(overallProgress)}%`;
            type = 'status';
        }
        // 效率相关
        else if (lowerInput.includes('效率') || lowerInput.includes('排名')) {
            const sorted = [...characters].sort((a, b) => (b.progress || 0) - (a.progress || 0));
            response = '当前效率排名：\n' + sorted.slice(0, 3).map((c, i) => `${i+1}. ${c.name}: ${c.progress || 0}%`).join('\n');
            type = 'ranking';
        }
        // 帮助
        else if (lowerInput.includes('帮助') || lowerInput.includes('能做什么')) {
            response = '我可以帮你：\n📋 分配任务\n📊 查看状态\n🏆 查询排名\n💡 提供建议\n🎯 调整优先级';
            type = 'help';
        }
        // 问候
        else if (lowerInput.includes('你好') || lowerInput.includes('hi') || lowerInput.includes('hello')) {
            response = '你好！我是Snoopy-Office AI助手，有什么可以帮你的？';
            type = 'greeting';
        }
        // 感谢
        else if (lowerInput.includes('谢谢') || lowerInput.includes('感谢')) {
            response = '不客气！很高兴能帮到你 😊';
            type = 'thanks';
        }
        // 默认
        else {
            const responses = [
                '明白了，我会帮你处理这个需求。',
                '收到！让我分析一下当前情况...',
                '好的，我理解你的需求了。',
                '明白了，正在为你规划最佳方案...',
                '收到！我会协调团队完成这个任务。'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
            type = 'default';
        }
        
        return { text: response, type };
    },
    
    // 获取随机任务
    getRandomTask() {
        const tasks = [
            '优化代码性能',
            '撰写技术文档',
            '修复测试bug',
            '设计新功能原型',
            '进行代码审查',
            '更新依赖版本',
            '编写单元测试',
            '优化数据库查询'
        ];
        return tasks[Math.floor(Math.random() * tasks.length)];
    },
    
    // 发送消息
    sendMessage(text) {
        if (!text.trim() || this.processing) return;
        
        this.messages.push({ text, role: 'user', time: new Date() });
        
        this.processing = true;
        this.inputText = '';
        
        // 模拟AI思考延迟
        setTimeout(() => {
            const response = this.generateResponse(text);
            this.messages.push({ 
                text: response.text, 
                role: 'assistant', 
                time: new Date(),
                type: response.type
            });
            this.processing = false;
            
            // 滚动到底部
            setTimeout(() => {
                const chatBody = document.getElementById('chat-body');
                if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
            }, 100);
        }, 500 + Math.random() * 1000);
    },
    
    // 绘制聊天面板
    draw() {
        if (!this.show) return;
        
        // 创建DOM元素（如果不存在）
        let chatPanel = document.getElementById('ai-chat-panel');
        if (!chatPanel) {
            chatPanel = document.createElement('div');
            chatPanel.id = 'ai-chat-panel';
            chatPanel.style.cssText = `
                position: fixed; bottom: 20px; left: 20px; width: 360px; height: 480px;
                background: ${ThemeSystem.themes[ThemeSystem.current].panel};
                border: 3px solid ${COLORS.purple}; border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10000;
                display: flex; flex-direction: column; font-family: 'Press Start 2P', sans-serif;
            `;
            
            chatPanel.innerHTML = `
                <div style="padding: 12px; background: ${COLORS.purple}; color: white; 
                    border-radius: 9px 9px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10px;">🤖 AI 聊天助手</span>
                    <button onclick="AIChatAssistant.toggle()" style="background: none; border: none; 
                        color: white; cursor: pointer; font-size: 16px;">×</button>
                </div>
                <div id="chat-body" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; 
                    flex-direction: column; gap: 8px;">
                    <div style="align-self: flex-start; background: ${COLORS.lightGray}22; 
                        padding: 8px 12px; border-radius: 8px; max-width: 80%; font-size: 9px;
                        color: ${ThemeSystem.themes[ThemeSystem.current].text};">
                        👋 你好！我是AI助手，可以帮你分配任务、查询状态、解答问题。
                    </div>
                </div>
                <div style="padding: 10px; border-top: 1px solid ${COLORS.lightGray};
                    display: flex; gap: 8px;">
                    <input type="text" id="chat-input" placeholder="输入消息..." 
                        style="flex: 1; padding: 8px; border: 2px solid ${COLORS.lightGray};
                        border-radius: 6px; background: ${ThemeSystem.themes[ThemeSystem.current].bg};
                        color: ${ThemeSystem.themes[ThemeSystem.current].text}; font-size: 10px;"
                        onkeypress="if(event.key==='Enter'){AIChatAssistant.sendMessage(this.value);}">
                    <button onclick="AIChatAssistant.sendMessage(document.getElementById('chat-input').value)"
                        style="padding: 8px 12px; background: ${COLORS.purple}; color: white;
                        border: none; border-radius: 6px; cursor: pointer; font-size: 10px;">发送</button>
                </div>
            `;
            
            document.body.appendChild(chatPanel);
        }
    },
    
    // 更新消息显示
    updateMessages() {
        const chatBody = document.getElementById('chat-body');
        if (!chatBody) return;
        
        chatBody.innerHTML = this.messages.map(m => {
            const isUser = m.role === 'user';
            const alignment = isUser ? 'flex-end' : 'flex-start';
            const bg = isUser ? COLORS.purple + '88' : ThemeSystem.themes[ThemeSystem.current].bg + '44';
            const color = isUser ? 'white' : ThemeSystem.themes[ThemeSystem.current].text;
            const prefix = isUser ? '👤' : '🤖';
            
            return `<div style="align-self: ${alignment}; background: ${bg}; padding: 8px 12px; 
                border-radius: 8px; max-width: 80%; font-size: 9px; color: ${color}; white-space: pre-wrap;">
                ${prefix} ${m.text}</div>`;
        }).join('');
        
        chatBody.scrollTop = chatBody.scrollHeight;
    },
    
    toggle() {
        this.show = !this.show;
        if (this.show) {
            this.draw();
            AudioSystem.playClick();
        } else {
            const chatPanel = document.getElementById('ai-chat-panel');
            if (chatPanel) chatPanel.remove();
        }
    }
};

// ==================== 社交功能系统 (Iteration 32) ====================
const SocialSystem = {
    show: false,
    visitors: [],
    maxVisitors: 3,
    
    // 访客类型
    visitorTypes: [
        { name: '面试者', icon: '👔', color: COLORS.blue },
        { name: '投资人', icon: '💼', color: COLORS.gold },
        { name: '合作伙伴', icon: '🤝', color: COLORS.green },
        { name: '媒体', icon: '📰', color: COLORS.orange },
        { name: '粉丝', icon: '⭐', color: COLORS.pink }
    ],
    
    // 生成随机访客
    generateVisitor() {
        const type = this.visitorTypes[Math.floor(Math.random() * this.visitorTypes.length)];
        const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        const lastNames = ['明', '华', '伟', '芳', '娜', '丽', '强', '磊', '军', '洋'];
        
        return {
            id: 'visitor_' + Date.now(),
            name: firstNames[Math.floor(Math.random() * firstNames.length)] + 
                  lastNames[Math.floor(Math.random() * lastNames.length)],
            type: type,
            visitTime: new Date(),
            status: 'arriving', // arriving, visiting, leaving
            position: { x: 400, y: 550 },
            targetPosition: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 }
        };
    },
    
    // 随机生成访客
    spawnVisitor() {
        if (this.visitors.length >= this.maxVisitors) return;
        if (Math.random() > 0.3) return;
        
        const visitor = this.generateVisitor();
        this.visitors.push(visitor);
        console.log(`👋 新访客: ${visitor.name} (${visitor.type.name})`);
    },
    
    // 更新访客
    updateVisitors() {
        this.visitors.forEach(visitor => {
            // 移动到目标位置
            const dx = visitor.targetPosition.x - visitor.position.x;
            const dy = visitor.targetPosition.y - visitor.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                visitor.position.x += dx * 0.02;
                visitor.position.y += dy * 0.02;
            } else {
                if (visitor.status === 'arriving') {
                    visitor.status = 'visiting';
                    // 随机设置下一个目标
                    setTimeout(() => {
                        visitor.targetPosition = { 
                            x: 100 + Math.random() * 600, 
                            y: 100 + Math.random() * 400 
                        };
                    }, 3000 + Math.random() * 5000);
                }
            }
            
            // 随机离开
            if (visitor.status === 'visiting' && Math.random() < 0.001) {
                visitor.status = 'leaving';
                visitor.targetPosition = { x: 400, y: 600 };
            }
        });
        
        // 移除已离开的访客
        this.visitors = this.visitors.filter(v => v.status !== 'leaving' || v.position.y < 580);
        
        // 生成新访客
        this.spawnVisitor();
    },
    
    // 绘制访客
    drawVisitors() {
        if (!this.show) return;
        
        this.visitors.forEach(visitor => {
            // 访客圆圈
            ctx.fillStyle = visitor.type.color + '88';
            ctx.beginPath();
            ctx.arc(visitor.position.x, visitor.position.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // 访客图标
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(visitor.type.icon, visitor.position.x, visitor.position.y + 6);
            
            // 访客名称
            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
            ctx.fillText(visitor.name, visitor.position.x, visitor.position.y - 25);
        });
    },
    
    // 成就分享
    shareAchievement(achievement) {
        const shareText = `🎮 我在 Snoopy-Office 获得了成就：${achievement.name}！\n🏢 像素办公室管理经验值+${achievement.xp}\n\n🌐 ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Snoopy-Office 成就',
                text: shareText,
                url: window.location.href
            });
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                alert('成就分享内容已复制到剪贴板！');
            });
        }
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`👥 访客系统: ${this.show ? '开启' : '关闭'}`);
    }
};

// ==================== 数据可视化增强系统 (Iteration 32) ====================
const DataVisualization = {
    show: false,
    mode: 'weekly', // weekly, monthly, comparison
    
    // 生成周报数据
    generateWeeklyReport() {
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const data = days.map(day => ({
            day,
            tasks: Math.floor(Math.random() * 20) + 5,
            efficiency: Math.floor(Math.random() * 30) + 70,
            collaboration: Math.floor(Math.random() * 40) + 60
        }));
        
        const avgEfficiency = Math.round(data.reduce((sum, d) => sum + d.efficiency, 0) / 7);
        const totalTasks = data.reduce((sum, d) => sum + d.tasks, 0);
        
        return { data, avgEfficiency, totalTasks };
    },
    
    // 生成月报数据
    generateMonthlyReport() {
        const weeks = ['第1周', '第2周', '第3周', '第4周'];
        const data = weeks.map(week => ({
            week,
            tasks: Math.floor(Math.random() * 80) + 20,
            completed: Math.floor(Math.random() * 60) + 20,
            efficiency: Math.floor(Math.random() * 20) + 80
        }));
        
        const totalTasks = data.reduce((sum, d) => sum + d.tasks, 0);
        const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
        
        return { data, completionRate: Math.round((totalCompleted / totalTasks) * 100) };
    },
    
    // 生成效率对比数据
    generateComparisonData() {
        const thisWeek = characters.map(c => ({
            name: c.name,
            efficiency: Math.floor(Math.random() * 40) + 60
        }));
        
        const lastWeek = characters.map(c => ({
            name: c.name,
            efficiency: Math.floor(Math.random() * 40) + 55
        }));
        
        return { thisWeek, lastWeek };
    },
    
    // 绘制报表面板
    draw() {
        if (!this.show) return;
        
        const panelW = 500;
        const panelH = 400;
        const panelX = (canvas.width - panelW) / 2;
        const panelY = (canvas.height - panelH) / 2;
        
        // 面板背景
        ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].panel;
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 3;
        roundRect(ctx, panelX, panelY, panelW, panelH, 12);
        ctx.fill();
        ctx.stroke();
        
        // 标题
        const titles = { weekly: '📊 周报', monthly: '📈 月报', comparison: '📉 效率对比' };
        ctx.fillStyle = COLORS.cyan;
        ctx.font = 'bold 14px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(titles[this.mode], canvas.width / 2, panelY + 30);
        
        // 切换按钮
        const modes = ['weekly', 'monthly', 'comparison'];
        const btnY = panelY + 50;
        modes.forEach((mode, i) => {
            const btnX = panelX + 30 + i * 150;
            const isActive = this.mode === mode;
            
            ctx.fillStyle = isActive ? COLORS.cyan : ThemeSystem.themes[ThemeSystem.current].bg;
            ctx.strokeStyle = COLORS.cyan;
            roundRect(ctx, btnX, btnY, 130, 25, 5);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isActive ? ThemeSystem.themes[ThemeSystem.current].bg : COLORS.cyan;
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText(['周报', '月报', '对比'][i], btnX + 65, btnY + 17);
        });
        
        // 绘制内容
        const contentY = panelY + 90;
        if (this.mode === 'weekly') {
            this.drawWeeklyContent(panelX + 20, contentY, panelW - 40);
        } else if (this.mode === 'monthly') {
            this.drawMonthlyContent(panelX + 20, contentY, panelW - 40);
        } else {
            this.drawComparisonContent(panelX + 20, contentY, panelW - 40);
        }
        
        // 关闭按钮
        ctx.fillStyle = COLORS.red;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('×', panelX + panelW - 20, panelY + 25);
    },
    
    // 绘制周报内容
    drawWeeklyContent(x, y, w) {
        const report = this.generateWeeklyReport();
        
        // 统计摘要
        ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`📋 总任务数: ${report.totalTasks}`, x, y);
        ctx.fillText(`📈 平均效率: ${report.avgEfficiency}%`, x + 200, y);
        
        // 柱状图
        const chartY = y + 40;
        const chartH = 180;
        const barW = (w - 60) / 7;
        
        report.data.forEach((d, i) => {
            const barH = (d.efficiency / 100) * chartH;
            const barX = x + 10 + i * barW;
            
            // 柱体
            ctx.fillStyle = COLORS.cyan;
            roundRect(ctx, barX, chartY + chartH - barH, barW - 8, barH, 3);
            ctx.fill();
            
            // 标签
            ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.day, barX + barW / 4, chartY + chartH + 15);
            
            // 数值
            ctx.fillText(d.efficiency + '%', barX + barW / 4, chartY + chartH - barH - 5);
        });
    },
    
    // 绘制月报内容
    drawMonthlyContent(x, y, w) {
        const report = this.generateMonthlyReport();
        
        // 完成率
        ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`✅ 任务完成率: ${report.completionRate}%`, x, y);
        
        // 饼图
        const pieX = x + w / 2;
        const pieY = y + 100;
        const radius = 70;
        
        // 已完成
        ctx.fillStyle = COLORS.green;
        ctx.beginPath();
        ctx.moveTo(pieX, pieY);
        ctx.arc(pieX, pieY, radius, 0, Math.PI * 2 * (report.completionRate / 100));
        ctx.closePath();
        ctx.fill();
        
        // 未完成
        ctx.fillStyle = COLORS.red + '88';
        ctx.beginPath();
        ctx.moveTo(pieX, pieY);
        ctx.arc(pieX, pieY, radius, Math.PI * 2 * (report.completionRate / 100), Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // 图例
        ctx.font = '8px sans-serif';
        ctx.fillStyle = COLORS.green;
        ctx.fillText('✅ 已完成', x, pieY + radius + 30);
        ctx.fillStyle = COLORS.red;
        ctx.fillText('❌ 未完成', x + 80, pieY + radius + 30);
    },
    
    // 绘制对比内容
    drawComparisonContent(x, y, w) {
        const data = this.generateComparisonData();
        
        // 对比图
        const chartH = 200;
        const barW = (w - 40) / characters.length / 2;
        
        data.thisWeek.forEach((d, i) => {
            const barX = x + 10 + i * barW * 2;
            
            // 本周
            const thisH = (d.efficiency / 100) * chartH;
            ctx.fillStyle = COLORS.cyan;
            roundRect(ctx, barX, y + chartH - thisH, barW - 5, thisH, 3);
            ctx.fill();
            
            // 上周
            const lastH = (data.lastWeek[i].efficiency / 100) * chartH;
            ctx.fillStyle = COLORS.gray;
            roundRect(ctx, barX + barW, y + chartH - lastH, barW - 5, lastH, 3);
            ctx.fill();
            
            // 标签
            ctx.fillStyle = ThemeSystem.themes[ThemeSystem.current].text;
            ctx.font = '7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.name.slice(0, 2), barX + barW, y + chartH + 12);
        });
        
        // 图例
        ctx.font = '8px sans-serif';
        ctx.fillStyle = COLORS.cyan;
        ctx.fillText('■ 本周', x, y + chartH + 30);
        ctx.fillStyle = COLORS.gray;
        ctx.fillText('■ 上周', x + 60, y + chartH + 30);
    },
    
    // 切换模式
    cycleMode() {
        const modes = ['weekly', 'monthly', 'comparison'];
        const idx = modes.indexOf(this.mode);
        this.mode = modes[(idx + 1) % modes.length];
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`📊 数据报表: ${this.show ? '开启' : '关闭'}`);
    }
};

// ==================== 快捷键 (Iteration 32) ====================
const KEYBOARD_SHORTCUTS_32 = {
    'v': () => AIChatAssistant.toggle(),
    'V': () => AIChatAssistant.toggle(),
    'i': () => SocialSystem.toggle(),
    'I': () => SocialSystem.toggle(),
    'p': () => DataVisualization.toggle(),
    'P': () => DataVisualization.toggle()
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, KEYBOARD_SHORTCUTS_32);

// 修改渲染函数包含新系统
const originalRender32 = render;
render = function() {
    originalRender32();
    if (SocialSystem.show) {
        SocialSystem.updateVisitors();
        SocialSystem.drawVisitors();
    }
    if (DataVisualization.show) {
        DataVisualization.draw();
    }
    if (AIChatAssistant.show) {
        AIChatAssistant.draw();
    }
};

// 添加按钮到UI
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const chatBtn = document.createElement('button');
            chatBtn.className = 'sound-btn';
            chatBtn.id = 'chat-toggle';
            chatBtn.textContent = '🤖';
            chatBtn.title = 'AI聊天 (V)';
            chatBtn.onclick = () => AIChatAssistant.toggle();
            statusBar.appendChild(chatBtn);
            
            const socialBtn = document.createElement('button');
            socialBtn.className = 'sound-btn';
            socialBtn.id = 'social-toggle';
            socialBtn.textContent = '👥';
            socialBtn.title = '访客系统 (I)';
            socialBtn.onclick = () => SocialSystem.toggle();
            statusBar.appendChild(socialBtn);
            
            const reportBtn = document.createElement('button');
            reportBtn.className = 'sound-btn';
            reportBtn.id = 'report-toggle';
            reportBtn.textContent = '📊';
            reportBtn.title = '数据报表 (P)';
            reportBtn.onclick = () => DataVisualization.toggle();
            statusBar.appendChild(reportBtn);
        }
    }, 1000);
});

// ==================== 等级系统 (Iteration 33) ====================
const LevelSystem = {
    show: false,
    teamLevel: 1,
    teamXP: 0,
    xpToNextLevel: 100,
    members: [],
    
    // 角色等级数据
    characterLevels: {},
    
    init() {
        // 初始化角色等级
        characters.forEach(char => {
            this.characterLevels[char.id] = {
                level: 1,
                xp: 0,
                xpToNext: 50,
                title: '实习',
                skills: []
            };
        });
    },
    
    addXP(characterId, amount) {
        const charLevel = this.characterLevels[characterId];
        if (!charLevel) return;
        
        charLevel.xp += amount;
        
        // 检查升级
        while (charLevel.xp >= charLevel.xpToNext) {
            charLevel.xp -= charLevel.xpToNext;
            charLevel.level++;
            charLevel.xpToNext = Math.floor(charLevel.xpToNext * 1.5);
            charLevel.title = this.getTitle(charLevel.level);
            
            // 升级特效
            this.showLevelUp(characterId, charLevel.level);
        }
        
        // 团队经验
        this.teamXP += amount;
        while (this.teamXP >= this.xpToNextLevel) {
            this.teamXP -= this.xpToNextLevel;
            this.teamLevel++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.3);
        }
    },
    
    getTitle(level) {
        const titles = [
            '实习', '初级', '中级', '高级', '资深',
            '专家', '领袖', '大师', '传奇', '神话'
        ];
        return titles[Math.min(level - 1, titles.length - 1)];
    },
    
    showLevelUp(characterId, newLevel) {
        const char = characters.find(c => c.id === characterId);
        if (char) {
            // 简单的升级提示
            console.log(`🎉 ${char.name} 升级到 ${newLevel} 级!`);
        }
    },
    
    draw() {
        if (!this.show) return;
        
        const x = CANVAS_WIDTH - 220;
        const y = 80;
        const w = 200;
        const h = 280;
        
        // 面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ 等级系统', x + w/2, y + 22);
        
        // 团队等级
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`团队等级: Lv.${this.teamLevel}`, x + w/2, y + 45);
        
        // 经验条
        const barX = x + 15;
        const barY = y + 55;
        const barW = w - 30;
        const barH = 12;
        
        ctx.fillStyle = '#333';
        roundRect(ctx, barX, barY, barW, barH, 3);
        ctx.fill();
        
        const xpRatio = this.teamXP / this.xpToNextLevel;
        const gradient = ctx.createLinearGradient(barX, 0, barX + barW * xpRatio, 0);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = gradient;
        roundRect(ctx, barX, barY, barW * xpRatio, barH, 3);
        ctx.fill();
        
        ctx.fillStyle = '#aaa';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.teamXP}/${this.xpToNextLevel} XP`, x + w/2, barY + 10);
        
        // 角色等级列表
        let listY = y + 80;
        ctx.textAlign = 'left';
        
        characters.slice(0, 6).forEach(char => {
            const charLevel = this.characterLevels[char.id];
            if (!charLevel) return;
            
            // 角色图标
            ctx.fillStyle = char.color || '#888';
            ctx.fillRect(x + 15, listY - 8, 16, 16);
            
            // 角色名和等级
            ctx.fillStyle = '#fff';
            ctx.font = '11px sans-serif';
            ctx.fillText(`${char.name}`, x + 38, listY);
            
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Lv.${charLevel.level}`, x + 120, listY);
            
            // 经验条
            ctx.fillStyle = '#333';
            ctx.fillRect(x + 155, listY - 6, 30, 6);
            const charXpRatio = charLevel.xp / charLevel.xpToNext;
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(x + 155, listY - 6, 30 * charXpRatio, 6);
            
            listY += 28;
        });
        
        // 快捷键提示
        ctx.fillStyle = '#666';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('按 G 关闭', x + w/2, y + h - 10);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`⭐ 等级系统: ${this.show ? '开启' : '关闭'}`);
    }
};

// ==================== 技能树系统 (Iteration 33) ====================
const SkillTreeSystem = {
    show: false,
    selectedCharacter: null,
    
    // 技能定义
    skills: {
        coding: { name: '编码', icon: '💻', maxLevel: 5, desc: '提升写代码速度' },
        communication: { name: '沟通', icon: '💬', maxLevel: 5, desc: '提升协作效率' },
        analysis: { name: '分析', icon: '📊', maxLevel: 5, desc: '提升问题分析能力' },
        creativity: { name: '创意', icon: '💡', maxLevel: 5, desc: '提升创新能力' },
        leadership: { name: '领导', icon: '👑', maxLevel: 5, desc: '提升团队领导力' },
        efficiency: { name: '效率', icon: '⚡', maxLevel: 5, desc: '提升工作效率' }
    },
    
    characterSkills: {},
    
    init() {
        characters.forEach(char => {
            this.characterSkills[char.id] = {
                coding: 0,
                communication: 0,
                analysis: 0,
                creativity: 0,
                leadership: 0,
                efficiency: 0
            };
        });
    },
    
    upgradeSkill(characterId, skillName) {
        const skills = this.characterSkills[characterId];
        const skill = this.skills[skillName];
        if (!skills || !skill) return;
        
        if (skills[skillName] < skill.maxLevel) {
            skills[skillName]++;
            AudioSystem.playSuccess();
            console.log(`🎓 ${characters.find(c => c.id === characterId)?.name} 升级了 ${skill.name}!`);
        }
    },
    
    draw() {
        if (!this.show) return;
        
        const x = CANVAS_WIDTH - 280;
        const y = 80;
        const w = 260;
        const h = 320;
        
        // 面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = '#9C27B0';
        ctx.font = 'bold 14px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎓 技能树', x + w/2, y + 22);
        
        // 选择角色
        const char = this.selectedCharacter || characters[0];
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`角色: ${char.name}`, x + w/2, y + 45);
        
        // 技能列表
        const skillKeys = Object.keys(this.skills);
        let gridY = y + 65;
        
        skillKeys.forEach((skillKey, idx) => {
            const skill = this.skills[skillKey];
            const charSkills = this.characterSkills[char.id];
            const currentLevel = charSkills ? charSkills[skillKey] : 0;
            
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const skillX = x + 20 + col * 80;
            const skillY = gridY + row * 80;
            
            // 技能背景
            ctx.fillStyle = currentLevel > 0 ? 'rgba(156, 39, 176, 0.3)' : 'rgba(50, 50, 50, 0.5)';
            roundRect(ctx, skillX, skillY, 70, 70, 5);
            ctx.fill();
            
            // 技能图标
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText(skill.icon, skillX + 25, skillY + 25);
            
            // 技能名
            ctx.font = '9px sans-serif';
            ctx.fillText(skill.name, skillX + 35, skillY + 42);
            
            // 等级星星
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < skill.maxLevel; i++) {
                ctx.fillText(i < currentLevel ? '★' : '☆', skillX + 8 + i * 12, skillY + 58);
            }
        });
        
        // 说明
        ctx.fillStyle = '#888';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('完成任务可获得技能点', x + w/2, y + h - 25);
        
        // 快捷键
        ctx.fillStyle = '#666';
        ctx.fillText('按 U 关闭 | 点击角色切换', x + w/2, y + h - 10);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`🎓 技能树: ${this.show ? '开启' : '关闭'}`);
    }
};

// ==================== 截图分享系统 (Iteration 33) ====================
const ShareSystem = {
    show: false,
    
    draw() {
        if (!this.show) return;
        
        const x = CANVAS_WIDTH / 2 - 150;
        const y = CANVAS_HEIGHT / 2 - 120;
        const w = 300;
        const h = 240;
        
        // 面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        roundRect(ctx, x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 16px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📸 截图分享', x + w/2, y + 30);
        
        // 预览区域
        ctx.fillStyle = '#1a1a2e';
        roundRect(ctx, x + 30, y + 50, w - 60, 120, 8);
        ctx.fill();
        
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText('点击下方按钮生成截图', x + w/2, y + 115);
        
        // 按钮
        const btnY = y + 185;
        
        // 复制到剪贴板
        ctx.fillStyle = '#4CAF50';
        roundRect(ctx, x + 30, btnY, w - 60, 35, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('📋 复制图片到剪贴板', x + w/2, btnY + 22);
        
        // 下载
        ctx.fillStyle = '#2196F3';
        roundRect(ctx, x + 30, btnY + 42, w - 60, 35, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('💾 下载 PNG 图片', x + w/2, btnY + 64);
        
        // 快捷键
        ctx.fillStyle = '#666';
        ctx.font = '9px sans-serif';
        ctx.fillText('按 Y 关闭 | 点击按钮操作', x + w/2, y + h - 10);
    },
    
    toggle() {
        this.show = !this.show;
        AudioSystem.playClick();
        console.log(`📸 截图分享: ${this.show ? '开启' : '关闭'}`);
    },
    
    // 生成Canvas截图
    async capture() {
        try {
            const dataUrl = canvas.toDataURL('image/png');
            return dataUrl;
        } catch (e) {
            console.error('截图失败:', e);
            return null;
        }
    },
    
    // 复制到剪贴板
    async copyToClipboard() {
        try {
            const dataUrl = await this.capture();
            if (!dataUrl) return;
            
            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            
            AudioSystem.playSuccess();
            alert('截图已复制到剪贴板！');
        } catch (e) {
            console.error('复制失败:', e);
            alert('复制失败，请使用下载功能');
        }
    },
    
    // 下载图片
    async download() {
        try {
            const dataUrl = await this.capture();
            if (!dataUrl) return;
            
            const link = document.createElement('a');
            link.download = `Snoopy-Office-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            
            AudioSystem.playSuccess();
            console.log('截图已下载');
        } catch (e) {
            console.error('下载失败:', e);
        }
    }
};

// ==================== 快捷键 (Iteration 33) ====================
const KEYBOARD_SHORTCUTS_33 = {
    'g': () => LevelSystem.toggle(),
    'G': () => LevelSystem.toggle(),
    'u': () => SkillTreeSystem.toggle(),
    'U': () => SkillTreeSystem.toggle(),
    'y': () => ShareSystem.toggle(),
    'Y': () => ShareSystem.toggle()
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, KEYBOARD_SHORTCUTS_33);

// 修改渲染函数包含新系统
const originalRender33 = render;
render = function() {
    originalRender33();
    LevelSystem.draw();
    SkillTreeSystem.draw();
    ShareSystem.draw();
};

// ==================== 初始化 (Iteration 33) ====================
const originalInit33 = init;
init = function() {
    originalInit33();
    LevelSystem.init();
    SkillTreeSystem.init();
    console.log('🎮 迭代33功能已加载: 等级系统 | 技能树 | 截图分享');
    console.log('⌨️ 新快捷键: G 等级 | U 技能树 | Y 截图');
};

// 备用初始化 (1秒后)
setTimeout(function() { if (!canvas) { console.log('备用初始化触发'); init(); } }, 1000);

// ==================== 焦点模式 (Iteration 44) ====================
// 允许用户用键盘快速浏览所有角色的详细信息
const FocusMode = {
    show: false,
    currentIndex: 0,
    characterList: [],
    lastUpdate: 0,
    
    init() {
        this.characterList = characters.map((c, i) => ({ ...c, index: i }));
        console.log('🔍 焦点模式已初始化');
    },
    
    // 打开焦点模式
    open() {
        if (characters.length === 0) return;
        this.show = true;
        this.currentIndex = 0;
        this.updatePanel();
        AudioSystem.playClick();
        console.log('🔍 焦点模式: 开启');
    },
    
    // 关闭焦点模式
    close() {
        this.show = false;
        closePanel();
        AudioSystem.playClick();
        console.log('🔍 焦点模式: 关闭');
    },
    
    // 切换焦点模式
    toggle() {
        if (this.show) {
            this.close();
        } else {
            this.open();
        }
    },
    
    // 下一个角色
    next() {
        if (this.characterList.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.characterList.length;
        this.updatePanel();
        AudioSystem.playSelect();
    },
    
    // 上一个角色
    prev() {
        if (this.characterList.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.characterList.length) % this.characterList.length;
        this.updatePanel();
        AudioSystem.playSelect();
    },
    
    // 更新面板显示当前角色信息
    updatePanel() {
        const char = this.characterList[this.currentIndex];
        if (!char) return;
        
        // 更新面板内容
        const panel = document.getElementById('character-panel');
        if (panel) {
            panel.classList.remove('hidden');
            document.getElementById('panel-name').textContent = char.name;
            document.getElementById('panel-status').textContent = char.status === 'working' ? '工作中' : '待命中';
            document.getElementById('panel-progress').style.width = char.progress + '%';
            document.getElementById('panel-location').textContent = ZONES[char.zone]?.name || char.zone;
            document.getElementById('panel-task').textContent = char.task || '无任务';
            
            // 生成时间线
            const timeline = document.getElementById('panel-timeline');
            if (timeline) {
                timeline.innerHTML = `
                    <div class="timeline-item">
                        <span class="time">现在</span>
                        <span class="desc">${char.task || '待命中'}</span>
                    </div>
                    <div class="timeline-item">
                        <span class="time">前${Math.floor(Math.random() * 30) + 1}分钟</span>
                        <span class="desc">${this.getRandomTask()}</span>
                    </div>
                    <div class="timeline-item">
                        <span class="time">前${Math.floor(Math.random() * 60) + 30}分钟</span>
                        <span class="desc">${this.getRandomTask()}</span>
                    </div>
                `;
            }
        }
        
        // 高亮当前角色
        this.highlightCharacter(char);
    },
    
    // 获取随机任务描述
    getRandomTask() {
        const tasks = ['编写代码', 'code review', '写文档', '开会', '测试', '调试', '部署', '需求评审', '设计接口', '优化性能'];
        return tasks[Math.floor(Math.random() * tasks.length)];
    },
    
    // 高亮画布上的角色
    highlightCharacter(char) {
        // 刷新画布以显示高亮
        render();
        
        // 在角色周围画一个闪烁的边框
        if (canvas && char) {
            const ctx = canvas.getContext('2d');
            const zone = ZONES[char.zone];
            if (zone) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(zone.x - 5, zone.y - 5, zone.width + 10, zone.height + 10);
                ctx.setLineDash([]);
            }
        }
    },
    
    // 绘制焦点模式UI
    draw() {
        if (!this.show) return;
        
        const ctx = canvas.getContext('2d');
        const char = this.characterList[this.currentIndex];
        if (!char) return;
        
        // 底部指示器
        const indicatorY = canvas.height - 30;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, indicatorY, canvas.width, 30);
        
        // 显示当前索引
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🔍 焦点模式 [${this.currentIndex + 1}/${this.characterList.length}] ← → 切换 | ESC 关闭`, canvas.width / 2, indicatorY + 20);
        ctx.textAlign = 'left';
    }
};

// ==================== 快捷键 (Iteration 44) ====================
const KEYBOARD_SHORTCUTS_44 = {
    'f': () => FocusMode.toggle(),
    'F': () => FocusMode.toggle(),
    'ArrowRight': () => { if (FocusMode.show) FocusMode.next(); },
    'ArrowLeft': () => { if (FocusMode.show) FocusMode.prev(); }
};

// 合并快捷键
Object.assign(KEYBOARD_SHORTCUTS, KEYBOARD_SHORTCUTS_44);

// 修改渲染函数包含新系统
const originalRender44 = render;
render = function() {
    originalRender44();
    FocusMode.draw();
};

// 修改初始化函数
const originalInit44 = init;
init = function() {
    originalInit44();
    FocusMode.init();
    console.log('🔍 迭代44功能已加载: 焦点模式');
    console.log('⌨️ 新快捷键: F 焦点模式 | ← → 切换角色');
};

// ==================== 迭代47: 语音交互系统 ====================
const VoiceSystem = {
    recognition: null,
    synthesis: null,
    enabled: false,
    listening: false,
    
    init() {
        // 语音识别
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'zh-CN';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 识别到:', transcript);
                this.processCommand(transcript);
            };
            
            this.recognition.onend = () => {
                this.listening = false;
                this.updateButton();
            };
            
            this.recognition.onerror = (e) => {
                console.error('语音识别错误:', e.error);
                this.listening = false;
                this.updateButton();
            };
        }
        
        // 语音合成
        this.synthesis = window.speechSynthesis;
        
        console.log('🎤 语音系统已初始化');
    },
    
    startListening() {
        if (!this.recognition) {
            alert('您的浏览器不支持语音识别');
            return;
        }
        this.listening = true;
        this.recognition.start();
        this.updateButton();
        AudioSystem.playClick();
    },
    
    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
            this.listening = false;
            this.updateButton();
        }
    },
    
    speak(text) {
        if (!this.synthesis) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        this.synthesis.speak(utterance);
    },
    
    processCommand(text) {
        const cmd = text.toLowerCase();
        
        if (cmd.includes('谁') || cmd.includes('在哪')) {
            // 查找角色
            characters.forEach(char => {
                if (cmd.includes(char.name) || cmd.includes(char.role)) {
                    this.speak(`${char.name}在${ZONES[char.zone]?.name || char.zone}，正在${char.task || '待命'}`);
                }
            });
        } else if (cmd.includes('任务') || cmd.includes('做什么')) {
            // 播报所有角色任务
            let report = '当前任务状态：';
            characters.forEach(char => {
                report += `${char.name}: ${char.task || '待命'}。`;
            });
            this.speak(report);
        } else if (cmd.includes('休息') || cmd.includes('摸鱼')) {
            // 随机让一个角色摸鱼
            const randomChar = characters[Math.floor(Math.random() * characters.length)];
            randomChar.status = 'idle';
            randomChar.zone = 'break';
            randomChar.task = '摸鱼中';
            this.speak(`让${randomChar.name}去休息区摸鱼了`);
        } else if (cmd.includes('工作')) {
            // 随机分配任务
            const tasks = ['整理文档', '写代码', '测试', '搜索信息'];
            const randomChar = characters[Math.floor(Math.random() * characters.length)];
            const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
            randomChar.task = randomTask;
            this.speak(`给${randomChar.name}分配了${randomTask}任务`);
        } else {
            this.speak('抱歉，我没听清楚。请试试问"谁在工作"或"任务是什么"');
        }
    },
    
    updateButton() {
        const btn = document.getElementById('voice-btn');
        if (btn) {
            btn.textContent = this.listening ? '🔴' : '🎤';
            btn.classList.toggle('listening', this.listening);
        }
    },
    
    toggle() {
        if (this.listening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
};

// 快捷键注册
document.addEventListener('keydown', (e) => {
    if (e.key === 'v' && e.altKey) {
        VoiceSystem.toggle();
    }
});

// ==================== 迭代47: 节日主题系统 ====================
const HolidayThemeSystem = {
    current: null,
    
    themes: {
        spring: {
            name: '🧧 春节主题',
            bg: '#8B0000',
            panel: '#B22222',
            border: '#FFD700',
            text: '#FFF8DC',
            accent: '#FF4500',
            special: '🧧'
        },
        christmas: {
            name: '🎄 圣诞主题',
            bg: '#0F4A0F',
            panel: '#1E5631',
            border: '#DC143C',
            text: '#F0FFF0',
            accent: '#FFD700',
            special: '🎄'
        },
        halloween: {
            name: '🎃 万圣节主题',
            bg: '#1A1A2E',
            panel: '#16213E',
            border: '#FF6600',
            text: '#E8E8E8',
            accent: '#FFA500',
            special: '🎃'
        }
    },
    
    apply(themeName) {
        if (!this.themes[themeName]) {
            console.error('未知主题:', themeName);
            return;
        }
        
        // 恢复默认主题
        if (this.current) {
            ThemeSystem.apply();
        }
        
        this.current = themeName;
        const theme = this.themes[themeName];
        
        // 应用节日主题
        document.documentElement.style.setProperty('--bg-dark', theme.bg);
        document.documentElement.style.setProperty('--bg-panel', theme.panel);
        document.documentElement.style.setProperty('--border', theme.border);
        document.documentElement.style.setProperty('--text-primary', theme.text);
        document.documentElement.style.setProperty('--accent', theme.accent);
        
        // 添加节日特效
        this.addHolidayEffects(theme.special);
        
        console.log(`🎉 节日主题已切换: ${theme.name}`);
        AudioSystem.playClick();
    },
    
    addHolidayEffects(emoji) {
        // 在每个区域添加节日标记
        const header = document.querySelector('.header');
        if (header) {
            header.innerHTML = `<span class="holiday-decor">${emoji}</span> ` + header.innerHTML;
        }
        
        // 添加雪花效果（圣诞主题）
        if (this.current === 'christmas') {
            this.createSnowflakes();
        }
        
        // 添加灯笼效果（春节主题）
        if (this.current === 'spring') {
            this.createLanterns();
        }
    },
    
    createSnowflakes() {
        const canvas = document.createElement('canvas');
        canvas.id = 'snow-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const flakes = [];
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        
        for (let i = 0; i < 50; i++) {
            flakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 3 + 1,
                d: Math.random() * 1 + 0.5
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            
            flakes.forEach(flake => {
                ctx.moveTo(flake.x, flake.y);
                ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2, true);
            });
            ctx.fill();
            
            flakes.forEach(flake => {
                flake.y += flake.d;
                flake.x += Math.sin(flake.y / 50) * 0.5;
                
                if (flake.y > canvas.height) {
                    flake.y = 0;
                    flake.x = Math.random() * canvas.width;
                }
            });
            
            if (HolidayThemeSystem.current === 'christmas') {
                requestAnimationFrame(animate);
            }
        };
        animate();
    },
    
    createLanterns() {
        const decor = document.createElement('div');
        decor.id = 'lanterns';
        decor.style.cssText = 'position:fixed;top:0;left:0;width:100%;pointer-events:none;z-index:9998;display:flex;justify-content:space-around;padding:10px;';
        
        for (let i = 0; i < 8; i++) {
            const lantern = document.createElement('div');
            lantern.textContent = '🧧';
            lantern.style.cssText = 'font-size:32px;animation:bounce 2s infinite;';
            lantern.style.animationDelay = `${i * 0.2}s`;
            decor.appendChild(lantern);
        }
        
        document.body.appendChild(decor);
    },
    
    clear() {
        if (this.current) {
            ThemeSystem.apply();
            
            // 清除特效
            document.getElementById('snow-canvas')?.remove();
            document.getElementById('lanterns')?.remove();
            document.querySelector('.holiday-decor')?.remove();
            
            this.current = null;
            console.log('🎉 节日主题已清除');
            AudioSystem.playClick();
        }
    }
};

// ==================== 迭代47: 快捷键更新 ====================
// 快捷键: V 语音交互 | S 春节主题 | C 圣诞主题 | H 万圣节 | Esc 清除主题

document.addEventListener('keydown', (e) => {
    if (e.key === 's' && e.altKey) {
        HolidayThemeSystem.apply('spring');
    } else if (e.key === 'c' && e.altKey) {
        HolidayThemeSystem.apply('christmas');
    } else if (e.key === 'h' && e.altKey) {
        HolidayThemeSystem.apply('halloween');
    } else if (e.key === 'Escape') {
        HolidayThemeSystem.clear();
    }
});

// 修改初始化函数
const originalInit47 = init;
init = function() {
    originalInit47();
    VoiceSystem.init();
    console.log('🎤 迭代47功能已加载: 语音交互 | 节日主题');
    console.log('⌨️ 新快捷键: Alt+V 语音 | Alt+S 春节 | Alt+C 圣诞 | Alt+H 万圣 | Esc 清除');
};
