import { contextBridge, ipcRenderer } from 'electron';
import { IStormAPI } from '../shared/types/api';
import { TerminalStreamChunk } from '../shared/types/terminal';
import { AppSettings } from '../shared/types/settings';

const stormAPI: IStormAPI = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  openLinuxTerminal: () => ipcRenderer.send('window:openLinuxTerminal'),

  // System Telemetry
  getOverview: () => ipcRenderer.invoke('system:getOverview'),
  getHardwareSpecs: () => ipcRenderer.invoke('system:getHardwareSpecs'),
  getProcesses: () => ipcRenderer.invoke('processes:get'),
  killProcess: (pid: number, force?: boolean) => ipcRenderer.invoke('processes:kill', pid, force),
  getNetworkDetails: () => ipcRenderer.invoke('network:getDetails'),
  pingHost: (host: string) => ipcRenderer.invoke('network:ping', host),
  getStorageDetails: () => ipcRenderer.invoke('system:getStorageDetails'),
  getDisplays: () => ipcRenderer.invoke('system:getDisplays'),

  // Terminal
  runCommand: (command: string) => ipcRenderer.invoke('terminal:run', command),
  killCommand: (id: string) => ipcRenderer.invoke('terminal:kill', id),
  onTerminalData: (callback: (chunk: TerminalStreamChunk) => void) => {
    const handler = (_event: any, chunk: TerminalStreamChunk) => callback(chunk);
    ipcRenderer.on('terminal:stream', handler);
    return () => {
      ipcRenderer.removeListener('terminal:stream', handler);
    };
  },

  // Actions & Diagnostics
  openTaskManager: () => ipcRenderer.invoke('actions:openTaskManager'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('actions:copyToClipboard', text),
  exportReport: (format: 'json' | 'txt') => ipcRenderer.invoke('actions:exportReport', format),
  flushDns: () => ipcRenderer.invoke('actions:flushDns'),
  restartExplorer: () => ipcRenderer.invoke('actions:restartExplorer'),
  launchWindowsTool: (tool: string) => ipcRenderer.invoke('actions:launchWindowsTool', tool),
  launchAdminDiagnostic: (action: 'sfc' | 'dism' | 'chkdsk') => ipcRenderer.invoke('actions:launchAdminDiagnostic', action),
  getPowerScheme: () => ipcRenderer.invoke('actions:getPowerScheme'),
  setPowerScheme: (guid: string) => ipcRenderer.invoke('actions:setPowerScheme', guid),
  cleanDisk: (targets: { temp: boolean; windowsTemp: boolean; thumbnails: boolean; recycleBin: boolean }) => ipcRenderer.invoke('actions:cleanDisk', targets),
  getStartupApps: () => ipcRenderer.invoke('actions:getStartupApps'),
  toggleStartupApp: (name: string, location: string, enable: boolean) => ipcRenderer.invoke('actions:toggleStartupApp', name, location, enable),
  runDiskBenchmark: (sizeMB?: number) => ipcRenderer.invoke('actions:runDiskBenchmark', sizeMB),
  getSystemHealth: () => ipcRenderer.invoke('actions:getSystemHealth'),
  setHighPerformance: () => ipcRenderer.invoke('actions:setHighPerformance'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', settings),

  // Alerts
  onNotification: (callback: (alert: { title: string; message: string; type: 'warning' | 'info' | 'error' }) => void) => {
    const handler = (_event: any, alert: any) => callback(alert);
    ipcRenderer.on('system:notification', handler);
    return () => {
      ipcRenderer.removeListener('system:notification', handler);
    };
  },
  onSettingsUpdated: (callback: (settings: AppSettings) => void) => {
    const handler = (_event: any, settings: AppSettings) => callback(settings);
    ipcRenderer.on('settings:updated', handler);
    return () => {
      ipcRenderer.removeListener('settings:updated', handler);
    };
  }
};

contextBridge.exposeInMainWorld('stormAPI', stormAPI);
