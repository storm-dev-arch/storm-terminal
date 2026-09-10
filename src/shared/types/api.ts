import { SystemOverview, SystemHardwareInfo, DiskPartition, DisplayInfo, PowerSchemeInfo, StartupAppInfo, DiskBenchmarkResult, SystemHealthStatus } from './system';
import { ProcessInfo, KillProcessResult } from './process';
import { NetworkDetails, PingResult } from './network';
import { TerminalStreamChunk } from './terminal';
import { AppSettings } from './settings';

export interface IStormAPI {
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  openLinuxTerminal: () => void;

  // System Telemetry
  getOverview: () => Promise<SystemOverview>;
  getHardwareSpecs: () => Promise<SystemHardwareInfo>;
  getProcesses: () => Promise<ProcessInfo[]>;
  killProcess: (pid: number, force?: boolean) => Promise<KillProcessResult>;
  getNetworkDetails: () => Promise<NetworkDetails>;
  pingHost: (host: string) => Promise<PingResult>;
  getStorageDetails: () => Promise<DiskPartition[]>;
  getDisplays: () => Promise<DisplayInfo[]>;

  // Terminal
  runCommand: (command: string) => Promise<{ id: string }>;
  killCommand: (id: string) => Promise<void>;
  onTerminalData: (callback: (chunk: TerminalStreamChunk) => void) => () => void;

  // Actions & Diagnostics
  openTaskManager: () => Promise<void>;
  copyToClipboard: (text: string) => Promise<boolean>;
  exportReport: (format: 'json' | 'txt') => Promise<{ success: boolean; path?: string }>;
  flushDns: () => Promise<{ success: boolean; message?: string }>;
  restartExplorer: () => Promise<{ success: boolean }>;
  launchWindowsTool: (tool: string) => Promise<{ success: boolean; error?: string }>;
  launchAdminDiagnostic: (action: 'sfc' | 'dism' | 'chkdsk') => Promise<{ success: boolean; error?: string }>;
  getPowerScheme: () => Promise<PowerSchemeInfo>;
  setPowerScheme: (guid: string) => Promise<{ success: boolean }>;
  cleanDisk: (targets: { temp: boolean; windowsTemp: boolean; thumbnails: boolean; recycleBin: boolean }) => Promise<{ success: boolean; freedBytes: number; message: string }>;
  getStartupApps: () => Promise<StartupAppInfo[]>;
  toggleStartupApp: (name: string, location: string, enable: boolean) => Promise<{ success: boolean }>;
  runDiskBenchmark: (sizeMB?: number) => Promise<DiskBenchmarkResult>;
  getSystemHealth: () => Promise<SystemHealthStatus>;
  setHighPerformance: () => Promise<{ success: boolean }>;

  // Settings
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;

  // Alerts & Notifications
  onNotification: (callback: (alert: { title: string; message: string; type: 'warning' | 'info' | 'error' }) => void) => () => void;
  onSettingsUpdated?: (callback: (settings: AppSettings) => void) => () => void;
}

declare global {
  interface Window {
    stormAPI: IStormAPI;
  }
}
