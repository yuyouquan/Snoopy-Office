// Snoopy小龙虾办公室 - 角色工位系统
// 为每个 Agent 角色提供专属工位弹窗和交互

const ROLE_ZONE_EMOJIS = {
    'main':            '🧠',
    'architect':       '🏗️',
    'frontend-dev':    '🎨',
    'backend-dev':     '⚙️',
    'product-manager': '📋',
    'project-manager': '📊',
    'qa-engineer':     '🧪',
    'news-miner':      '📰',
    'daily-reporter':  '📝',
    'security-expert': '🔒'
};

const ROLE_ZONE_NAMES = {
    'main':            '主控中心',
    'architect':       '架构工作站',
    'frontend-dev':    '前端工作室',
    'backend-dev':     '后端实验室',
    'product-manager': '产品经理区',
    'project-manager': '项目看板区',
    'qa-engineer':     '测试质检区',
    'news-miner':      '资讯研究室',
    'daily-reporter':  '日报助手站',
    'security-expert': '安全监控室'
};

let _activeWorkstationPopup = null;

function formatWorkstationTokens(n) {
    if (!n || n <= 0) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

function showWorkstationPopup(role) {
    const data = window.openclawData;
    const agent = data && data.agentDetails
        ? data.agentDetails.find(a => a.agentId === role)
        : null;

    // 移除现有弹窗
    closeWorkstationPopup();

    const popup = document.createElement('div');
    popup.id = 'workstation-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(15, 23, 42, 0.96);
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 260px;
        max-width: 340px;
        z-index: 999999;
        font-family: ArkPixel, monospace;
        color: #e5e7eb;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    `;

    const emoji = ROLE_ZONE_EMOJIS[role] || '🤖';
    const zoneName = ROLE_ZONE_NAMES[role] || role;

    let statusHtml = '<div style="color:#4b5563;font-size:11px;margin-top:8px;">该工位暂无 Agent 数据</div>';
    if (agent) {
        const statusColor = {
            active: '#22c55e',
            idle: '#eab308',
            offline: '#6b7280'
        }[agent.status] || '#6b7280';

        const statusText = {
            active: '活跃中',
            idle: '待命',
            offline: '离线'
        }[agent.status] || agent.status;

        const tokens = formatWorkstationTokens(
            (agent.totalInputTokens || 0) + (agent.totalOutputTokens || 0)
        );

        statusHtml = `
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};
                     box-shadow:0 0 6px ${statusColor};"></div>
                <span style="color:${statusColor};font-size:12px;">
                    ${statusText}
                </span>
            </div>
            <div style="margin-top:8px;color:#9ca3af;font-size:11px;line-height:1.5;">
                ${agent.role || ''}
            </div>
            <div style="display:flex;gap:12px;margin-top:10px;font-size:10px;color:#6b7280;">
                <span>📂 ${agent.totalSessions} 会话</span>
                <span>🪙 ${tokens} tokens</span>
            </div>
        `;
    }

    popup.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="font-size:18px;font-weight:bold;">
                ${emoji} ${zoneName}
            </div>
            <button onclick="closeWorkstationPopup()" style="
                background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px;
                font-family:ArkPixel,monospace;padding:0 4px;
            ">✕</button>
        </div>
        ${statusHtml}
    `;

    document.body.appendChild(popup);
    _activeWorkstationPopup = popup;

    // 6 秒后自动关闭
    setTimeout(closeWorkstationPopup, 6000);
}

function closeWorkstationPopup() {
    if (_activeWorkstationPopup) {
        _activeWorkstationPopup.remove();
        _activeWorkstationPopup = null;
    }
}

function highlightWorkstationZone(role, on) {
    const g = window._wzGraphics && window._wzGraphics[role];
    if (!g) return;

    if (on) {
        const rect = window.ROLE_ZONE_RECTS && window.ROLE_ZONE_RECTS[role];
        if (!rect) return;
        g.clear();
        g.lineStyle(2, 0x60a5fa, 0.8);
        g.strokeRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
        g.fillStyle(0x60a5fa, 0.08);
        g.fillRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
    } else {
        g.clear();
    }
}

function focusWorkstationZone(role) {
    // 显示工位弹窗
    showWorkstationPopup(role);
    // 高亮工位 2.5 秒
    highlightWorkstationZone(role, true);
    setTimeout(() => highlightWorkstationZone(role, false), 2500);
}

// 点击弹窗外部关闭
document.addEventListener('click', (e) => {
    if (_activeWorkstationPopup && !_activeWorkstationPopup.contains(e.target)) {
        closeWorkstationPopup();
    }
});

// 暴露到全局
window.showWorkstationPopup = showWorkstationPopup;
window.closeWorkstationPopup = closeWorkstationPopup;
window.highlightWorkstationZone = highlightWorkstationZone;
window.focusWorkstationZone = focusWorkstationZone;
