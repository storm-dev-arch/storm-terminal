import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, NavTab } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer, ToastMessage } from './components/Toast';

import { OverviewPage } from './pages/OverviewPage';
import { SystemPage } from './pages/SystemPage';
import { ProcessesPage } from './pages/ProcessesPage';
import { NetworkPage } from './pages/NetworkPage';
import { StoragePage } from './pages/StoragePage';
import { ToolsPage } from './pages/ToolsPage';
import { TerminalPage } from './pages/TerminalPage';
import { SettingsPage } from './pages/SettingsPage';

import { SystemOverview } from '../shared/types/system';
import { AppSettings, DEFAULT_SETTINGS } from '../shared/types/settings';
import { Language, translations } from './i18n/translations';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const lang: Language = settings.language || 'ru';
  const t = translations[lang];

  // Telemetry graph buffers
  const [history, setHistory] = useState<{
    cpu: number[];
    gpu: number[];
    ram: number[];
    netDown: number[];
    netUp: number[];
  }>({
    cpu: Array(30).fill(0),
    gpu: Array(30).fill(0),
    ram: Array(30).fill(0),
    netDown: Array(30).fill(0),
    netUp: Array(30).fill(0)
  });

  const addToast = useCallback((title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load settings on startup
  useEffect(() => {
    window.stormAPI?.getSettings().then((cfg) => {
      if (cfg) {
        setSettings(cfg);
        document.documentElement.setAttribute('data-theme', cfg.theme || 'dark');
      }
    }).catch(console.error);

    const unsub = window.stormAPI?.onNotification((alert) => {
      addToast(alert.title, alert.message, alert.type);
    });

    return () => unsub?.();
  }, [addToast]);

  // Update theme whenever settings.theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Telemetry fetcher
  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await window.stormAPI?.getOverview();
      if (!data) return;

      setOverview(data);

      setHistory((prev) => {
        const maxPts = settings.graphHistoryLength || 40;
        const pushItem = (arr: number[], val: number) => {
          const next = [...arr, val];
          return next.length > maxPts ? next.slice(next.length - maxPts) : next;
        };

        return {
          cpu: pushItem(prev.cpu, data.cpu.usage),
          gpu: pushItem(prev.gpu, data.gpu.utilization ?? 0),
          ram: pushItem(prev.ram, data.memory.percentage),
          netDown: pushItem(prev.netDown, data.network.rxSec / 1024),
          netUp: pushItem(prev.netUp, data.network.txSec / 1024)
        };
      });
    } catch (err) {
      console.error('Error polling telemetry:', err);
    }
  }, [settings.graphHistoryLength]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, settings.pollingRateMs || 1500);
    return () => clearInterval(interval);
  }, [fetchTelemetry, settings.pollingRateMs]);

  // Global hotkeys (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleLang = useCallback(async () => {
    setSettings((prev) => {
      const nextLang: Language = prev.language === 'ru' ? 'en' : 'ru';
      window.stormAPI?.saveSettings({ language: nextLang });
      return { ...prev, language: nextLang };
    });
  }, []);

  const handleOpenTaskManager = async () => {
    await window.stormAPI?.openTaskManager();
    addToast(t.taskManager, lang === 'ru' ? 'Запрос на открытие диспетчера задач' : 'Windows Task Manager requested', 'info');
  };

  const handleCopyInfo = async () => {
    if (!overview) return;
    const ramGb = (overview.memory.total / (1024 ** 3)).toFixed(1);
    const report = `=========================================
          STORM TERMINAL REPORT
=========================================
Time:      ${new Date().toLocaleString()}
Status:    ONLINE
Uptime:    ${Math.floor(overview.uptime / 3600)}h ${Math.floor((overview.uptime % 3600) / 60)}m

[CPU]
Model:     ${overview.cpu.model}
Usage:     ${overview.cpu.usage}%
Temp:      ${overview.cpu.temp !== null ? `${overview.cpu.temp}°C` : 'N/A'}
Clock:     ${overview.cpu.frequency} GHz
Cores:     ${overview.cpu.cores}C / ${overview.cpu.threads}T

[GPU]
Device:    ${overview.gpu.name}
Usage:     ${overview.gpu.utilization !== null ? `${overview.gpu.utilization}%` : 'N/A'}
Temp:      ${overview.gpu.temp !== null ? `${overview.gpu.temp}°C` : 'N/A'}

[MEMORY]
RAM Total: ${ramGb} GB
Used:      ${(overview.memory.used / (1024 ** 3)).toFixed(1)} GB (${overview.memory.percentage}%)

[NETWORK]
Interface: ${overview.network.iface}
IP:        ${overview.network.ip4}
=========================================`;

    await window.stormAPI?.copyToClipboard(report);
    addToast(t.copiedToast, lang === 'ru' ? 'Отчёт о системе скопирован' : 'System information report copied.', 'success');
  };

  const handleExportReport = async (format: 'json' | 'txt') => {
    try {
      const res = await window.stormAPI?.exportReport(format);
      if (res?.success) {
        addToast(
          lang === 'ru' ? 'Отчёт экспортирован' : 'Report Exported',
          `${res.path}`,
          'success'
        );
      }
    } catch (e: any) {
      addToast(lang === 'ru' ? 'Ошибка экспорта' : 'Export Failed', e.message, 'error');
    }
  };

  const handleUpdateSettings = async (patch: Partial<AppSettings>) => {
    const updated = await window.stormAPI?.saveSettings(patch);
    if (updated) {
      setSettings(updated);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Frameless TitleBar (Memoized, completely isolated from telemetry re-renders) */}
      <TitleBar
        isOnline={true}
        lang={lang}
        onToggleLang={handleToggleLang}
      />

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 38px)', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenPalette={() => setIsPaletteOpen(true)}
          lang={lang}
        />

        {/* Content Viewport */}
        <main style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          padding: '16px 20px',
          background: 'var(--bg-app)',
          position: 'relative'
        }}>
          {activeTab === 'overview' && (
            <OverviewPage
              overview={overview}
              history={history}
              settings={settings}
              lang={lang}
              onNavigate={setActiveTab}
              onRefresh={fetchTelemetry}
              onOpenTaskManager={handleOpenTaskManager}
              onCopyInfo={handleCopyInfo}
            />
          )}

          {activeTab === 'system' && (
            <SystemPage
              lang={lang}
              onCopyInfo={handleCopyInfo}
              onExportReport={handleExportReport}
            />
          )}

          {activeTab === 'processes' && (
            <ProcessesPage lang={lang} onNotify={addToast} />
          )}

          {activeTab === 'network' && (
            <NetworkPage networkHistory={{ down: history.netDown, up: history.netUp }} lang={lang} />
          )}

          {activeTab === 'storage' && (
            <StoragePage lang={lang} />
          )}

          {activeTab === 'tools' && (
            <ToolsPage lang={lang} onNotify={addToast} />
          )}

          {activeTab === 'terminal' && (
            <TerminalPage fontSize={settings.terminalFontSize} lang={lang} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              lang={lang}
              onUpdateSettings={handleUpdateSettings}
              onNotify={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        lang={lang}
        onClose={() => setIsPaletteOpen(false)}
        onNavigate={setActiveTab}
        onRefresh={fetchTelemetry}
        onCopyInfo={handleCopyInfo}
        onExportReport={handleExportReport}
        onOpenTaskManager={handleOpenTaskManager}
      />

      {/* Notifications Toast */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
