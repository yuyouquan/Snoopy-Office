// OpenClaw Status API for Snoopy-Office
// This endpoint provides real-time status from OpenClaw sessions

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // For now, return mock data that simulates OpenClaw status
    // In production, this would connect to OpenClaw's internal API
    const characters = generateCharacterData();
    
    const working = characters.filter(c => c.status === 'working').length;
    const idle = characters.length - working;
    const totalProgress = Math.round(characters.reduce((sum, c) => sum + c.progress, 0) / characters.length);

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
  } catch (error) {
    console.error('Error fetching OpenClaw status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
