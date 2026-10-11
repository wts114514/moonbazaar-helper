// ============================================================
// MoonBazaar Helper · 开源版渲染进程
// ============================================================

// ============ 工具函数 ============
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ============ 自定义输入弹窗 ============
function mbPrompt(title, defaultValue = '', placeholder = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('mb-input-modal');
    const titleEl = document.getElementById('mb-input-title');
    const input = document.getElementById('mb-input-field');
    const cancelBtn = document.getElementById('mb-input-cancel');
    const okBtn = document.getElementById('mb-input-ok');
    if (!modal) { resolve(null); return; }

    titleEl.textContent = title;
    input.value = defaultValue || '';
    input.placeholder = placeholder || '';
    modal.style.display = 'flex';

    setTimeout(() => { input.focus(); input.select(); }, 60);

    const cleanup = () => {
      modal.style.display = 'none';
      cancelBtn.onclick = null;
      okBtn.onclick = null;
      input.onkeydown = null;
    };

    cancelBtn.onclick = () => { cleanup(); resolve(null); };
    okBtn.onclick = () => { cleanup(); resolve(input.value); };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); cleanup(); resolve(input.value); }
      if (e.key === 'Escape') { cleanup(); resolve(null); }
    };
  });
}

// ============ 侧边栏切换 ============
document.querySelectorAll('.sidebar-item').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const page = document.getElementById('page-' + btn.dataset.page);
    if (page) page.classList.remove('hidden');

    switch (btn.dataset.page) {
      case 'templates': loadTemplates(); break;
    }
  };
});

// ============ 答案模板 ============
let templates = [];

async function loadTemplates() {
  templates = await window.api.getTemplates() || [];
  renderTemplates();
}

function renderTemplates() {
  const list = document.getElementById('template-list');
  if (!list) return;
  if (!templates.length) {
    list.innerHTML = '<div class="text-center text-slate-400 py-8">还没有模板，点右上角"新增"添加</div>';
    return;
  }
  list.innerHTML = templates.map((t, i) => `
    <div class="bg-white p-4 rounded-xl border border-slate-200">
      <div class="flex justify-between items-start mb-2">
        <div class="font-bold text-sm text-slate-700">${escapeHtml(t.title || '未命名')}</div>
        <div class="flex gap-2">
          <button class="tpl-edit text-xs text-slate-400 hover:text-sky-500" data-idx="${i}">
            <i class="fas fa-pen"></i>
          </button>
          <button class="tpl-del text-xs text-slate-400 hover:text-red-500" data-idx="${i}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="text-sm text-slate-600 whitespace-pre-wrap">${escapeHtml(t.content || '')}</div>
    </div>
  `).join('');

  list.querySelectorAll('.tpl-edit').forEach(btn => {
    btn.onclick = () => editTemplate(parseInt(btn.dataset.idx));
  });
  list.querySelectorAll('.tpl-del').forEach(btn => {
    btn.onclick = async () => {
      const i = parseInt(btn.dataset.idx);
      if (!confirm('确定删除该模板？')) return;
      templates.splice(i, 1);
      await window.api.setTemplates(templates);
      renderTemplates();
    };
  });
}

async function editTemplate(idx) {
  const isNew = idx === -1;
  const t = isNew ? { title: '', content: '' } : templates[idx];

  const title = await mbPrompt('模板标题', t.title || '', '例如：年龄段');
  if (title === null) return;

  const content = await mbPrompt('模板内容', t.content || '', '例如：25-30岁');
  if (content === null) return;

  if (isNew) templates.push({ title, content });
  else templates[idx] = { title, content };

  await window.api.setTemplates(templates);
  renderTemplates();
}

const templateAddBtn = document.getElementById('template-add-btn');
if (templateAddBtn) templateAddBtn.onclick = () => editTemplate(-1);

// ============ 数据导出 / 导入 ============
const exportDataBtn = document.getElementById('export-data-btn');
if (exportDataBtn) {
  exportDataBtn.onclick = async () => {
    const resultEl = document.getElementById('data-result');
    const res = await window.api.exportData();
    if (res.canceled) return;
    if (res.success) {
      resultEl.innerHTML = `<span class="text-green-600">✅ 已导出到：${escapeHtml(res.path)}</span>`;
    } else {
      resultEl.innerHTML = `<span class="text-red-500">❌ ${escapeHtml(res.error || '导出失败')}</span>`;
    }
  };
}

const importDataBtn = document.getElementById('import-data-btn');
if (importDataBtn) {
  importDataBtn.onclick = async () => {
    const resultEl = document.getElementById('data-result');
    if (!confirm('导入将覆盖当前配置，确定继续？')) return;
    const res = await window.api.importData();
    if (res.canceled) return;
    if (res.success) {
      resultEl.innerHTML = '<span class="text-green-600">✅ 导入成功，即将重启</span>';
      setTimeout(() => location.reload(), 1500);
    } else {
      resultEl.innerHTML = `<span class="text-red-500">❌ ${escapeHtml(res.error || '导入失败')}</span>`;
    }
  };
}

// ============ 保存设置 ============
const saveSettingsBtn = document.getElementById('save-settings');
if (saveSettingsBtn) {
  saveSettingsBtn.onclick = async () => {
    const autoLaunch = document.getElementById('toggle-autolaunch')?.checked;
    await window.api.setConfig('autoLaunch', autoLaunch);
    alert('设置已保存 ✓');
  };
}

// ============ 窗口控制 ============
const winMin = document.getElementById('win-min');
if (winMin) winMin.onclick = () => window.api.windowMinimize();

const winMax = document.getElementById('win-max');
if (winMax) winMax.onclick = () => window.api.windowMaximize();

const winClose = document.getElementById('win-close');
if (winClose) winClose.onclick = () => window.api.windowClose();

// ============ 多标签浏览器（简化版） ============
const tabs = [];
let activeTabId = null;
let tabCounter = 0;
const HOME_URL = 'https://moonbazaar.xyz/home';

function createTab(url = HOME_URL) {
  const id = ++tabCounter;
  const container = document.getElementById('webview-container');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'webview-wrapper active';
  wrapper.dataset.tabId = id;
  wrapper.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:row;';

  const wv = document.createElement('webview');
  wv.setAttribute('src', url);
  wv.setAttribute('allowpopups', 'true');
  wv.setAttribute('partition', 'persist:moonbazaar');
  wv.style.width = '100%';
  wv.style.height = '100%';
  wrapper.appendChild(wv);
  container.appendChild(wrapper);

  const tab = { id, url, title: '加载中...', wrapper, webview: wv };
  tabs.push(tab);

  wv.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || url;
    renderTabs();
  });

  wv.addEventListener('did-navigate', (e) => {
    tab.url = e.url || url;
    const urlInput = document.getElementById('nav-url');
    if (urlInput && activeTabId === id) urlInput.value = tab.url;
  });

  tabs.forEach(t => { if (t.id !== id) t.wrapper.classList.remove('active'); });
  activeTabId = id;
  renderTabs();
}

function renderTabs() {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;
  bar.innerHTML = '';
  tabs.forEach(t => {
    const el = document.createElement('div');
    el.className = 'tab-item' + (t.id === activeTabId ? ' active' : '');
    el.innerHTML = `<span>${escapeHtml((t.title || t.url).slice(0, 20))}</span>`;
    el.onclick = () => {
      activeTabId = t.id;
      tabs.forEach(x => {
        x.wrapper.classList.toggle('active', x.id === t.id);
        if (x.id === t.id) x.wrapper.style.display = 'flex';
        else x.wrapper.style.display = 'none';
      });
      const urlInput = document.getElementById('nav-url');
      if (urlInput) urlInput.value = t.url;
      renderTabs();
    };
    bar.appendChild(el);
  });
}

function getActiveWebview() {
  const tab = tabs.find(t => t.id === activeTabId);
  return tab ? tab.webview : null;
}

function bindToolbar() {
  const back = document.getElementById('nav-back');
  const forward = document.getElementById('nav-forward');
  const reload = document.getElementById('nav-reload');
  const home = document.getElementById('nav-home');
  const go = document.getElementById('nav-go');
  const urlInput = document.getElementById('nav-url');

  if (back) back.onclick = () => { const wv = getActiveWebview(); if (wv && wv.canGoBack()) wv.goBack(); };
  if (forward) forward.onclick = () => { const wv = getActiveWebview(); if (wv && wv.canGoForward()) wv.goForward(); };
  if (reload) reload.onclick = () => { const wv = getActiveWebview(); if (wv) wv.reload(); };
  if (home) home.onclick = () => { const wv = getActiveWebview(); if (wv) wv.loadURL(HOME_URL); };

  const navigate = () => {
    let url = (urlInput.value || '').trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const wv = getActiveWebview();
    if (wv) wv.loadURL(url);
  };
  if (go) go.onclick = navigate;
  if (urlInput) urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });
}

function initBrowser() {
  createTab(HOME_URL);
  bindToolbar();
}

// ============ 初始化 ============
(async () => {
  // 版本号
  try {
    const version = await window.api.getAppVersion();
    const v1 = document.getElementById('app-version');
    const v2 = document.getElementById('about-version');
    if (v1) v1.textContent = version;
    if (v2) v2.textContent = version;
  } catch (e) {}

  // 配置
  try {
    const cfg = await window.api.getConfig();
    const autoLaunchEl = document.getElementById('toggle-autolaunch');
    if (autoLaunchEl) autoLaunchEl.checked = cfg.autoLaunch || false;

    const deviceEl = document.getElementById('device-id');
    if (deviceEl) {
      const deviceId = await window.api.getDeviceId();
      deviceEl.textContent = deviceId;
    }
  } catch (e) {}

  // 启动浏览器
  initBrowser();
})();