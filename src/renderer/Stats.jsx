import React, { useMemo } from 'react';
import { todayKey } from './storage.js';

export default function Stats({ history, tasks }) {
  const data = useMemo(() => {
    const today = todayKey();
    const todayCount = history[today] || 0;

    // 7-day window
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      days.push({
        key: k,
        label: d.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', ''),
        count: history[k] || 0,
      });
    }

    const weekTotal = days.reduce((sum, d) => sum + d.count, 0);
    const allTotal = Object.values(history).reduce((a, b) => a + b, 0);
    const taskPomos = tasks.reduce((sum, t) => sum + (t.pomos || 0), 0);
    const completedTasks = tasks.filter((t) => t.done).length;
    const max = Math.max(1, ...days.map((d) => d.count));

    return { todayCount, weekTotal, allTotal, taskPomos, completedTasks, days, max };
  }, [history, tasks]);

  return (
    <div className="stats-view">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">今日番茄</div>
          <div className="stat-value">{data.todayCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本周番茄</div>
          <div className="stat-value">{data.weekTotal}</div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">累计</div>
          <div className="stat-value">{data.allTotal}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已完成任务</div>
          <div className="stat-value">{data.completedTasks}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">最近 7 天</div>
        <div className="history-bars">
          {data.days.map((d) => (
            <div key={d.key} className="history-bar">
              <div
                className={`bar-fill ${d.count === 0 ? 'empty' : ''}`}
                style={{ height: `${(d.count / data.max) * 100}%` }}
                title={`${d.key}: ${d.count}`}
              />
              <span className="bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
