const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { execFile, execFileSync } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ── PATHS ────────────────────────────────────────────────
// Kalau jalan di Electron → pakai USER_DATA_DIR dari env (AppData user)
// Kalau jalan biasa (Docker/dev) → pakai folder __dirname seperti biasa
const IS_ELECTRON = !!process.env.ELECTRON;
const BASE_DIR    = IS_ELECTRON
  ? process.env.USER_DATA_DIR
  : __dirname;

const MEDIA_DIR  = process.env.ASSETS_DIR_OVERRIDE || process.env.MEDIA_DIR || path.join(BASE_DIR, 'assets');
const META_FILE  = path.join(BASE_DIR, 'meta.json');
const THUMB_DIR  = path.join(BASE_DIR, 'thumbs');
const TEXT_DIR   = path.join(MEDIA_DIR, 'text');
const COUNTER_META      = path.join(BASE_DIR, 'counters.json');
const DECK_SETTINGS_FILE = path.join(BASE_DIR, 'deck_settings.json');
const STATS_FILE        = path.join(BASE_DIR, 'stats.json');

// Bikin folder kalau belum ada
[MEDIA_DIR, THUMB_DIR, TEXT_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

console.log(`[paths] base=${BASE_DIR}`);
console.log(`[paths] media=${MEDIA_DIR}`);
console.log(`[paths] mode=${IS_ELECTRON ? 'electron' : 'standalone'}`);

// ── MIDDLEWARE ───────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));

// Strip trailing slash dari URL .html/ supaya nggak 404
app.use((req, res, next) => {
  if (req.path.endsWith('.html/') || (req.path.endsWith('/') && req.path.length > 1 && !req.path.includes('.'))) {
    const newPath = req.path.replace(/\/+$/, '');
    return res.redirect(301, newPath + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''));
  }
  next();
});

// Static files — public folder ada di __dirname (folder app, bukan AppData)
// Di dev mode (non-packaged), selalu pakai __dirname
// Di packaged mode, pakai app.asar
const IS_PACKAGED = IS_ELECTRON && process.resourcesPath && !process.resourcesPath.includes('node_modules');
const APP_PATH = IS_PACKAGED
  ? path.join(process.resourcesPath, 'app.asar')
  : __dirname;

app.use(express.static(path.join(APP_PATH, 'public')));
app.use('/lang', express.static(path.join(APP_PATH, 'lang')));
app.get('/ksk-ui.js', (req, res) =>
  res.sendFile(path.join(APP_PATH, 'ksk-ui.js'))
);

// Route shortcuts - Pakai APP_PATH supaya jalan di dev & packaged mode
app.get('/customdeck', (req, res) => res.sendFile(path.join(APP_PATH, 'public', 'customdeck.html')));
app.get('/deck', (req, res) => res.sendFile(path.join(APP_PATH, 'public', 'deck.html')));
app.get('/obs', (req, res) => res.sendFile(path.join(APP_PATH, 'public', 'obs.html')));

// Assets dari folder data user
app.use('/assets', express.static(MEDIA_DIR));

// ── META HELPERS ─────────────────────────────────────────
function loadMeta() {
  try { return JSON.parse(fs.readFileSync(META_FILE, 'utf8')); } catch { return {}; }
}
function saveMeta(meta) {
  try { fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2)); return true; }
  catch(e) { console.error('saveMeta failed:', e.message); return false; }
}

// ── STATS HELPERS ────────────────────────────────────────
function loadStatsData() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); } catch { return { totalTriggers: 0 }; }
}
function saveStatsData(data) {
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(data)); } catch(e) { console.error(e); }
}
function incrementTrigger() {
  const stats = loadStatsData();
  stats.totalTriggers = (stats.totalTriggers || 0) + 1;
  saveStatsData(stats);
}

app.get('/api/stats', (req, res) => {
  res.json(loadStatsData());
});

// ── FFMPEG CHECK ─────────────────────────────────────────
let hasFfmpeg = false;
try {
  execFileSync('ffmpeg', ['-version'], { timeout: 3000 });
  hasFfmpeg = true;
  console.log('ffmpeg: available');
} catch {
  console.log('ffmpeg: not available — video thumbnails disabled');
}

// ── MULTER ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MEDIA_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// ── MEDIA API ────────────────────────────────────────────
app.get('/api/media', (req, res) => {
  try {
    const meta = loadMeta();
    const exts = ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.webm','.mov','.mp3','.wav','.ogg'];
    const files = fs.readdirSync(MEDIA_DIR)
      .filter(f => !f.startsWith('_') && exts.includes(path.extname(f).toLowerCase()))
      .map(f => {
        const stat = fs.statSync(path.join(MEDIA_DIR, f));
        return { name: f, size: stat.size, mtime: stat.mtime, settings: meta[f] || null };
      });
    res.json(files);
  } catch(e) { console.error(e); res.json([]); }
});

app.post('/upload', upload.any(), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ ok: false, error: 'No files' });
  console.log('Uploaded:', req.files.map(f => f.filename));
  res.json({ ok: true, files: req.files.map(f => f.filename) });
});

app.post('/api/media/:filename/settings', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const meta = loadMeta();
  meta[filename] = req.body;
  res.json({ ok: saveMeta(meta) });
});

app.delete('/api/media/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const fp = path.join(MEDIA_DIR, filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    const tp = path.join(THUMB_DIR, filename + '.jpg');
    if (fs.existsSync(tp)) fs.unlinkSync(tp);
    const meta = loadMeta();
    delete meta[filename];
    saveMeta(meta);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── THUMBNAIL ────────────────────────────────────────────
app.get('/api/thumb/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const videoPath = path.join(MEDIA_DIR, filename);
  const thumbPath = path.join(THUMB_DIR, filename + '.jpg');

  if (!fs.existsSync(videoPath)) return res.status(404).end();
  if (fs.existsSync(thumbPath)) return res.sendFile(thumbPath);
  if (!hasFfmpeg) return res.status(503).end();

  execFile('ffmpeg', [
    '-i', videoPath, '-ss', '00:00:01', '-vframes', '1',
    '-vf', 'scale=320:-2', '-pix_fmt', 'yuvj420p', '-q:v', '5', '-y', thumbPath
  ], { timeout: 15000 }, (err) => {
    if (err || !fs.existsSync(thumbPath)) return res.status(500).end();
    res.sendFile(thumbPath);
  });
});

// ── TRIGGER ──────────────────────────────────────────────
app.post('/trigger', (req, res) => {
  incrementTrigger();
  io.emit('show-media', req.body);
  res.json({ ok: true });
});
app.get('/trigger/:filename', (req, res) => {
  incrementTrigger();
  const filename = decodeURIComponent(req.params.filename);
  const meta = loadMeta();
  io.emit('show-media', { filename, ...(meta[filename] || {}) });
  res.json({ ok: true });
});
app.post('/hide', (req, res) => { io.emit('hide-media'); res.json({ ok: true }); });
app.get('/hide',  (req, res) => { io.emit('hide-media'); res.json({ ok: true }); });

// ── COUNTER API ──────────────────────────────────────────
function loadCounterMeta() {
  try { return JSON.parse(fs.readFileSync(COUNTER_META, 'utf8')); } catch { return []; }
}
function saveCounterMeta(list) {
  try { fs.writeFileSync(COUNTER_META, JSON.stringify(list, null, 2)); return true; } catch { return false; }
}

app.get('/api/counters', (req, res) => res.json(loadCounterMeta()));

app.post('/api/counters', (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: 'Nama wajib diisi' });
  const cleanName = String(name).trim().replace(/[<>"'`]/g, '');
  const filename = cleanName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '') + '.txt';
  if (!filename.replace('.txt','')) return res.status(400).json({ ok: false, error: 'Nama tidak valid' });
  const filepath = path.join(TEXT_DIR, filename);
  const list = loadCounterMeta();
  if (list.find(c => c.filename === filename)) return res.status(409).json({ ok: false, error: 'Counter sudah ada' });
  try {
    fs.writeFileSync(filepath, '0', 'utf8');
    list.push({ name: cleanName, filename, created: new Date().toISOString() });
    saveCounterMeta(list);
    res.json({ ok: true, filename, name: cleanName });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/counters/:filename/value', (req, res) => {
  const filename = path.basename(decodeURIComponent(req.params.filename));
  const filepath = path.join(TEXT_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ ok: false });
  try { res.json({ ok: true, value: fs.readFileSync(filepath, 'utf8').trim() }); }
  catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/counters/:filename/value', (req, res) => {
  const filename = path.basename(decodeURIComponent(req.params.filename));
  const filepath = path.join(TEXT_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ ok: false });
  const { value } = req.body || {};
  try { fs.writeFileSync(filepath, String(value ?? '0'), 'utf8'); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Atomic counter op — server baca file, hitung, tulis, emit socket
app.post('/api/counters/:filename/op', (req, res) => {
  const filename = path.basename(decodeURIComponent(req.params.filename));
  const filepath = path.join(TEXT_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ ok: false });
  const { op } = req.body || {};
  try {
    let cur = parseInt(fs.readFileSync(filepath, 'utf8').trim(), 10) || 0;
    if (op === 'inc') cur += 1;
    else if (op === 'dec') cur = Math.max(0, cur - 1);
    else if (op === 'reset') cur = 0;
    else return res.status(400).json({ ok: false, error: 'invalid op' });
    fs.writeFileSync(filepath, String(cur), 'utf8');
    io.emit('counter-updated', { filename, value: cur });
    res.json({ ok: true, value: cur });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/counters/:filename', (req, res) => {
  const filename = path.basename(decodeURIComponent(req.params.filename));
  const filepath = path.join(TEXT_DIR, filename);
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    saveCounterMeta(loadCounterMeta().filter(c => c.filename !== filename));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── DECK SETTINGS ────────────────────────────────────────
function loadDeckSettings() {
  try { return JSON.parse(fs.readFileSync(DECK_SETTINGS_FILE, 'utf8')); } catch { return null; }
}
function saveDeckSettings(data) {
  try { fs.writeFileSync(DECK_SETTINGS_FILE, JSON.stringify(data, null, 2)); return true; }
  catch(e) { console.error('saveDeckSettings failed:', e.message); return false; }
}

app.get('/api/deck-settings', (req, res) => res.json(loadDeckSettings() || {}));
app.post('/api/deck-settings', (req, res) => {
  const ok = saveDeckSettings(req.body);
  if (ok) io.emit('deck-settings-updated', req.body);
  res.json({ ok });
});

// ── LOCAL IP (untuk QR / phone connect) ─────────────────
const os = require('os');
app.get('/api/local-ip', (req, res) => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return res.json({ ip: net.address, port: PORT });
      }
    }
  }
  res.json({ ip: 'localhost', port: PORT });
});

// ── CONFIG API ──────────────────────────────────────────
const CONFIG_FILE = path.join(BASE_DIR, 'config.json');
function loadAppConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}
app.get('/api/config', (req, res) => res.json(loadAppConfig()));

// Choose folder — hanya works di Electron (via dialog)
app.post('/api/choose-folder', async (req, res) => {
  if (!IS_ELECTRON) return res.json({ ok: false, error: 'Only available in Electron' });
  // Kirim request ke Electron main process lewat IPC tidak bisa dari server
  // User harus pilih dari Settings di Electron window
  res.json({ ok: false, error: 'Use Electron Settings dialog' });
});

// ── BACKUP & RESTORE ────────────────────────────────────
const archiver = (() => { try { return require('archiver'); } catch { return null; } })();
const unzipper = (() => { try { return require('unzipper'); } catch { return null; } })();

app.get('/api/backup', (req, res) => {
  if (!archiver) return res.status(500).json({ ok: false, error: 'archiver not installed. Run: npm install archiver' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = 'KSK-Backup-' + timestamp + '.zip';

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.on('error', err => { console.error('Backup error:', err); res.status(500).end(); });
  archive.pipe(res);

  // Config files
  const configFiles = ['meta.json', 'counters.json', 'deck_settings.json', 'config.json'];
  for (const f of configFiles) {
    const fp = path.join(BASE_DIR, f);
    if (fs.existsSync(fp)) archive.file(fp, { name: 'config/' + f });
  }

  // Assets folder (memes + text counters)
  if (fs.existsSync(MEDIA_DIR)) {
    archive.directory(MEDIA_DIR, 'assets');
  }

  // Thumbs folder
  if (fs.existsSync(THUMB_DIR)) {
    archive.directory(THUMB_DIR, 'thumbs');
  }

  archive.finalize();
});

const restoreUpload = multer({ dest: path.join(BASE_DIR, '_restore_tmp'), limits: { fileSize: 2 * 1024 * 1024 * 1024 } });
app.post('/api/restore', restoreUpload.single('backup'), async (req, res) => {
  if (!unzipper) return res.status(500).json({ ok: false, error: 'unzipper not installed. Run: npm install unzipper' });
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

  const zipPath = req.file.path;
  try {
    const zip = await unzipper.Open.file(zipPath);
    let restoredFiles = 0;
    let restoredConfigs = 0;

    for (const entry of zip.files) {
      if (entry.type === 'Directory') continue;
      const rel = entry.path.replace(/\\/g, '/');

      if (rel.startsWith('config/')) {
        const fname = path.basename(rel);
        const allowed = ['meta.json', 'counters.json', 'deck_settings.json', 'config.json'];
        if (allowed.includes(fname)) {
          const dest = path.join(BASE_DIR, fname);
          const content = await entry.buffer();
          fs.writeFileSync(dest, content);
          restoredConfigs++;
        }
      } else if (rel.startsWith('assets/')) {
        const subPath = rel.slice('assets/'.length);
        if (!subPath) continue;
        const dest = path.join(MEDIA_DIR, subPath);
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const content = await entry.buffer();
        fs.writeFileSync(dest, content);
        restoredFiles++;
      } else if (rel.startsWith('thumbs/')) {
        const subPath = rel.slice('thumbs/'.length);
        if (!subPath) continue;
        const dest = path.join(THUMB_DIR, subPath);
        const content = await entry.buffer();
        fs.writeFileSync(dest, content);
      }
    }

    try { fs.unlinkSync(zipPath); } catch {}
    try { fs.rmdirSync(path.join(BASE_DIR, '_restore_tmp')); } catch {}

    res.json({ ok: true, restoredFiles, restoredConfigs });
  } catch(e) {
    try { fs.unlinkSync(zipPath); } catch {}
    console.error('Restore error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── SOCKET ───────────────────────────────────────────────
io.on('connection', s => console.log('Client connected:', s.id));

// ── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`KSK Server | port:${PORT} | media:${MEDIA_DIR} | ffmpeg:${hasFfmpeg}`);
});