// SSE (Server-Sent Events) API for real-time updates
// This endpoint provides real-time status streaming from OpenClaw

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Generate character data periodically
  const characters = generateCharacterData();
  let iteration = 0;
  
  const intervalId = setInterval(() => {
    iteration++;
    
    // Update character progress
    characters.forEach(char => {
      if (char.status === 'working' && char.progress < 100) {
        char.progress = Math.min(100, char.progress + Math.floor(Math.random() * 3));
      }
      
      // Occasionally change status
      if (Math.random() < 0.05) {
        char.status = char.status === 'working' ? 'idle' : 'working';
      }
      
      // Occasionally complete task and start new one
      if (char.progress >= 100) {
        const taskList = getTaskList(char.role);
        char.task = taskList[Math.floor(Math.random() * taskList.length)];
        char.progress = 0;
      }
    });

    const stats = {
      working: characters.filter(c => c.status === 'working').length,
      idle: characters.filter(c => c.status === 'idle').length,
      total: characters.length,
      progress: Math.round(characters.reduce((sum, c) => sum + c.progress, 0) / characters.length)
    };

    const data = {
      type: 'update',
      timestamp: Date.now(),
      iteration,
      data: {
        characters,
        stats
      }
    };

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 3000); // Update every 3 seconds

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    console.log('SSE client disconnected');
  });
}

function generateCharacterData() {
  const tasks = {
    boss: { task: '下达指令', progress: 100 },
    ai: { task: '协调任务', progress: Math.floor(Math.random() * 100) },
    pm: { task: '整理需求文档', progress: Math.floor(Math.random() * 100) },
    pm_manager: { task: '协调进度', progress: Math.floor(Math.random() * 100) },
    fe: { task: '实现UI组件', progress: Math.floor(Math.random() * 100) },
    be: { task: '编写API接口', progress: Math.floor(Math.random() * 100) },
    qa: { task: '执行测试用例', progress: Math.floor(Math.random() * 100) },
    security: { task: '漏洞扫描', progress: Math.floor(Math.random() * 100) },
    miner: { task: '搜索信息', progress: Math.floor(Math.random() * 100) },
    writer: { task: '创作小说', progress: Math.floor(Math.random() * 100) }
  };

  const zones = ['boss', 'ai', 'pm', 'project', 'dev', 'dev', 'test', 'security', 'search', 'break'];
  const names = ['👔 老板', '🤖 AI助手', '📋 产品经理', '📊 项目经理', '💻 前端开发', '⚙️ 后端开发', '🧪 测试工程师', '🔒 安全专家', '🔍 新闻矿工', '✍️ 小说家'];
  const ids = ['boss', 'ai', 'pm', 'pm_manager', 'fe', 'be', 'qa', 'security', 'miner', 'writer'];

  return ids.map((id, i) => ({
    id,
    name: names[i],
    status: Math.random() > 0.2 ? 'working' : 'idle',
    task: tasks[id].task,
    progress: tasks[id].progress,
    zone: zones[i]
  }));
}

function getTaskList(role) {
  const tasks = {
    'boss': ['下达指令', '开会', '审批文件', '战略规划'],
    'ai': ['分配任务', '协调进度', '审核代码', '回复用户'],
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
    'writer': ['创作小说', '构思情节', '修改稿子', '发布章节'],
    '创作': ['创作小说', '构思情节', '修改稿子', '发布章节']
  };
  return tasks[role] || ['工作中'];
}
