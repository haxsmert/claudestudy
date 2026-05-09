import React, { useState } from 'react';

export default function Tasks({ tasks, activeTaskId, onAdd, onToggle, onDelete, onSelect }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText('');
  };

  return (
    <div className="tasks-view">
      <form className="task-input-row" onSubmit={submit}>
        <input
          className="task-input"
          placeholder="添加任务，回车确认"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn">添加</button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty">还没有任务</div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className={`task ${t.done ? 'done' : ''} ${t.id === activeTaskId ? 'active' : ''}`}
            >
              <button
                className={`task-checkbox ${t.done ? 'checked' : ''}`}
                onClick={() => onToggle(t.id)}
                aria-label="toggle"
              >
                {t.done ? '✓' : ''}
              </button>
              <span className="task-text" onClick={() => onSelect(t.id)}>
                {t.text}
              </span>
              {t.pomos > 0 && <span className="task-pomos">🍅 {t.pomos}</span>}
              <button className="task-delete" onClick={() => onDelete(t.id)} aria-label="delete">
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
