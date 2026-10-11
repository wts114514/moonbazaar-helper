// ============================================================
// MoonBazaar Helper · 开源版主进程
// 说明：已移除签名算法、API_BASE、卡密识别等敏感逻辑
// ============================================================
const { app, BrowserWindow, ipcMain, Notification, session, shell, nativeTheme, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const Store = require('electron-store');

// ⚠️ 私有部署时修改为你的实际 API 地址
const API_BASE = 'https://your-worker.example.com';

const isPackaged = app.isPackaged;
const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;

// ============================================================
// 配置存储
// ============================================================
const store = new Store({
  defaults: {
    agreedToTerms: false,
    deviceId: '',
    autoLaunch: false,
    currentPersonaId: 1,
    personas: [
      { id: 1, name: '默认人设', content: '性别：男\n年龄：30\n职业：白领' },
      { id: 2, name: '人设2', content: '' },
      { id: 3, name: '人设3', content: '' }
    ],
    theme: 'default',
    themeMode: 'light',
    history: [],
    answerTemplates: [],
    aiMode: 'builtin',
    aiProvider: 'zhipu',
    aiApiKey: '',
    aiModel: 'glm-4-flash',
    isPremium: false,
    premiumLevel: null,
    nickname: '',
    gcTarget: 0,
  }
});

let mainWindow = null;
let isQuitting = false;
let localServer = null;
let localServerPort = 0;

// ============================================================
// 本地 HTTP 服务器（供 Turnstile 等使用）
// ============================================================
function startLocalServer() {
  return new Promise((resolve, reject) => {
    const srcRoot = path.join(__dirname, 'ui');
    localServer = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split('?')[0]);
        if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
        const filePath = path.join(srcRoot, urlPath);
        if (!filePath.startsWith(srcRoot)) { res.writeHead(403); res.end('Forbidden'); return; }
        fs.readFile(filePath, (err, data) => {
          if (err) { res.writeHead(404); res.end('Not found'); return; }
          const ext = path.extname(filePath).toLowerCase();
          const mime = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png', '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
          }[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': mime });
          res.end(data);
        });
      } catch (e) { res.writeHead(500); res.end('Server Error'); }
    });
    localServer.on('error', reject);
    localServer.listen(0, 'localhost', () => {
      localServerPort = localServer.address().port;
      console.log(`[LocalServer] http://localhost:${localServerPort} 已启动`);
      resolve(localServerPort);
    });
  });
}

function safeSend(channel, data) {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, data);
  } catch (e) {}
}

// ============================================================
// 窗口创建
// ============================================================
async function createWindow() {
  try { await startLocalServer(); }
  catch (e) { console.error('[LocalServer] 启动失败:', e.message); localServerPort = 0; }

  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    title: 'MoonBazaar Helper',
    backgroundColor: '#f1f5f9',
    frame: false, titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // 私有部署时在这里指定 preload-inject.js 路径
    // webPreferences.preload = path.join(__dirname, '..', 'src', 'preload-inject.js');
    webPreferences.contextIsolation = true;
    webPreferences.nodeIntegration = false;
  });

  if (localServerPort > 0) {
    mainWindow.loadURL(`http://localhost:${localServerPort}/index.html`);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  }

  mainWindow.on('close', () => { isQuitting = true; });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ============================================================
// IPC: 窗口控制
// ============================================================
ipcMain.handle('window-minimize', () => { mainWindow?.minimize(); return true; });
ipcMain.handle('window-maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
  return mainWindow.isMaximized();
});
ipcMain.handle('window-close', () => { mainWindow?.close(); return true; });
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() || false);

// ============================================================
// IPC: 配置
// ============================================================
ipcMain.handle('get-config', () => store.store);
ipcMain.handle('set-config', (event, key, value) => { store.set(key, value); return true; });
ipcMain.on('terms-agreed', () => {
  store.set('agreedToTerms', true);
  if (mainWindow && localServerPort > 0) {
    mainWindow.loadURL(`http://localhost:${localServerPort}/index.html`);
  }
});
ipcMain.handle('get-device-id', () => {
  let id = store.get('deviceId');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    store.set('deviceId', id);
  }
  return id;
});
ipcMain.handle('get-system-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
ipcMain.handle('get-app-version', () => app.getVersion());

// ============================================================
// IPC: 历史
// ============================================================
ipcMain.handle('history-list', () => store.get('history') || []);
ipcMain.handle('history-clear', () => { store.set('history', []); return true; });

// ============================================================
// IPC: 答案模板
// ============================================================
ipcMain.handle('get-templates', () => store.get('answerTemplates') || []);
ipcMain.handle('set-templates', (event, list) => {
  if (!Array.isArray(list)) return false;
  if (list.length > 200) list.length = 200;
  store.set('answerTemplates', list);
  return true;
});

// ============================================================
// IPC: 外部链接
// ============================================================
ipcMain.handle('open-external', (event, url) => {
  if (typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url)) return false;
  shell.openExternal(url);
  return true;
});

// ============================================================
// IPC: 代理检测
// ============================================================
ipcMain.handle('check-proxy', async () => {
  try {
    const proxy = await session.defaultSession.resolveProxy('https://moonbazaar.xyz');
    const isDirect = proxy.trim().toUpperCase() === 'DIRECT';
    return { proxy: proxy || 'DIRECT', hasProxy: !isDirect };
  } catch (e) { return { error: e.message, hasProxy: false }; }
});

// ============================================================
// IPC: AI（演示）
// ============================================================
ipcMain.handle('ai-providers', () => {
  return {
    providers: [
      { id: 'zhipu', name: '智谱 GLM', defaultModel: 'glm-4-flash',
        models: ['glm-4-flash', 'glm-4-air', 'glm-4-plus'], free: true },
      { id: 'deepseek', name: 'DeepSeek', defaultModel: 'deepseek-chat',
        models: ['deepseek-chat', 'deepseek-reasoner'], free: false },
      { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o-mini',
        models: ['gpt-4o-mini', 'gpt-4o'], free: false },
    ]
  };
});

ipcMain.handle('ask-ai', async (event, payload) => {
  // ⚠️ 演示版：直接返回 mock 数据
  return {
    content: '[开源演示版] 这是 mock 响应。完整 AI 功能需配合私有 Worker。',
    isCustom: false,
  };
});

ipcMain.handle('ai-usage', async () => ({ used: 0, limit: 3, isPro: false }));

// ============================================================
// IPC: 卡密（演示）
// ============================================================
ipcMain.handle('check-license', async () => {
  return {
    activated: store.get('isPremium', false),
    level: store.get('premiumLevel', null),
  };
});

ipcMain.handle('activate-license', async (event, code) => {
  return { error: '开源演示版不支持激活，请使用正式版' };
});

// ============================================================
// IPC: 通知 / 崩溃上报（演示）
// ============================================================
ipcMain.handle('show-notification', (event, { title, body }) => {
  try {
    new Notification({ title: title || 'MoonBazaar Helper', body: body || '' }).show();
    return true;
  } catch (e) { return false; }
});

ipcMain.handle('report-crash', () => true);

// ============================================================
// IPC: 导出 / 导入
// ============================================================
ipcMain.handle('export-data', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出配置',
    defaultPath: `MoonBazaarHelper-Config-${new Date().toISOString().slice(0,10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  try {
    const exportData = { __mb_export_version: 1, ...store.store };
    delete exportData.deviceId;
    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { success: true, path: result.filePath };
  } catch (e) { return { error: e.message }; }
});

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入配置',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const data = JSON.parse(raw);
    if (!data.__mb_export_version) return { error: '不是有效的配置文件' };
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('__')) continue;
      store.set(k, v);
    }
    return { success: true };
  } catch (e) { return { error: e.message }; }
});

// ============================================================
// IPC: 更新（演示）
// ============================================================
ipcMain.handle('check-update', async () => ({
  success: true, latest: true, version: app.getVersion()
}));
ipcMain.handle('install-update', () => ({ error: '开源演示版不支持自动更新' }));

// ============================================================
// IPC: 恢复出厂
// ============================================================
ipcMain.handle('restore-factory', () => {
  const deviceId = store.get('deviceId');
  store.clear();
  if (deviceId) store.set('deviceId', deviceId);
  return true;
});

// ============================================================
// 启动
// ============================================================
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  isQuitting = true;
  if (localServer) { try { localServer.close(); } catch (e) {} }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  isQuitting = false;
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});