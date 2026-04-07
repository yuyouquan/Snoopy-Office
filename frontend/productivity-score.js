// Snoopy小龙虾办公室 - 今日效率积分
// 综合评分系统，展示今天的工作成果

const ProductivityScore = (() => {
  const motivationalMessages = {
    '0-20': [
      '今天有点疲惫呢，多喝点水休息一下吧 💧',
      '摸鱼有理，休息也是工作的一部分 🐟',
      '给自己一个开始的理由，从现在开始 🚀',
      '每一天都是新的开始，不妨慢慢来 🌱'
    ],
    '21-40': [
      '不错呢，逐渐找到节奏了 🎵',
      '持续发力，今天会更好的 💪',
      '稳步前进，好事正在发生 ⭐',
      '你做得比想象中更好 🌟'
    ],
    '41-60': [
      '很棒啊，今天收获不少 🎉',
      '效率不错，保持这个状态 🔥',
      '有所作为的一天呢 💯',
      '工作和生活找到了平衡点 ⚖️'
    ],
    '61-80': [
      '太厉害了，今天状态爆棚 💥',
      '这就是你的最佳表现 🏆',
      '今天你就是办公室的MVP 👑',
      '效率爆表，继续加油 ⚡'
    ],
    '81-100': [
      '天哪，今天简直无敌了 🚀',
      '你就是传说中的效率大师 🧙',
      '今天的表现令人印象深刻 ✨',
      '完美的一天就在眼前 💎'
    ]
  };

  function getMotivationalMessage(score) {
    let range;
    if (score <= 20) range = '0-20';
    else if (score <= 40) range = '21-40';
    else if (score <= 60) range = '41-60';
    else if (score <= 80) range = '61-80';
    else range = '81-100';

    const messages = motivationalMessages[range];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function getScoreColor(score) {
    // 0-40 红色，41-70 黄色，71-100 绿色
    if (score <= 40) {
      const ratio = score / 40;
      const r = Math.round(239 * (1 - ratio * 0.5));
      const g = Math.round(68 * (1 - ratio * 0.5));
      const b = Math.round(68 * (1 - ratio * 0.5));
      return `rgb(${r},${g},${b})`;
    } else if (score <= 70) {
      const ratio = (score - 40) / 30;
      const r = Math.round(239 - ratio * 100);
      const g = Math.round(188);
      const b = Math.round(68 - ratio * 68);
      return `rgb(${r},${g},${b})`;
    } else {
      const ratio = (score - 70) / 30;
      const r = Math.round(139 - ratio * 139);
      const g = Math.round(188);
      const b = Math.round(0);
      return `rgb(${r},${g},${b})`;
    }
  }

  function renderStars(level) {
    let stars = '';
    for (let i = 0; i < 4; i++) {
      stars += i < level ? '⭐' : '☆';
    }
    return stars;
  }

  async function fetchAndCalculateScore() {
    try {
      const apiBase = window.getApiBase?.() || '';

      // 并行获取数据
      const [heatmapRes, timelineRes] = await Promise.all([
        fetch(apiBase + '/stats/heatmap?t=' + Date.now()).catch(() => null),
        fetch(apiBase + '/stats/today-timeline?t=' + Date.now()).catch(() => null)
      ]);

      const heatmapData = heatmapRes?.ok ? await heatmapRes.json() : null;
      const timelineData = timelineRes?.ok ? await timelineRes.json() : null;

      if (!heatmapData || !timelineData) {
        console.warn('无法获取效率数据');
        return null;
      }

      // 提取数据
      const level = heatmapData.days?.[0]?.level || 0;
      const streak = heatmapData.summary?.currentStreak || 0;
      const activeMin = timelineData.totalActiveMin || 0;

      // 计算健康度
      const cronJobs = window.openclawData?.cronJobs || [];
      const healthCount = cronJobs.filter(j => j.lastStatus === 'ok').length;
      const healthPct = cronJobs.length > 0 ? healthCount / cronJobs.length : 0.5;

      // 积分公式
      const activityScore = level * 25; // 0-100
      const timeBonus = Math.min(35, (activeMin / 480) * 35);
      const healthBonus = healthPct * 25;
      const streakBonus = Math.min(15, Math.max(0, (streak - 1) * 3));

      const totalScore = Math.round(
        Math.min(100, activityScore + timeBonus + healthBonus + streakBonus)
      );

      return {
        score: totalScore,
        level: Math.min(4, level),
        streak,
        activeMin,
        healthPct,
        message: getMotivationalMessage(totalScore)
      };
    } catch (err) {
      console.error('计算效率积分出错:', err);
      return null;
    }
  }

  function render(data) {
    const container = document.getElementById('productivity-container');
    if (!container || !data) return;

    const scoreColor = getScoreColor(data.score);
    const stars = renderStars(data.level);

    let streakHtml = '';
    if (data.streak >= 3) {
      streakHtml = `<div style="color:#ff6b6b;font-size:13px;margin-top:8px;display:flex;align-items:center;gap:4px;">🔥 <span style="font-weight:bold;">${data.streak}天连续</span></div>`;
    }

    const html = `
      <div style="display:flex;flex-direction:column;gap:10px;padding:8px 0;">
        <div style="text-align:center;">
          <div style="font-size:42px;font-weight:bold;color:${scoreColor};letter-spacing:2px;">${data.score}</div>
          <div style="color:#9ca3af;font-size:11px;margin-top:2px;">今日效率得分</div>
        </div>
        <div style="text-align:center;font-size:18px;letter-spacing:2px;">${stars}</div>
        ${streakHtml}
        <div style="color:#d1d5db;font-size:12px;text-align:center;line-height:1.5;font-style:italic;">"${data.message}"</div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function refresh() {
    const data = await fetchAndCalculateScore();
    if (data) {
      render(data);
    }
  }

  return {
    refresh
  };
})();

// 暴露到全局，供外部调用
window.refreshProductivityScore = () => {
  ProductivityScore.refresh();
};

// 初始化时调用一次
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    ProductivityScore.refresh();
  }, 1000);
});
