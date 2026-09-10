import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerWindowHandlers } from './ipc/window';
import { registerSystemHandlers, getLatestTemperatures } from './ipc/system';
import { registerProcessesHandlers } from './ipc/processes';
import { registerNetworkHandlers } from './ipc/network';
import { registerTerminalHandlers } from './ipc/terminal';
import { registerActionHandlers } from './ipc/actions';
import { TerminalManager } from './terminal/runner';
import { BackgroundMonitor } from './system/monitor';

// Disable hardware acceleration issues if any, or keep default
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow: BrowserWindow | null = null;
let linuxTerminalWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

function getAppIconPath(): string {
  const candidates = [
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'ico.png'),
    path.join(__dirname, '../../build/icon.ico'),
    path.join(__dirname, '../../build/icon.png'),
    path.join(__dirname, '../../ico.png'),
    path.join(process.cwd(), 'build/icon.ico'),
    path.join(process.cwd(), 'build/icon.png'),
    path.join(process.cwd(), 'ico.png')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return '';
}

function getAppIconImage(): Electron.NativeImage {
  const p = getAppIconPath();
  if (p && fs.existsSync(p)) {
    try {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    } catch {}
  }
  return nativeImage.createEmpty();
}

function createLinuxTerminalWindow(): void {
  if (linuxTerminalWindow && !linuxTerminalWindow.isDestroyed()) {
    linuxTerminalWindow.show();
    linuxTerminalWindow.focus();
    return;
  }

  const iconPath = getAppIconPath();

  linuxTerminalWindow = new BrowserWindow({
    width: 860,
    height: 560,
    minWidth: 700,
    minHeight: 450,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0c0e14',
    show: false,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  linuxTerminalWindow.once('ready-to-show', () => {
    linuxTerminalWindow?.show();
  });

  linuxTerminalWindow.on('closed', () => {
    linuxTerminalWindow = null;
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    linuxTerminalWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?window=linux-terminal`);
  } else {
    linuxTerminalWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { window: 'linux-terminal' }
    });
  }
}

function createTrayIcon(): Electron.NativeImage {
  const icon = getAppIconImage();
  if (!icon.isEmpty()) {
    return icon.resize({ width: 16, height: 16 });
  }
  // fallback 16x16 cyan diamond icon for STORM TERMINAL tray
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZklEQVR4nGNgGFjAiM7/z8DA8J8YDRf+/2dgQBZjxi3AAMWkGgB3A7oBGBoGzAcGBmQDUA0wGgwgAxA0gGEADAegG0C6AbAAGGBhAGwAbgNIMQA3AGwA3AYQHQ64A4ZcAKQZgA/AAN92bX80c7jLAAAAAElFTkSuQmCC';
  const img = nativeImage.createFromDataURL(`data:image/png;base64,${pngBase64}`);
  return img;
}

function createWindow(): void {
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#08090d',
    show: false,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Track window dragging state to completely eliminate hitching/stuttering during drag
  let isWindowMoving = false;
  let moveDebounceTimer: NodeJS.Timeout | null = null;

  mainWindow.on('will-move', () => {
    isWindowMoving = true;
  });

  mainWindow.on('move', () => {
    isWindowMoving = true;
    if (moveDebounceTimer) clearTimeout(moveDebounceTimer);
    moveDebounceTimer = setTimeout(() => {
      isWindowMoving = false;
    }, 250);
  });

  mainWindow.on('moved', () => {
    if (moveDebounceTimer) clearTimeout(moveDebounceTimer);
    moveDebounceTimer = setTimeout(() => {
      isWindowMoving = false;
    }, 250);
  });

  const terminalManager = new TerminalManager(() => mainWindow);
  const backgroundMonitor = new BackgroundMonitor(() => mainWindow, getLatestTemperatures);

  // Register all IPC interfaces
  registerWindowHandlers(mainWindow);
  registerSystemHandlers(() => isWindowMoving);
  registerProcessesHandlers();
  registerNetworkHandlers();
  registerTerminalHandlers(terminalManager);
  registerActionHandlers(mainWindow);

  ipcMain.on('window:openLinuxTerminal', () => {
    createLinuxTerminalWindow();
  });

  backgroundMonitor.start();

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle minimize to tray
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      // Check user settings
      try {
        const settingsPath = path.join(app.getPath('userData'), 'settings.json');
        if (fs.existsSync(settingsPath)) {
          const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
          if (cfg.minimizeToTray) {
            e.preventDefault();
            mainWindow?.hide();
            return;
          }
        }
      } catch {}
    }
    terminalManager.cleanup();
    backgroundMonitor.stop();
  });

  // Load URL
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function createTray(): void {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('STORM TERMINAL - System Monitor');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'STORM TERMINAL',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Status: ONLINE',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit STORM',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.storm.terminal');
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});
