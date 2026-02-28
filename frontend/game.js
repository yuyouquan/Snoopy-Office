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

// 实时数据API配置
const API_CONFIG = {
    // 本地API端点
    localEndpoint: '/api/status',
    // 静态JSON fallback (放在根目录避免SPA路由问题)
    staticEndpoint: '/static-data.json',
    // 模拟数据间隔
    simulationInterval: 5000,
    // 重试次数
    maxRetries: 3
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
            char.progress = Math.min(100, char.progress + Math.floor(Math.random() * 5 * gameSpeed));
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
    }, API_CONFIG.simulationInterval);
    
    // 初始统计更新
    updateStats();
    
    console.log('🎮 Snoopy-Office 已启动');
    console.log('⌨️ 快捷键: 1-8 选择角色, ESC 关闭, +/- 调整速度, R 切换实时数据');
}

// ==================== 游戏循环 ====================

function gameLoop() {
    if (!isRunning) return;
    
    update();
    render();
    
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
    
    // 绘制区域
    drawZones();
    
    // 绘制角色
    drawCharacters();
    
    // 绘制选中高亮
    if (selectedCharacter) {
        drawSelectionHighlight();
    }
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
        
        // 区域边框
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        // 区域名称
        ctx.fillStyle = COLORS.white;
        ctx.font = '12px "Courier New"';
        ctx.fillText(zone.name, zone.x + 5, zone.y + 15);
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
        
        // 绘制角色
        drawPixelCharacter(x + (char.offsetX || 0), y + (char.offsetY || 0), char);
        
        // 绘制任务气泡
        if (char.status === 'working') {
            drawTaskBubble(x, y - 35, char);
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
    const working = characters.filter(c => c.status === 'working').length;
    const idle = characters.filter(c => c.status !== 'working').length;
    const avgProgress = Math.round(characters.reduce((sum, c) => sum + c.progress, 0) / characters.length);
    
    document.getElementById('stat-working').textContent = working;
    document.getElementById('stat-idle').textContent = idle;
    document.getElementById('stat-progress').textContent = avgProgress + '%';
    document.getElementById('stat-speed').textContent = gameSpeed.toFixed(1) + 'x';
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

// 游戏循环增强
const originalGameLoop = gameLoop;
gameLoop = function() {
    updateCharacterPositions();
    originalGameLoop();
};

window.onload = init;
