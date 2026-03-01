const { app, BrowserWindow, Tray, Menu, shell, nativeImage, dialog, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const os = require('os');
const fs = require('fs');

// ── SINGLE INSTANCE LOCK ─────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

// ── USER DATA PATHS ──────────────────────────────────────
const USER_DATA  = app.getPath('userData');
const ASSETS_DIR = path.join(USER_DATA, 'assets');
const THUMBS_DIR = path.join(USER_DATA, 'thumbs');
const TEXT_DIR   = path.join(USER_DATA, 'assets', 'text');
const LOG_FILE   = path.join(USER_DATA, 'app.log');
const CONFIG_FILE = path.join(USER_DATA, 'config.json');

[ASSETS_DIR, THUMBS_DIR, TEXT_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── CONFIG ───────────────────────────────────────────────
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}
function saveConfig(cfg) {
  try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2)); } catch {}
}

// ── LOGGING ─────────────────────────────────────────────
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

// ── STATE ───────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let serverProcess = null;
const PORT = 3000;
let shortcutsEnabled = false; // default OFF

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

// ── START SERVER ─────────────────────────────────────────
function startServer() {
  const cfg = loadConfig();
  const assetsDir = cfg.assetsDir || ASSETS_DIR;

  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js')
    : path.join(__dirname, '..', 'server.js');

  log(`=== Kurohiko Stream Kit AIO starting ===`);
  log(`Version: ${app.getVersion()}`);
  log(`Platform: ${process.platform}`);
  log(`User data: ${USER_DATA}`);
  log(`Local IP: ${getLocalIP()}`);
  log(`Starting server: ${serverPath}`);

  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      PORT: String(PORT),
      USER_DATA_DIR: USER_DATA,
      ASSETS_DIR_OVERRIDE: assetsDir,
      ELECTRON: '1',
    },
    silent: true,
  });

  serverProcess.stdout.on('data', d => log(`[server] ${d.toString().trim()}`));
  serverProcess.stderr.on('data', d => log(`[server:err] ${d.toString().trim()}`));
  serverProcess.on('exit', code => log(`Server exited: ${code}`));
}

// ── WINDOW ───────────────────────────────────────────────
function createWindow() {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 1200, height: 720, minWidth: 800, minHeight: 560,
    title: 'Kurohiko Stream Kit AIO',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: '#09090d',

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });
  

  const tryLoad = (attempts = 0) => {
    const http = require('http');
    const req = http.get(`http://127.0.0.1:${PORT}/`, (res) => {
      // Consume response data to free up memory
      res.resume();
      log(`Server ready (attempt ${attempts})`);
      mainWindow.loadURL(`http://127.0.0.1:${PORT}/`).then(() => {
        log('Page loaded successfully');
      }).catch(err => {
        log(`loadURL error: ${err.message}`);
      });
    });
    req.on('error', () => {
      if (attempts < 40) setTimeout(() => tryLoad(attempts + 1), 500);
      else dialog.showErrorBox('Error', 'Server gagal start.\nLog: ' + LOG_FILE);
    });
    req.setTimeout(1000, () => req.destroy());
  };
  setTimeout(() => tryLoad(), 1500);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
      e.preventDefault(); shell.openExternal(url);
    }
  });

  // Show window when page actually finishes loading, not just when frame is ready
  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      log('Window shown (did-finish-load)');
    }
  });

  // Fallback: also show on ready-to-show but with a delay to allow loadURL
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
        log('Window shown (ready-to-show fallback)');
      }
    }, 3000);
  });
  mainWindow.on('close', e => { if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); } });
  mainWindow.on('closed', () => { mainWindow = null; });

  // Debug: log any page load errors
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    log(`did-fail-load: code=${code} desc=${desc} url=${url}`);
    // Retry loading after a short delay if it failed
    if (code !== -3) { // -3 = aborted (intentional), skip retry
      setTimeout(() => {
        log('Retrying loadURL after failure...');
        mainWindow.loadURL(`http://127.0.0.1:${PORT}/`).catch(err => {
          log(`Retry loadURL error: ${err.message}`);
        });
      }, 2000);
    }
  });

  mainWindow.webContents.on('console-message', (e, level, msg) => {
    if (level >= 2) log(`[renderer] ${msg}`);
  });
}

// ── TRAY ────────────────────────────────────────────────
function createTray() {
  const iconPaths = [
    path.join(__dirname, '..', 'build', 'icon.png'),
    path.join(__dirname, '..', 'build', 'icon.ico'),
  ];

  let icon = nativeImage.createEmpty();
  for (const p of iconPaths) {
    if (fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) { icon = img.resize({ width: 16, height: 16 }); break; }
      } catch(e) { log(`Icon load failed: ${e.message}`); }
    }
  }

  tray = new Tray(icon);
  tray.setToolTip('Kurohiko Stream Kit AIO');
  tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else createWindow(); });
  rebuildTrayMenu();
}

function rebuildTrayMenu() {
  if (!tray) return;
  const ip = getLocalIP();
  const scLabel = shortcutsEnabled ? '⌨ Shortcut: ON  — Klik untuk matikan' : '⌨ Shortcut: OFF — Klik untuk aktifkan';
  const menu = Menu.buildFromTemplate([
    { label: 'Kurohiko Stream Kit AIO', enabled: false },
    { type: 'separator' },
    { label: '🏠 Buka Dashboard', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else createWindow(); } },
    { label: '🎮 Buka Deck View', click: () => shell.openExternal(`http://${ip}:${PORT}/deck.html`) },
    { type: 'separator' },
    { label: scLabel, click: () => toggleShortcutsFromTray() },
    { type: 'separator' },
    { label: `🌐 ${ip}:${PORT}`, enabled: false },
    { type: 'separator' },
    { label: '📋 Lihat Log', click: () => shell.openPath(LOG_FILE) },
    { label: '📂 Folder Data', click: () => shell.openPath(USER_DATA) },
    { label: '📝 Folder Counter', click: () => shell.openPath(TEXT_DIR) },
    { type: 'separator' },
    { label: '❌ Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function toggleShortcutsFromTray() {
  shortcutsEnabled = !shortcutsEnabled;
  rebuildTrayMenu();
  // Broadcast ke semua window (deck.html & index.html)
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('shortcut-state-changed', shortcutsEnabled);
  });
  log(`Shortcut toggled from tray: ${shortcutsEnabled}`);
}


// ── GLOBAL SHORTCUT ──────────────────────────────────────
ipcMain.on('register-shortcuts', (event, shortcuts) => {
  // Hapus yang lama biar ga dobel/bentrok
  globalShortcut.unregisterAll();
  
  if (!shortcuts || !Array.isArray(shortcuts)) return;

  shortcuts.forEach(sc => {
    try {
      globalShortcut.register(sc.combo, () => {
        // Kalau tombol dipencet, suruh UI deck.html jalanin meme-nya
        if (mainWindow) {
          mainWindow.webContents.send('shortcut-triggered', sc.action);
        }
      });
    } catch (err) {
      log(`Gagal register shortcut: ${sc.combo}`);
    }
  });
});
// ── IPC ──────────────────────────────────────────────────
// Renderer beritahu main saat user toggle shortcut
ipcMain.on('set-shortcut-enabled', (event, enabled) => {
  shortcutsEnabled = !!enabled;
  rebuildTrayMenu();
  // Broadcast ke window lain
  BrowserWindow.getAllWindows().forEach(win => {
    if (win.webContents !== event.sender) {
      win.webContents.send('shortcut-state-changed', shortcutsEnabled);
    }
  });
  log(`Shortcut set from renderer: ${shortcutsEnabled}`);
});

ipcMain.on('open-text-folder', () => {
  if (!fs.existsSync(TEXT_DIR)) fs.mkdirSync(TEXT_DIR, { recursive: true });
  shell.openPath(TEXT_DIR);
});
ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (e, cfg) => { saveConfig(cfg); return { ok: true }; });
ipcMain.handle('choose-folder', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'], title: 'Pilih Folder Assets' });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('get-local-ip', () => getLocalIP());

// ── SECOND INSTANCE ──────────────────────────────────────
app.on('second-instance', () => {
  if (mainWindow) { if (!mainWindow.isVisible()) mainWindow.show(); mainWindow.focus(); }
});

// ── APP EVENTS ───────────────────────────────────────────
app.whenReady().then(() => { startServer(); createWindow(); createTray(); });
app.on('window-all-closed', e => e.preventDefault());
app.on('before-quit', () => { if (serverProcess) serverProcess.kill(); logStream.end(); });
app.on('will-quit', () => { 
  globalShortcut.unregisterAll(); 
});