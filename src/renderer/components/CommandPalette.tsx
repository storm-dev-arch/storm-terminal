import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Activity,
  HardDrive,
  Terminal,
  Settings,
  FileText,
  Copy,
  RefreshCw,
  ExternalLink,
  Search,
  Wrench
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { Language, translations } from '../i18n/translations';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onRefresh: () => void;
  onCopyInfo: () => void;
  onExportReport: (fmt: 'json' | 'txt') => void;
  onOpenTaskManager: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  lang,
  onClose,
  onNavigate,
  onRefresh,
  onCopyInfo,
  onExportReport,
  onOpenTaskManager
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[lang];

  const catNav = lang === 'ru' ? 'Навигация' : 'Navigation';
  const catAct = lang === 'ru' ? 'Действия' : 'Actions';

  const commands: CommandItem[] = [
    {
      id: 'nav-overview',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.overview}`,
      category: catNav,
      icon: <LayoutDashboard size={14} />,
      action: () => onNavigate('overview')
    },
    {
      id: 'nav-system',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.system}`,
      category: catNav,
      icon: <Cpu size={14} />,
      action: () => onNavigate('system')
    },
    {
      id: 'nav-processes',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.processes}`,
      category: catNav,
      icon: <Layers size={14} />,
      action: () => onNavigate('processes')
    },
    {
      id: 'nav-network',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.network}`,
      category: catNav,
      icon: <Activity size={14} />,
      action: () => onNavigate('network')
    },
    {
      id: 'nav-storage',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.storage}`,
      category: catNav,
      icon: <HardDrive size={14} />,
      action: () => onNavigate('storage')
    },
    {
      id: 'nav-tools',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.tools || 'Инструменты'}`,
      category: catNav,
      icon: <Wrench size={14} />,
      action: () => onNavigate('tools')
    },
    {
      id: 'nav-terminal',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.terminal}`,
      category: catNav,
      icon: <Terminal size={14} />,
      action: () => onNavigate('terminal')
    },
    {
      id: 'nav-settings',
      title: `${lang === 'ru' ? 'Перейти' : 'Open'}: ${t.settings}`,
      category: catNav,
      icon: <Settings size={14} />,
      action: () => onNavigate('settings')
    },
    {
      id: 'act-refresh',
      title: t.refresh,
      category: catAct,
      icon: <RefreshCw size={14} />,
      action: onRefresh,
      shortcut: 'F5'
    },
    {
      id: 'act-copy',
      title: t.copyInfo,
      category: catAct,
      icon: <Copy size={14} />,
      action: onCopyInfo
    },
    {
      id: 'act-taskmgr',
      title: t.taskManager,
      category: catAct,
      icon: <ExternalLink size={14} />,
      action: onOpenTaskManager
    },
    {
      id: 'act-export-json',
      title: t.exportJson,
      category: catAct,
      icon: <FileText size={14} />,
      action: () => onExportReport('json')
    },
    {
      id: 'act-export-txt',
      title: t.exportTxt,
      category: catAct,
      icon: <FileText size={14} />,
      action: () => onExportReport('txt')
    }
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="surface-card"
        style={{
          width: '540px',
          maxWidth: '92%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-hover)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '2px 5px',
            borderRadius: '3px',
            color: 'var(--text-muted)'
          }}>
            ESC
          </span>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '5px' }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12.5px'
            }}>
              {lang === 'ru' ? 'Ничего не найдено' : 'No matching commands found'}
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 70ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ color: isSelected ? '#ffffff' : 'var(--text-muted)', display: 'flex' }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 500 : 400 }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)'
                    }}>
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9.5px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        color: 'var(--text-muted)'
                      }}>
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer navigation guide */}
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span><kbd style={{ color: 'var(--text-secondary)' }}>↑↓</kbd> {lang === 'ru' ? 'Навигация' : 'Navigate'}</span>
            <span><kbd style={{ color: 'var(--text-secondary)' }}>↵</kbd> {lang === 'ru' ? 'Выбрать' : 'Select'}</span>
            <span><kbd style={{ color: 'var(--text-secondary)' }}>ESC</kbd> {lang === 'ru' ? 'Закрыть' : 'Close'}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            STORM • Made by <strong style={{ color: 'var(--accent-primary)' }}>Storm</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
