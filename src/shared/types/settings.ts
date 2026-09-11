export type AppTheme = 'dark' | 'slate' | 'oled' | 'nord' | 'tokyo' | 'gruvbox' | 'monokai';

export interface AppSettings {
  theme: AppTheme;
  accentColor: string;
  language: 'ru' | 'en';
  pollingRateMs: number;
  graphHistoryLength: number;
  temperatureUnit: 'C' | 'F';
  terminalFontSize: number;
  terminalCursorStyle: 'block' | 'underline' | 'bar';
  startWithWindows: boolean;
  minimizeToTray: boolean;
  notificationsEnabled: boolean;
  tempAlertThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#38bdf8',
  language: 'ru',
  pollingRateMs: 1500,
  graphHistoryLength: 40,
  temperatureUnit: 'C',
  terminalFontSize: 13,
  terminalCursorStyle: 'block',
  startWithWindows: false,
  minimizeToTray: true,
  notificationsEnabled: true,
  tempAlertThreshold: 85
};
