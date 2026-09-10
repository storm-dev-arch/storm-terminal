import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Activity,
  HardDrive,
  Terminal,
  Settings,
  Search,
  Wrench
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { STORM_LOGO } from '../assets/logo';

export type NavTab = 'overview' | 'system' | 'processes' | 'network' | 'storage' | 'tools' | 'terminal' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPalette: () => void;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onOpenPalette, lang }) => {
  const t = translations[lang];

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t.overview, icon: <LayoutDashboard size={15} /> },
    { id: 'system', label: t.system, icon: <Cpu size={15} /> },
    { id: 'processes', label: t.processes, icon: <Layers size={15} /> },
    { id: 'network', label: t.network, icon: <Activity size={15} /> },
    { id: 'storage', label: t.storage, icon: <HardDrive size={15} /> },
    { id: 'tools', label: t.tools, icon: <Wrench size={15} /> },
    { id: 'terminal', label: t.terminal, icon: <Terminal size={15} /> },
    { id: 'settings', label: t.settings, icon: <Settings size={15} /> },
  ];

  return (
    <aside style={{
      width: '200px',
      minWidth: '200px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 8px',
      height: '100%',
      justifyContent: 'space-between',
      userSelect: 'none'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Search / Command palette launcher */}
        <button
          onClick={onOpenPalette}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            marginBottom: '8px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Search size={12} />
            <span>{lang === 'ru' ? 'Поиск...' : 'Search...'}</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '1px 5px',
            borderRadius: '3px',
            color: 'var(--text-muted)'
          }}>Ctrl K</span>
        </button>

        {/* Navigation Items */}
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* System Footer info */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '10.5px',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src={STORM_LOGO} alt="STORM" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
            <span>STORM v1.2</span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>WIN64</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Made by</span>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Storm</span>
        </div>
      </div>
    </aside>
  );
};
