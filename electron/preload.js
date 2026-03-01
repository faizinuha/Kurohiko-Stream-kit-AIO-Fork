const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kskElectron', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  openTextFolder: () => ipcRenderer.send('open-text-folder'),
  getLocalIP: () => ipcRenderer.invoke('get-local-ip'),

  // ── GLOBAL SHORTCUT ──
  registerShortcuts: (shortcuts) => ipcRenderer.send('register-shortcuts', shortcuts),
  onShortcutTriggered: (callback) => ipcRenderer.on('shortcut-triggered', (event, action) => callback(action)),

  // ── SHORTCUT TOGGLE SYNC ──
  setShortcutEnabled: (enabled) => ipcRenderer.send('set-shortcut-enabled', enabled),
  onShortcutStateChanged: (cb) => ipcRenderer.on('shortcut-state-changed', (e, enabled) => cb(enabled)),
});