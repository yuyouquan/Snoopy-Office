"""OpenClaw Bridge - 读取本地 OpenClaw 状态并映射到办公室系统

直接读取 OpenClaw 的本地文件（cron/jobs.json、sessions、memory）来获取实时状态，
避免依赖 WebSocket RPC 协议。
"""

import json
import os
import time
import glob
from datetime import datetime, timedelta
from pathlib import Path

# OpenClaw 路径配置
OPENCLAW_DIR = os.path.expanduser("~/.openclaw")
OPENCLAW_CONFIG = os.path.join(OPENCLAW_DIR, "openclaw.json")
CRON_JOBS_FILE = os.path.join(OPENCLAW_DIR, "cron", "jobs.json")
CRON_RUNS_DIR = os.path.join(OPENCLAW_DIR, "cron", "runs")
AGENTS_DIR = os.path.join(OPENCLAW_DIR, "agents")
SESSIONS_DIR = os.path.join(OPENCLAW_DIR, "agents")
MEMORY_DIR = os.path.join(OPENCLAW_DIR, "workspace", "memory")
GATEWAY_LOG = os.path.join(OPENCLAW_DIR, "logs", "gateway.log")


def _safe_read_json(path):
    """安全读取 JSON 文件"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def get_openclaw_config():
    """读取 OpenClaw 主配置"""
    config = _safe_read_json(OPENCLAW_CONFIG)
    if not config:
        return None
    return {
        "agents": [a.get("id", "unknown") for a in config.get("agents", {}).get("list", [])],
        "gateway_port": config.get("gateway", {}).get("port", 18789),
        "model": config.get("agents", {}).get("defaults", {}).get("model", {}).get("primary", "unknown"),
    }


def get_cron_jobs():
    """读取所有 cron 任务及其状态"""
    data = _safe_read_json(CRON_JOBS_FILE)
    if not data:
        return []

    jobs = []
    for job in data.get("jobs", []):
        state = job.get("state", {})
        last_status = state.get("lastStatus", "unknown")
        last_run_ms = state.get("lastRunAtMs", 0)
        next_run_ms = state.get("nextRunAtMs", 0)
        last_duration_ms = state.get("lastDurationMs", 0)

        last_run_at = None
        if last_run_ms > 0:
            last_run_at = datetime.fromtimestamp(last_run_ms / 1000).isoformat()

        next_run_at = None
        if next_run_ms > 0:
            next_run_at = datetime.fromtimestamp(next_run_ms / 1000).isoformat()

        jobs.append({
            "id": job.get("id", ""),
            "name": job.get("name", "未命名任务"),
            "enabled": job.get("enabled", False),
            "schedule": job.get("schedule", {}).get("expr", ""),
            "agentId": job.get("agentId", "main"),
            "lastStatus": last_status,
            "lastRunAt": last_run_at,
            "nextRunAt": next_run_at,
            "lastDurationMs": last_duration_ms,
            "consecutiveErrors": state.get("consecutiveErrors", 0),
        })

    return jobs


def get_recent_cron_runs(limit=10):
    """读取最近的 cron 执行记录"""
    runs = []
    if not os.path.isdir(CRON_RUNS_DIR):
        return runs

    run_files = sorted(
        glob.glob(os.path.join(CRON_RUNS_DIR, "*.jsonl")),
        key=os.path.getmtime,
        reverse=True
    )[:20]  # 只看最近20个文件

    for rf in run_files:
        try:
            with open(rf, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        if entry.get("action") == "finished":
                            runs.append({
                                "jobId": entry.get("jobId", ""),
                                "status": entry.get("status", "unknown"),
                                "summary": (entry.get("summary", "") or "")[:200],
                                "durationMs": entry.get("durationMs", 0),
                                "timestamp": datetime.fromtimestamp(
                                    entry.get("ts", 0) / 1000
                                ).isoformat() if entry.get("ts") else None,
                            })
                    except json.JSONDecodeError:
                        continue
        except Exception:
            continue

    # 按时间倒序排列，取最近的
    runs.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return runs[:limit]


def get_active_sessions():
    """检查各 agent 目录下的 sessions 数量来判断活跃度"""
    active = []
    if not os.path.isdir(AGENTS_DIR):
        return active

    for agent_id in os.listdir(AGENTS_DIR):
        agent_path = os.path.join(AGENTS_DIR, agent_id)
        sessions_path = os.path.join(agent_path, "sessions")
        if not os.path.isdir(sessions_path):
            continue

        # 统计最近1小时内修改过的 session 文件
        recent_count = 0
        total_count = 0
        one_hour_ago = time.time() - 3600
        try:
            for sf in os.listdir(sessions_path):
                total_count += 1
                full_path = os.path.join(sessions_path, sf)
                if os.path.getmtime(full_path) > one_hour_ago:
                    recent_count += 1
        except Exception:
            continue

        active.append({
            "agentId": agent_id,
            "totalSessions": total_count,
            "recentSessions": recent_count,
            "isActive": recent_count > 0,
        })

    return active


def get_today_memory():
    """读取今日记忆文件"""
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_file = os.path.join(MEMORY_DIR, f"{today_str}.md")

    if not os.path.exists(today_file):
        return None

    try:
        with open(today_file, "r", encoding="utf-8") as f:
            content = f.read()
        return {
            "date": today_str,
            "content": content[:2000],  # 限制长度
            "size": len(content),
        }
    except Exception:
        return None


def infer_office_state():
    """
    根据 OpenClaw 各系统的实时状态推断办公室应显示的状态。

    状态映射逻辑:
    - 有 cron 正在运行 → executing
    - 有 agent session 最近活跃 → writing
    - 有 cron 错误 → error
    - 有同步任务运行 → syncing
    - 其他 → idle

    返回: { state, detail, source }
    """
    jobs = get_cron_jobs()
    sessions = get_active_sessions()
    runs = get_recent_cron_runs(5)

    # 检查是否有正在运行的 cron 任务
    running_jobs = [j for j in jobs if j.get("lastStatus") == "running" and j.get("enabled")]
    if running_jobs:
        job = running_jobs[0]
        return {
            "state": "executing",
            "detail": f"正在执行: {job['name']}",
            "source": "cron",
            "jobId": job["id"],
        }

    # 检查最近5分钟内完成的任务
    recent_finished = []
    five_mins_ago = (datetime.now() - timedelta(minutes=5)).isoformat()
    for run in runs:
        if run.get("timestamp", "") > five_mins_ago:
            recent_finished.append(run)

    if recent_finished:
        latest = recent_finished[0]
        if latest.get("status") == "error":
            # 找到对应的 job 名称
            job_name = "未知任务"
            for j in jobs:
                if j["id"] == latest.get("jobId"):
                    job_name = j["name"]
                    break
            return {
                "state": "error",
                "detail": f"任务失败: {job_name}",
                "source": "cron",
            }

    # 检查活跃 sessions
    active_agents = [s for s in sessions if s.get("isActive")]
    if active_agents:
        agent_names = [a["agentId"] for a in active_agents[:3]]
        return {
            "state": "writing",
            "detail": f"Agent 活跃中: {', '.join(agent_names)}",
            "source": "sessions",
        }

    # 检查有错误的 cron 任务
    error_jobs = [j for j in jobs if j.get("lastStatus") == "error" and j.get("enabled")]
    if error_jobs:
        names = [j["name"] for j in error_jobs[:2]]
        return {
            "state": "error",
            "detail": f"任务异常: {', '.join(names)}",
            "source": "cron",
        }

    # 检查是否有同步类任务即将运行
    now_ms = time.time() * 1000
    upcoming = [j for j in jobs if j.get("enabled") and j.get("nextRunAt")]
    if upcoming:
        soonest = min(upcoming, key=lambda j: j.get("nextRunAt", ""))
        return {
            "state": "idle",
            "detail": f"待命中 | 下次任务: {soonest['name']}",
            "source": "schedule",
        }

    return {
        "state": "idle",
        "detail": "所有系统正常待命",
        "source": "default",
    }


def get_full_status():
    """获取完整的 OpenClaw 状态概览"""
    config = get_openclaw_config()
    jobs = get_cron_jobs()
    sessions = get_active_sessions()
    runs = get_recent_cron_runs(10)
    memory = get_today_memory()
    office_state = infer_office_state()

    enabled_jobs = [j for j in jobs if j.get("enabled")]
    ok_jobs = [j for j in enabled_jobs if j.get("lastStatus") == "ok"]
    error_jobs = [j for j in enabled_jobs if j.get("lastStatus") == "error"]
    active_agents = [s for s in sessions if s.get("isActive")]

    return {
        "officeState": office_state,
        "summary": {
            "totalAgents": len(config["agents"]) if config else 0,
            "activeAgents": len(active_agents),
            "totalCronJobs": len(enabled_jobs),
            "healthyCronJobs": len(ok_jobs),
            "errorCronJobs": len(error_jobs),
            "hasMemoryToday": memory is not None,
        },
        "cronJobs": enabled_jobs,
        "recentRuns": runs,
        "agents": sessions,
        "todayMemory": memory,
        "updatedAt": datetime.now().isoformat(),
    }
