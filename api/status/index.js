/**
 * Snoopy-Office 状态API
 * 提供实时角色状态数据
 * 使用标准Vercel API格式
 */

const STATUSES = ['working', 'idle', 'meeting', 'break'];

const TASKS = {
    boss: ['下达指令', '查看进度', '召开会议'],
    ai: ['分配任务', '回答问题', '协调工作'],
    pm: ['整理需求', '写PRD', '与客户沟通'],
    pm_manager: ['协调进度', '更新看板', '组织会议'],
    fe: ['实现UI', '修复BUG', '优化性能'],
    be: ['编写API', '优化数据库', '架构设计'],
    qa: ['执行测试', '编写用例', '报告BUG'],
    security: ['漏洞扫描', '安全审计', '加固系统'],
    miner: ['搜索信息', '整理资讯', '分析数据'],
    writer: ['创作小说', '修改稿子', '构思情节']
};

const ZONE_MAP = {
    boss: 'boss',
    ai: 'ai',
    pm: 'pm',
    pm_manager: 'meeting',
    fe: 'dev',
    be: 'dev',
    qa: 'test',
    security: 'security',
    miner: 'search',
    writer: 'break'
};

function generateCharacters() {
    return [
        { id: 'boss', name: '👔 老板', status: 'idle', task: TASKS.boss[Math.floor(Math.random() * TASKS.boss.length)], progress: 100, zone: 'boss' },
        { id: 'ai', name: '🤖 AI助手', status: 'working', task: TASKS.ai[Math.floor(Math.random() * TASKS.ai.length)], progress: Math.floor(60 + Math.random() * 40), zone: 'ai' },
        { id: 'pm', name: '📋 产品经理', status: 'working', task: TASKS.pm[Math.floor(Math.random() * TASKS.pm.length)], progress: Math.floor(40 + Math.random() * 50), zone: 'pm' },
        { id: 'pm_manager', name: '📊 项目经理', status: STATUSES[Math.floor(Math.random() * STATUSES.length)], task: TASKS.pm_manager[Math.floor(Math.random() * TASKS.pm_manager.length)], progress: Math.floor(Math.random() * 100), zone: 'meeting' },
        { id: 'fe', name: '💻 前端开发', status: 'working', task: TASKS.fe[Math.floor(Math.random() * TASKS.fe.length)], progress: Math.floor(20 + Math.random() * 60), zone: 'dev' },
        { id: 'be', name: '⚙️ 后端开发', status: 'working', task: TASKS.be[Math.floor(Math.random() * TASKS.be.length)], progress: Math.floor(30 + Math.random() * 50), zone: 'dev' },
        { id: 'qa', name: '🧪 测试工程师', status: 'working', task: TASKS.qa[Math.floor(Math.random() * TASKS.qa.length)], progress: Math.floor(10 + Math.random() * 50), zone: 'test' },
        { id: 'security', name: '🔒 安全专家', status: Math.random() > 0.5 ? 'working' : 'idle', task: TASKS.security[Math.floor(Math.random() * TASKS.security.length)], progress: Math.floor(Math.random() * 80), zone: 'security' },
        { id: 'miner', name: '🔍 新闻矿工', status: 'working', task: TASKS.miner[Math.floor(Math.random() * TASKS.miner.length)], progress: Math.floor(50 + Math.random() * 40), zone: 'search' },
        { id: 'writer', name: '✍️ 小说家', status: Math.random() > 0.3 ? 'working' : 'break', task: TASKS.writer[Math.floor(Math.random() * TASKS.writer.length)], progress: Math.floor(20 + Math.random() * 70), zone: 'break' }
    ];
}

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const characters = generateCharacters();
    const working = characters.filter(c => c.status === 'working').length;
    const idle = characters.filter(c => c.status === 'idle').length;
    const totalProgress = Math.floor(characters.reduce((sum, c) => sum + c.progress, 0) / characters.length);
    
    res.status(200).json({
        success: true,
        timestamp: Date.now(),
        data: {
            characters,
            stats: {
                working,
                idle,
                total: characters.length,
                progress: totalProgress
            }
        }
    });
}
