import React, { useEffect, useState } from 'react';
import Timer from './Timer.jsx';
import Tasks from './Tasks.jsx';
import Stats from './Stats.jsx';
import {
  loadSettings, saveSettings,
  loadTasks, saveTasks,
  loadHistory, saveHistory,
  loadActiveTaskId, saveActiveTaskId,
  todayKey,
} from './storage.js';

export default function App() {
  const [tab, setTab] = useState('timer');
  const [settings, setSettings] = useState(loadSettings);
  const [tasks, setTasks] = useState(loadTasks);
  const [activeTaskId, setActiveTaskId] = useState(loadActiveTaskId);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveActiveTaskId(activeTaskId), [activeTaskId]);
  useEffect(() => saveHistory(history), [history]);

  const currentTask = tasks.find((t) => t.id === activeTaskId && !t.done) || null;

  const addTask = (text) => {
    const id = String(Date.now());
    setTasks((ts) => [...ts, { id, text, done: false, pomos: 0 }]);
    if (!activeTaskId) setActiveTaskId(id);
  };

  const toggleTask = (id) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    if (id === activeTaskId) setActiveTaskId(null);
  };

  const deleteTask = (id) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    if (id === activeTaskId) setActiveTaskId(null);
  };

  const selectTask = (id) => setActiveTaskId(id === activeTaskId ? null : id);

  const onPomodoroComplete = () => {
    const key = todayKey();
    setHistory((h) => ({ ...h, [key]: (h[key] || 0) + 1 }));
    if (activeTaskId) {
      setTasks((ts) =>
        ts.map((t) => (t.id === activeTaskId ? { ...t, pomos: (t.pomos || 0) + 1 } : t))
      );
    }
  };

  return (
    <>
      <div className="titlebar" />
      <div className="app">
        <div className="tabs">
          <button className={`tab ${tab === 'timer' ? 'active' : ''}`} onClick={() => setTab('timer')}>
            计时
          </button>
          <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
            任务
          </button>
          <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
            统计
          </button>
        </div>

        {tab === 'timer' && (
          <Timer
            settings={settings}
            onSettingsChange={setSettings}
            currentTask={currentTask}
            onPomodoroComplete={onPomodoroComplete}
          />
        )}
        {tab === 'tasks' && (
          <Tasks
            tasks={tasks}
            activeTaskId={activeTaskId}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onSelect={selectTask}
          />
        )}
        {tab === 'stats' && <Stats history={history} tasks={tasks} />}
      </div>
    </>
  );
}
