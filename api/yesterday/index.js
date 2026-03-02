// Yesterday Memo API for Snoopy-Office
// Reads from memory files and displays yesterday's work summary

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const yesterday = getYesterdayDate();
    const memoryPath = join(process.cwd(), 'memory', `${yesterday}.md`);
    
    let content = '';
    if (existsSync(memoryPath)) {
      content = readFileSync(memoryPath, 'utf-8');
    } else {
      // Try to find any recent memory file
      const memoryDir = join(process.cwd(), 'memory');
      if (existsSync(memoryDir)) {
        const files = readdirSync(memoryDir)
          .filter(f => f.endsWith('.md'))
          .sort()
          .reverse();
        if (files.length > 0) {
          const recentPath = join(memoryDir, files[0]);
          content = readFileSync(recentPath, 'utf-8');
        }
      }
    }

    // Sanitize and extract key points
    const summary = sanitizeContent(content);
    
    res.status(200).json({
      success: true,
      date: yesterday,
      summary: summary || '暂无昨日记录',
      tasks: extractTasks(content)
    });
  } catch (error) {
    console.error('Error fetching yesterday memo:', error);
    res.status(200).json({
      success: true,
      summary: '暂无记录',
      tasks: []
    });
  }
}

function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sanitizeContent(content) {
  if (!content) return '';
  // Remove sensitive information patterns
  let sanitized = content
    .replace(/sk-[a-zA-Z0-9]+/g, '***')
    .replace(/password[:\s]+[^\s]+/gi, 'password: ***')
    .replace(/api[_-]?key[:\s]+[^\s]+/gi, 'api_key: ***');
  
  // Extract first 500 chars as summary
  return sanitized.substring(0, 500);
}

function extractTasks(content) {
  if (!content) return [];
  // Simple extraction of task-like lines
  const lines = content.split('\n')
    .filter(line => line.includes('完成') || line.includes('任务') || line.includes('修复'))
    .slice(0, 5);
  return lines.map(l => l.trim());
}
