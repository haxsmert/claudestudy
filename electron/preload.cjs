const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('pomodoro', {
  platform: process.platform,
});
