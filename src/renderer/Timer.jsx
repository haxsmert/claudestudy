import React, { useEffect, useRef, useState } from 'react';

const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 环形进度条尺寸常量
const RING = 224;
const STROKE = 12;
const RADIUS = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const MODE_LABEL = { work: '专注', break: '休息', longBreak: '长休息' };

// 区间结束时播放双音提示音（Web Audio，无需音频文件）
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const beep = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    };
    beep(880, 0, 0.35);
    beep(1320, 0.18, 0.4);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* 音频不可用时静默忽略 */
  }
}

export default function Timer({ settings, onSettingsChange, currentTask, onPomodoroComplete }) {
  const [mode, setMode] = useState('work');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(settings.workMin * 60);
  const [round, setRound] = useState(0); // 已完成的专注番茄数，决定长休息节奏
  const [confirmReset, setConfirmReset] = useState(false);
  const endRef = useRef(null);
  const autoStartRef = useRef(false); // 区间结束后是否自动开始下一段
  const confirmTimerRef = useRef(null);

  const durationOf = (m) => {
    if (m === 'work') return settings.workMin * 60;
    if (m === 'longBreak') return settings.longBreakMin * 60;
    return settings.breakMin * 60;
  };

  // 启动时申请桌面通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // 模式或时长变化且未运行时，重置剩余秒数
  useEffect(() => {
    if (!running) setRemaining(durationOf(mode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.workMin, settings.breakMin, settings.longBreakMin, running]);

  // 区间结束后，若开启了自动开始则接着跑下一段
  useEffect(() => {
    if (autoStartRef.current) {
      autoStartRef.current = false;
      setRunning(true);
    }
  }, [mode]);

  // 用墙钟目标时间计时，主线程卡顿也不漂移
  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + remaining * 1000;

    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        handleComplete();
      }
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    document.title = `${fmt(remaining)} · ${MODE_LABEL[mode]}`;
  }, [remaining, mode]);

  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  // 区间结束：提示音 + 桌面通知
  const notifyEnd = (fromMode, toMode) => {
    playBeep();
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = fromMode === 'work' ? '专注结束 🍅' : '休息结束';
    const body =
      toMode === 'work'
        ? '开始下一个专注吧'
        : toMode === 'longBreak'
        ? '完成一组，去长休息放松一下'
        : '短暂休息一下';
    try {
      new Notification(title, { body });
    } catch {
      /* 通知不可用时静默忽略 */
    }
  };

  // 一个区间走完：work → 短休/长休（每 longBreakEvery 个），休息 → work
  const handleComplete = () => {
    if (mode === 'work') {
      onPomodoroComplete();
      const n = round + 1;
      setRound(n);
      const next = n % settings.longBreakEvery === 0 ? 'longBreak' : 'break';
      notifyEnd('work', next);
      setMode(next);
      if (settings.autoStartBreak) autoStartRef.current = true;
    } else {
      notifyEnd(mode, 'work');
      setMode('work');
      if (settings.autoStartWork) autoStartRef.current = true;
    }
  };

  const toggle = () => setRunning((r) => !r);

  const doReset = () => {
    setRunning(false);
    setRemaining(durationOf(mode));
  };

  // 重置防误触：进行中或已有进度时，首次点击只进入“确认”态
  const handleReset = () => {
    const hasProgress = running || remaining !== durationOf(mode);
    if (hasProgress && !confirmReset) {
      setConfirmReset(true);
      confirmTimerRef.current = setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    clearTimeout(confirmTimerRef.current);
    setConfirmReset(false);
    doReset();
  };

  const skip = () => {
    setRunning(false);
    setConfirmReset(false);
    setMode((m) => (m === 'work' ? 'break' : 'work'));
  };

  const switchMode = (m) => {
    if (running) return;
    setConfirmReset(false);
    setMode(m);
  };

  const updateNumber = (key, value, min, max) => {
    const v = Math.max(min, Math.min(max, Number(value) || min));
    onSettingsChange({ ...settings, [key]: v });
  };

  const toggleSetting = (key) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  const total = durationOf(mode);
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const dashOffset = CIRC * (1 - ratio);
  const filledDots = round % settings.longBreakEvery;

  return (
    <div className="timer-view">
      <div className="mode-pills">
        {['work', 'break', 'longBreak'].map((m) => (
          <button
            key={m}
            className={`mode-pill ${mode === m ? `active ${m}` : ''}`}
            onClick={() => switchMode(m)}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="timer-ring">
        <svg width={RING} height={RING}>
          <circle
            className="ring-track"
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            strokeWidth={STROKE}
          />
          <circle
            className={`ring-progress ${mode}`}
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </svg>
        <div className="ring-center">
          <div className={`time-display ${mode}`}>{fmt(remaining)}</div>
          <div className="current-task">
            {currentTask ? `→ ${currentTask.text}` : '未选择任务'}
          </div>
        </div>
      </div>

      <div className="round-dots" title="本组番茄进度">
        {Array.from({ length: settings.longBreakEvery }).map((_, i) => (
          <span key={i} className={`round-dot ${i < filledDots ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="controls">
        <button className={`btn btn-primary ${mode}`} onClick={toggle}>
          {running ? '暂停' : '开始'}
        </button>
        <button
          className={`btn ${confirmReset ? 'confirm' : ''}`}
          onClick={handleReset}
        >
          {confirmReset ? '确认重置?' : '重置'}
        </button>
        <button className="btn" onClick={skip}>跳过</button>
      </div>

      <div className="settings">
        <div className="setting-row">
          <SettingNumber
            label="专注"
            value={settings.workMin}
            disabled={running}
            onChange={(v) => updateNumber('workMin', v, 1, 180)}
          />
          <SettingNumber
            label="短休"
            value={settings.breakMin}
            disabled={running}
            onChange={(v) => updateNumber('breakMin', v, 1, 180)}
          />
          <SettingNumber
            label="长休"
            value={settings.longBreakMin}
            disabled={running}
            onChange={(v) => updateNumber('longBreakMin', v, 1, 180)}
          />
          <SettingNumber
            label="间隔"
            value={settings.longBreakEvery}
            disabled={running}
            onChange={(v) => updateNumber('longBreakEvery', v, 2, 10)}
          />
        </div>
        <div className="setting-toggles">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.autoStartBreak}
              onChange={() => toggleSetting('autoStartBreak')}
            />
            <span>自动开始休息</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.autoStartWork}
              onChange={() => toggleSetting('autoStartWork')}
            />
            <span>自动开始专注</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function SettingNumber({ label, value, disabled, onChange }) {
  return (
    <div className="setting-item">
      <span className="setting-label">{label}</span>
      <input
        type="number"
        className="setting-input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
