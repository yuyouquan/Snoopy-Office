// Star Office UI - Cron执行历史分析
// 显示Cron任务的详细执行日志、耗时、成功/失败统计

const cronHistoryState = {
  selectedJobId: null,
  jobRunHistory: {},
  filterStatus: 'all',  // all, success, failed
};

// ─── 获取Cron任务运行历史 ──────────────────────────

async function fetchCronJobRunHistory(jobId) {
  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';
    const resp = await fetch(`${base}/openclaw/cron/${jobId}/runs?t=${Date.now()}`, { cache: 'no-store' });
    const data = await resp.json();
    if (data.ok) {
      cronHistoryState.jobRunHistory[jobId] = data.runs || [];
      return data.runs || [];
    }
  } catch (e) {
    console.error('获取Cron运行历史失败:', e);
  }
  return [];
}

// ─── 分析Cron执行统计 ──────────────────────────

function analyzeJobStats(runs) {
  if (!runs || runs.length === 0) {
    return { total: 0, success: 0, failed: 0, avgDuration: 0, successRate: 0 };
  }

  const success = runs.filter(r => r.status === 'ok' || r.status === 'success').length;
  const failed = runs.filter(r => r.status === 'error' || r.status === 'failed').length;
  const avgDuration = runs.reduce((sum, r) => sum + (r.duration || 0), 0) / runs.length;
  const successRate = (success / runs.length * 100).toFixed(1);

  return {
    total: runs.length,
    success,
    failed,
    avgDuration: avgDuration.toFixed(2),
    successRate,
  };
}

// ─── 格式化时间 ──────────────────────────

function formatTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(ms) {
  if (!ms) return '—';
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  return (ms / 60000).toFixed(1) + 'm';
}

// ─── 显示Cron历史面板 ──────────────────────────

function showCronHistoryPanel() {
  if (document.getElementById('cron-history-panel')) {
    document.getElementById('cron-history-panel').remove();
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'cron-history-panel';
  panel.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #1a1a2e; border: 2px solid #3b82f6; border-radius: 8px;
    padding: 20px; width: 90%; max-width: 800px; max-height: 80vh;
    overflow-y: auto; z-index: 10000; color: #fff;
    font-family: ArkPixel, monospace; font-size: 12px;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #3b82f6;">⏰ Cron执行历史</h2>
      <button id="close-cron-history" style="background: #444; color: #fff; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">关闭</button>
    </div>

    <div style="margin-bottom: 20px; padding: 15px; background: #0f0f1a; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #9ca3af;">任务列表</h3>
      <div id="cron-jobs-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;"></div>
    </div>

    <div id="cron-details" style="display: none; margin-bottom: 20px; padding: 15px; background: #0f0f1a; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #9ca3af;">任务详情</h3>
      <div id="task-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 15px;"></div>

      <div style="margin-bottom: 15px;">
        <label style="color: #9ca3af; font-size: 11px;">筛选:
          <select id="filter-status" style="background: #1a1a2e; color: #fff; border: 1px solid #444; padding: 4px; margin-left: 5px;">
            <option value="all">全部</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
          </select>
        </label>
      </div>

      <div id="runs-table" style="max-height: 300px; overflow-y: auto; border: 1px solid #444; border-radius: 4px;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // 获取所有Cron任务
  const openclawData = window.openclawData || { cronJobs: [] };
  const cronJobs = openclawData.cronJobs || [];

  const jobsList = document.getElementById('cron-jobs-list');
  cronJobs.forEach(job => {
    const btn = document.createElement('button');
    btn.textContent = job.name || job.id;
    btn.style.cssText = `
      padding: 10px; background: #3b82f6; color: #fff;
      border: none; border-radius: 4px; cursor: pointer;
      transition: all 0.2s; font-family: inherit; font-size: inherit;
    `;
    btn.onmouseover = () => btn.style.background = '#2563eb';
    btn.onmouseout = () => btn.style.background = '#3b82f6';
    btn.onclick = async () => {
      cronHistoryState.selectedJobId = job.id;
      const runs = await fetchCronJobRunHistory(job.id);
      displayCronHistory(job, runs);
    };
    jobsList.appendChild(btn);
  });

  document.getElementById('close-cron-history').onclick = () => panel.remove();

  // 关闭按钮
  document.getElementById('filter-status').onchange = () => {
    if (cronHistoryState.selectedJobId) {
      const runs = cronHistoryState.jobRunHistory[cronHistoryState.selectedJobId] || [];
      const filtered = filterRunsByStatus(runs);
      displayRunsTable(filtered);
    }
  };
}

function filterRunsByStatus(runs) {
  const status = document.getElementById('filter-status')?.value || 'all';
  if (status === 'all') return runs;
  if (status === 'success') return runs.filter(r => r.status === 'ok' || r.status === 'success');
  if (status === 'failed') return runs.filter(r => r.status === 'error' || r.status === 'failed');
  return runs;
}

function displayCronHistory(job, runs) {
  const detailsDiv = document.getElementById('cron-details');
  detailsDiv.style.display = 'block';

  const stats = analyzeJobStats(runs);

  const statsHtml = `
    <div style="padding: 10px; background: #1f2937; border-radius: 4px; text-align: center;">
      <div style="color: #9ca3af;">总运行</div>
      <div style="font-size: 18px; font-weight: bold; color: #fff;">${stats.total}</div>
    </div>
    <div style="padding: 10px; background: #1f2937; border-radius: 4px; text-align: center;">
      <div style="color: #22c55e;">成功</div>
      <div style="font-size: 18px; font-weight: bold; color: #22c55e;">${stats.success}</div>
    </div>
    <div style="padding: 10px; background: #1f2937; border-radius: 4px; text-align: center;">
      <div style="color: #ef4444;">失败</div>
      <div style="font-size: 18px; font-weight: bold; color: #ef4444;">${stats.failed}</div>
    </div>
    <div style="padding: 10px; background: #1f2937; border-radius: 4px; text-align: center;">
      <div style="color: #fbbf24;">成功率</div>
      <div style="font-size: 18px; font-weight: bold; color: #fbbf24;">${stats.successRate}%</div>
    </div>
  `;

  document.getElementById('task-stats').innerHTML = statsHtml;

  const filtered = filterRunsByStatus(runs);
  displayRunsTable(filtered);
}

function displayRunsTable(runs) {
  const tableHtml = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead style="position: sticky; top: 0; background: #0f0f1a;">
          <tr style="border-bottom: 1px solid #444;">
            <th style="padding: 8px; text-align: left; color: #9ca3af;">时间</th>
            <th style="padding: 8px; text-align: left; color: #9ca3af;">状态</th>
            <th style="padding: 8px; text-align: left; color: #9ca3af;">耗时</th>
            <th style="padding: 8px; text-align: left; color: #9ca3af;">详情</th>
          </tr>
        </thead>
        <tbody>
          ${runs.slice(0, 20).map(run => {
            const statusColor = (run.status === 'ok' || run.status === 'success') ? '#22c55e' : '#ef4444';
            const statusText = (run.status === 'ok' || run.status === 'success') ? '✓' : '✗';
            return `
              <tr style="border-bottom: 1px solid #2a2a3e;">
                <td style="padding: 8px; color: #9ca3af;">${formatTime(run.timestamp)}</td>
                <td style="padding: 8px; color: ${statusColor}; font-weight: bold;">${statusText}</td>
                <td style="padding: 8px; color: #9ca3af;">${formatDuration(run.duration)}</td>
                <td style="padding: 8px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;" title="${run.message || ''}">${run.message || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('runs-table').innerHTML = tableHtml;
}

// ─── 集成到Cron面板 ──────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const cronTitle = document.querySelector('[id*="cron"]');
  if (cronTitle || document.querySelector('.cron-panel')) {
    // 添加历史按钮到Cron面板
    setTimeout(() => {
      const button = document.createElement('button');
      button.textContent = '📊 历史';
      button.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        padding: 12px 16px; background: #8b5cf6; color: #fff;
        border: none; border-radius: 4px; cursor: pointer;
        font-family: ArkPixel, monospace; font-size: 12px;
        z-index: 999; transition: all 0.2s;
      `;
      button.onmouseover = () => button.style.background = '#7c3aed';
      button.onmouseout = () => button.style.background = '#8b5cf6';
      button.onclick = showCronHistoryPanel;
      document.body.appendChild(button);
    }, 1000);
  }
});

window.showCronHistoryPanel = showCronHistoryPanel;
