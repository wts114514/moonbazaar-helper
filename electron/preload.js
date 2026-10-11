const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ============ 配置 ============
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
  agreeTerms: () => ipcRenderer.send('terms-agreed'),
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // ============ AI ============
  askAI: (payload) => ipcRenderer.invoke('ask-ai', payload),
  aiUsage: () => ipcRenderer.invoke('ai-usage'),
  aiProviders: () => ipcRenderer.invoke('ai-providers'),

  // ============ 卡密 ============
  activateLicense: (code) => ipcRenderer.invoke('activate-license', code),
  checkLicense: () => ipcRenderer.invoke('check-license'),

  // ============ 通知 / 崩溃 ============
  showNotification: (payload) => ipcRenderer.invoke('show-notification', payload),
  reportCrash: (payload) => ipcRenderer.invoke('report-crash', payload),

  // ============ 导出 / 导入 ============
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),

  // ============ 答案模板 ============
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  setTemplates: (list) => ipcRenderer.invoke('set-templates', list),

  // ============ 历史 ============
  historyList: () => ipcRenderer.invoke('history-list'),
  historyClear: () => ipcRenderer.invoke('history-clear'),

  // ============ 更新 ============
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // ============ 代理检测 ============
  checkProxy: () => ipcRenderer.invoke('check-proxy'),

  // ============ 外部链接 ============
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // ============ 恢复出厂 ============
  restoreFactory: () => ipcRenderer.invoke('restore-factory'),

  // ============ 窗口控制 ============
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});