/**
 * Snoopy-Office 像素办公室游戏引擎
 * Phase 1 MVP - 核心功能实现
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
let gameSpeed = 1; // 动画速度控制

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
    'Escape': null, // 关闭面板
    'ArrowUp': () => moveSelection(-1),
    'ArrowDown': () => moveSelection(1),
    '+': () => { gameSpeed = Math.min(3, gameSpeed + 0.5); },
    '-': () => { gameSpeed = Math.max(0.5, gameSpeed - 0.5); }
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
    
    // 移动端触摸支持
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    // 响应式画布
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 启动游戏循环
    gameLoop();
    
    // 更新时间显示
    updateTime();
    setInterval(updateTime, 1000);
    
    // 模拟状态变化
    simulateStatusChanges();
    
    // 初始统计更新
    updateStats();
    
    console.log('🎮 Snoopy-Office 已启动');
    console.log('⌨️ 快捷键: 1-8 选择角色, ESC 关闭, +/- 调整速度');
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
    // 角色随机移动（轻微动画效果）
    characters.forEach(char => {
        if (char.status === 'idle') {
            char.x = char.x || getZoneCenter(char.zone).x;
            char.y = char.y || getZoneCenter(char.zone).y;
            // 轻微晃动
            char.offsetX = Math.sin(animationFrame * 0.05 + char.id.charCodeAt(0)) * 2;
            char.offsetY = Math.cos(animationFrame * 0.03 + char.id.charCodeAt(0)) * 2;
        } else {
            char.offsetX = Math.sin(animationFrame * 0.1) * 1;
            char.offsetY = 0;
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
        ctx.fillStyle = zone.color + '40'; // 透明背景
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
        
        // 绘制角色身体（像素风格）
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
    
    // 眼睛 - 工作时闪烁
    ctx.fillStyle = COLORS.black;
    if (char.status === 'working' && Math.floor(animationFrame / 30) % 2 === 0) {
        ctx.fillStyle = COLORS.green; // 工作时眼睛发绿光
    }
    ctx.fillRect(x - 5, y - 14, 3, 3);
    ctx.fillRect(x + 2, y - 14, 3, 3);
    
    // 根据角色绘制特殊标识
    ctx.fillStyle = COLORS.white;
    switch (char.role) {
        case '用户':
            // 领带
            ctx.fillRect(x - 2, y - 5, 4, 8);
            break;
        case '主助手':
            // 天线 - 工作时闪烁
            ctx.fillRect(x - 1, y - 24, 2, 6);
            ctx.fillStyle = (char.status === 'working' && Math.floor(animationFrame / 20) % 2 === 0) ? COLORS.yellow : COLORS.green;
            ctx.fillRect(x - 2, y - 25, 4, 2);
            break;
        case '开发':
            // 眼镜
            ctx.fillStyle = COLORS.blue;
            ctx.fillRect(x - 7, y - 14, 14, 2);
            break;
        case '测试':
            // 放大镜
            ctx.fillStyle = COLORS.lightGray;
            ctx.fillRect(x + 6, y - 8, 6, 6);
            break;
    }
    
    // 状态指示器 - 优化动画
    const statusColor = char.status === 'working' ? COLORS.green : COLORS.orange;
    const blinkOn = Math.floor(animationFrame / (char.status === 'working' ? 15 : 40)) % 2 === 0;
    
    if (blinkOn) {
        ctx.fillStyle = statusColor;
        ctx.fillRect(x - 12, y - 22, 4, 4);
        ctx.fillRect(x + 8, y - 22, 4, 4);
    }
}

function drawTaskBubble(x, y, char) {
    // 气泡背景
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x - 30, y - 12, 60, 20);
    
    // 气泡边框
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 30, y - 12, 60, 20);
    
    // 气泡三角
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 8);
    ctx.lineTo(x, y + 15);
    ctx.lineTo(x + 5, y + 8);
    ctx.fill();
    ctx.stroke();
    
    // 任务文字
    ctx.fillStyle = COLORS.black;
    ctx.font = '8px "Courier New"';
    const task = char.task.length > 8 ? char.task.substring(0, 7) + '..' : char.task;
    ctx.fillText(task, x - 25, y + 3);
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查点击是否在角色上
    const clickedChar = characters.find(char => {
        const pos = getCharacterPosition(char);
        const charX = pos.x || getZoneCenter(char.zone).x;
        const charY = pos.y || getZoneCenter(char.zone).y;
        return Math.abs(x - charX) < 20 && Math.abs(y - charY) < 25;
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

function showCharacterPanel(char) {
    const panel = document.getElementById('character-panel');
    panel.classList.remove('hidden');
    
    document.getElementById('panel-name').textContent = char.name;
    document.getElementById('panel-status').textContent = char.status === 'working' ? '工作中' : '待命/摸鱼';
    document.getElementById('panel-progress').style.width = char.progress + '%';
    document.getElementById('panel-location').textContent = ZONES[char.zone]?.name || char.zone;
    document.getElementById('panel-task').textContent = char.task || '暂无任务';
    
    // 显示任务时间轴
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

// 响应式画布适配
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = container.clientWidth - 40;
    const scale = Math.min(maxWidth / 800, 1);
    canvas.style.width = (800 * scale) + 'px';
    canvas.style.height = (600 * scale) + 'px';
}

// 触摸事件处理
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    const clickedChar = characters.find(char => {
        const pos = getCharacterPosition(char);
        const charX = pos.x || getZoneCenter(char.zone).x;
        const charY = pos.y || getZoneCenter(char.zone).y;
        return Math.abs(x - charX) < 25 && Math.abs(y - charY) < 30;
    });
    
    if (clickedChar) {
        selectedCharacter = clickedChar.id;
        showCharacterPanel(clickedChar);
    } else {
        selectedCharacter = null;
        closePanel();
    }
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
    
    // 更新统计面板
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

// ==================== 模拟状态变化 ====================

function simulateStatusChanges() {
    // 每10秒随机更新一个角色的状态
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * characters.length);
        const char = characters[randomIndex];
        
        // 随机改变进度
        char.progress = Math.min(100, char.progress + Math.floor(Math.random() * 20));
        
        // 如果进度满了，随机切换任务
        if (char.progress >= 100) {
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
            const taskList = tasks[char.role] || tasks[char.name] || ['工作中'];
            const newTask = taskList[Math.floor(Math.random() * taskList.length)];
            
            // 记录任务完成到历史
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            char.history = char.history || [];
            char.history.push({
                time: timeStr,
                task: char.task,
                completed: true
            });
            // 保留最近10条记录
            if (char.history.length > 10) {
                char.history = char.history.slice(-10);
            }
            
            char.task = newTask;
            char.progress = 0;
            
            // 任务完成音效
            AudioSystem.playTaskComplete();
            
            // 30%概率更换区域（模拟角色移动）
            if (Math.random() < 0.3) {
                const zoneKeys = Object.keys(ZONES);
                const currentZoneIndex = zoneKeys.indexOf(char.zone);
                // 移动到相邻区域
                const newZoneIndex = (currentZoneIndex + Math.floor(Math.random() * 3) + 1) % zoneKeys.length;
                char.zone = zoneKeys[newZoneIndex];
            }
        }
        
        // 更新面板（如果当前选中）
        if (selectedCharacter === char.id) {
            showCharacterPanel(char);
        }
    }, 5000);
}

// ==================== 状态获取（模拟OpenClaw API） ====================

// 模拟从OpenClaw获取状态
async function fetchOpenClawStatus() {
    try {
        // 实际项目中替换为真实API调用
        // const response = await fetch('/api/status');
        // return await response.json();
        
        // 模拟返回数据
        return {
            timestamp: Date.now(),
            roles: characters.map(c => ({
                id: c.id,
                task: c.task,
                progress: c.progress,
                status: c.status
            }))
        };
    } catch (error) {
        console.error('获取状态失败:', error);
        return null;
    }
}

// 定时获取状态（每5秒）
setInterval(async () => {
    const status = await fetchOpenClawStatus();
    if (status) {
        updateCharactersFromStatus(status);
    }
}, 5000);

function updateCharactersFromStatus(status) {
    status.roles.forEach(roleData => {
        const char = characters.find(c => c.id === roleData.id);
        if (char) {
            char.task = roleData.task;
            char.progress = roleData.progress;
            char.status = roleData.status;
        }
    });
}

// ==================== 启动 ====================

function toggleSound() {
    AudioSystem.enabled = !AudioSystem.enabled;
    const btn = document.getElementById('sound-toggle');
    btn.textContent = AudioSystem.enabled ? '🔊' : '🔇';
    if (AudioSystem.enabled) {
        AudioSystem.playClick();
    }
}

window.onload = init;
