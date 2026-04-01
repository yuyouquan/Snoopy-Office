// Star Office UI - 导出报告功能
// 支持导出周报为PDF/CSV，包含统计图表、Cron执行记录

const exportState = {
  dateRange: 'week',  // week, month, custom
  startDate: null,
  endDate: null,
  format: 'csv',  // csv, pdf
};

// ─── 时间范围计算 ──────────────────────────────

function getDateRange(rangeType) {
  const today = new Date();
  let start, end = new Date(today);

  switch (rangeType) {
    case 'day':
      start = new Date(today);
      break;
    case 'week':
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      break;
    case 'month':
      start = new Date(today);
      start.setMonth(today.getMonth() - 1);
      break;
    default:
      start = new Date(today);
      start.setDate(today.getDate() - 7);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// ─── 数据聚合 ──────────────────────────────

async function collectReportData(dateRange) {
  try {
    const base = (typeof getApiBase === 'function') ? getApiBase() : '';

    // 获取统计数据
    const [timelineResp, weeklyResp, heatmapResp, statusResp] = await Promise.all([
      fetch(base + '/stats/today-timeline?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
      fetch(base + '/stats/weekly?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
      fetch(base + '/stats/heatmap?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
      fetch(base + '/status?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()),
    ]);

    return {
      timeline: timelineResp.ok ? timelineResp : {},
      weekly: weeklyResp.ok ? weeklyResp : {},
      heatmap: heatmapResp.ok ? heatmapResp : {},
      status: statusResp,
      generatedAt: new Date().toLocaleString('zh-CN'),
    };
  } catch (e) {
    console.error('收集报告数据失败:', e);
    return null;
  }
}

// ─── CSV 导出 ──────────────────────────────

function exportAsCSV(data, dateRange) {
  if (!data) return;

  let csv = '';

  // 头部信息
  csv += `Snoopy小龙虾办公室 - 工作报告\n`;
  csv += `生成时间,${data.generatedAt}\n`;
  csv += `报告周期,${dateRange.start} 至 ${dateRange.end}\n\n`;

  // 周统计
  csv += `# 本周统计\n`;
  if (data.weekly.days) {
    csv += `日期,报告数,有日记\n`;
    data.weekly.days.forEach(day => {
      csv += `${day.date},${day.reportCount || 0},${day.hasMemo ? '是' : '否'}\n`;
    });
  }
  csv += `总计,${data.weekly.totalReports || 0}\n\n`;

  // Cron健康度
  csv += `# Cron任务健康度\n`;
  if (data.weekly.cronHealth) {
    csv += `总任务数,${data.weekly.cronHealth.total}\n`;
    csv += `正常任务,${data.weekly.cronHealth.healthy}\n`;
    csv += `失败任务,${data.weekly.cronHealth.total - data.weekly.cronHealth.healthy}\n`;
    csv += `成功率,${((data.weekly.cronHealth.healthy / data.weekly.cronHealth.total) * 100).toFixed(1)}%\n\n`;
  }

  // 热力图数据
  csv += `# 活动热力图\n`;
  if (data.heatmap && data.heatmap.days) {
    csv += `日期,活跃度\n`;
    data.heatmap.days.forEach(day => {
      csv += `${day.date},${day.count || 0}\n`;
    });
  }

  // 下载
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Star-Office-Report-${dateRange.start}-to-${dateRange.end}.csv`;
  link.click();
}

// ─── PDF 导出 (使用HTML打印) ──────────────────

function exportAsPDF(data, dateRange) {
  if (!data) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>工作报告</title>
      <style>
        body { font-family: 'Microsoft YaHei', sans-serif; margin: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #3b82f6; color: white; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        .stat-row { display: flex; gap: 20px; margin: 10px 0; }
        .stat-item { flex: 1; padding: 10px; background: #f5f5f5; border-radius: 4px; }
        .stat-label { font-size: 12px; color: #666; }
        .stat-value { font-size: 20px; font-weight: bold; color: #3b82f6; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>📊 Snoopy小龙虾办公室 - 工作报告</h1>
      <div class="meta">
        <p>生成时间: ${data.generatedAt}</p>
        <p>报告周期: ${dateRange.start} 至 ${dateRange.end}</p>
      </div>

      <h2>📈 本周统计</h2>
      <div class="stat-row">
        <div class="stat-item">
          <div class="stat-label">总报告数</div>
          <div class="stat-value">${data.weekly.totalReports || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">有日记天数</div>
          <div class="stat-value">${(data.weekly.days || []).filter(d => d.hasMemo).length}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">活跃天数</div>
          <div class="stat-value">${(data.heatmap && data.heatmap.days || []).filter(d => d.count > 0).length}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>报告数</th>
            <th>有日记</th>
            <th>活跃度</th>
          </tr>
        </thead>
        <tbody>
          ${(data.weekly.days || []).map(day => {
            const heatDay = (data.heatmap && data.heatmap.days || []).find(h => h.date === day.date);
            return `
              <tr>
                <td>${day.date}</td>
                <td>${day.reportCount || 0}</td>
                <td>${day.hasMemo ? '✓' : '—'}</td>
                <td>${heatDay ? heatDay.count : 0}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <h2>⏰ Cron任务健康度</h2>
      <div class="stat-row">
        <div class="stat-item">
          <div class="stat-label">总任务数</div>
          <div class="stat-value">${data.weekly.cronHealth?.total || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">正常任务</div>
          <div class="stat-value" style="color: #22c55e;">${data.weekly.cronHealth?.healthy || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">失败任务</div>
          <div class="stat-value" style="color: #ef4444;">${(data.weekly.cronHealth?.total || 0) - (data.weekly.cronHealth?.healthy || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">成功率</div>
          <div class="stat-value">${data.weekly.cronHealth?.healthy && data.weekly.cronHealth?.total ? ((data.weekly.cronHealth.healthy / data.weekly.cronHealth.total) * 100).toFixed(1) : '0'}%</div>
        </div>
      </div>

      <script>
        // 自动打印
        setTimeout(() => window.print(), 500);
      </script>
    </body>
    </html>
  `;

  const win = window.open('', '', 'width=800,height=600');
  win.document.write(htmlContent);
  win.document.close();
}

// ─── UI 和按钮 ──────────────────────────────

function showExportModal() {
  if (document.getElementById('export-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'export-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 10000;
    display: flex; align-items: center; justify-content: center;
    font-family: ArkPixel, monospace;
  `;

  modal.innerHTML = `
    <div style="background: #1a1a2e; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; width: 90%; max-width: 400px; color: #fff;">
      <h3 style="margin-top: 0; color: #3b82f6;">📥 导出报告</h3>

      <label style="display: block; margin-bottom: 10px;">
        <span style="color: #9ca3af; font-size: 12px;">报告周期</span>
        <select id="export-range" style="width: 100%; padding: 8px; margin-top: 4px; background: #0f0f1a; color: #fff; border: 1px solid #444; border-radius: 4px;">
          <option value="day">今天</option>
          <option value="week" selected>本周 (7天)</option>
          <option value="month">本月 (30天)</option>
        </select>
      </label>

      <label style="display: block; margin-bottom: 20px;">
        <span style="color: #9ca3af; font-size: 12px;">导出格式</span>
        <select id="export-format" style="width: 100%; padding: 8px; margin-top: 4px; background: #0f0f1a; color: #fff; border: 1px solid #444; border-radius: 4px;">
          <option value="csv" selected>CSV (数据表)</option>
          <option value="pdf">PDF (打印预览)</option>
        </select>
      </label>

      <div style="display: flex; gap: 10px;">
        <button id="export-confirm" style="flex: 1; padding: 10px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">导出</button>
        <button id="export-cancel" style="flex: 1; padding: 10px; background: #444; color: #fff; border: none; border-radius: 4px; cursor: pointer;">取消</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('export-confirm').onclick = async () => {
    const range = document.getElementById('export-range').value;
    const format = document.getElementById('export-format').value;
    const dateRange = getDateRange(range);

    modal.remove();

    // 显示加载提示
    const toast = document.createElement('div');
    toast.textContent = '🔄 准备导出...';
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 10001;
      background: #3b82f6; color: #fff; padding: 12px 16px; border-radius: 4px;
      font-family: ArkPixel, monospace; font-size: 12px;
    `;
    document.body.appendChild(toast);

    const data = await collectReportData(dateRange);

    if (data) {
      if (format === 'csv') {
        exportAsCSV(data, dateRange);
        toast.textContent = '✅ CSV导出成功';
      } else {
        exportAsPDF(data, dateRange);
        toast.textContent = '✅ PDF已打开';
      }
    } else {
      toast.textContent = '❌ 导出失败';
    }

    setTimeout(() => toast.remove(), 3000);
  };

  document.getElementById('export-cancel').onclick = () => modal.remove();

  // 点击背景关闭
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

// ─── 导出按钮集成 ──────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 在stats-dashboard中添加导出按钮
  const statsTitle = document.querySelector('.sp-title');
  if (statsTitle) {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📥 导出';
    exportBtn.style.cssText = `
      margin-left: auto; padding: 4px 12px;
      background: #3b82f6; color: #fff;
      border: none; border-radius: 4px; font-size: 11px;
      cursor: pointer; font-family: ArkPixel, monospace;
    `;
    exportBtn.onclick = showExportModal;

    const parent = statsTitle.parentElement;
    if (parent) {
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.appendChild(exportBtn);
    }
  }
});

window.showExportModal = showExportModal;
