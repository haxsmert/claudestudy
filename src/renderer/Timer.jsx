import React, { useEffect, useRef, useState } from 'react';

const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function Timer({ settings, onSettingsChange, currentTask, onPomodoroComplete }) {
  const [mode, setMode] = useState('work');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(settings.workMin * 60);
  const endRef = useRef(null);

  // When mode or settings change while not running, reset remaining
  useEffect(() => {
    if (!running) {
      setRemaining((mode === 'work' ? settings.workMin : settings.breakMin) * 60);
    }
  }, [mode, settings.workMin, settings.breakMin, running]);

  // Tick using a stable wall-clock target so it survives main-thread hiccups
  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + remaining * 1000;

    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        if (mode === 'work') {
          onPomodoroComplete();
          setMode('break');
        } else {
          setMode('work');
        }
      }
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    document.title = `${fmt(remaining)} · ${mode === 'work' ? '专注' : '休息'}`;
  }, [remaining, mode]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setRemaining((mode === 'work' ? settings.workMin : settings.breakMin) * 60);
  };
  const skip = () => {
    setRunning(false);
    setMode((m) => (m === 'work' ? 'break' : 'work'));
  };

  const updateSetting = (key, value) => {
    const v = Math.max(1, Math.min(180, Number(value) || 1));
    onSettingsChange({ ...settings, [key]: v });
  };

  return (
    <div className="timer-view">
      <div className="mode-pills">
        <button
          className={`mode-pill ${mode === 'work' ? 'active work' : ''}`}
          onClick={() => !running && setMode('work')}
        >
          专注
        </button>
        <button
          className={`mode-pill ${mode === 'break' ? 'active break' : ''}`}
          onClick={() => !running && setMode('break')}
        >
          休息
        </button>
      </div>

      <div className={`time-display ${mode}`}>{fmt(remaining)}</div>

      <div className="current-task">
        {currentTask ? `→ ${currentTask.text}` : '未选择任务'}
      </div>

      <div className="controls">
        <button className={`btn btn-primary ${mode === 'break' ? 'break' : ''}`} onClick={toggle}>
          {running ? '暂停' : '开始'}
        </button>
        <button className="btn" onClick={reset}>重置</button>
        <button className="btn" onClick={skip}>跳过</button>
      </div>

      <div className="settings">
        <div className="setting-item">
          <span className="setting-label">专注 (分钟)</span>
          <input
            type="number"
            className="setting-input"
            value={settings.workMin}
            min={1}
            max={180}
            disabled={running}
            onChange={(e) => updateSetting('workMin', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <span className="setting-label">休息 (分钟)</span>
          <input
            type="number"
            className="setting-input"
            value={settings.breakMin}
            min={1}
            max={180}
            disabled={running}
            onChange={(e) => updateSetting('breakMin', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
