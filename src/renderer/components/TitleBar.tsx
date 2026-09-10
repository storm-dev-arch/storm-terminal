import React, { useState, useEffect, memo } from 'react';
import { Minus, Square, X, Copy, Globe, Terminal } from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { STORM_LOGO } from '../assets/logo';

interface TitleBarProps {
  isOnline?: boolean;
  lang: Language;
  onToggleLang: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = memo(({
  isOnline = true,
  lang,
  onToggleLang
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    window.stormAPI?.isMaximized().then(setIsMaximized).catch(() => {});
  }, []);

  const handleMinimize = () => {
    window.stormAPI?.minimize();
  };

  const handleMaximize = async () => {
    window.stormAPI?.maximize();
    const state = await window.stormAPI?.isMaximized();
    setIsMaximized(state);
  };

  const handleClose = () => {
    window.stormAPI?.close();
  };

  return (
    <header style={{
      height: '38px',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 0 0 14px',
      userSelect: 'none',
      position: 'relative',
      zIndex: 50
    }} className="app-region-drag">
      {/* Brand & Identity — Understated, pro-grade, calm */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="app-region-no-drag">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '5px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img src={STORM_LOGO} alt="STORM" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}>
            STORM
          </span>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500
          }}>
            Terminal
          </span>
          <span style={{
            fontSize: '9.5px',
            color: 'var(--accent-primary)',
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--accent-primary-dim)',
            border: '1px solid var(--border-accent)',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}>
            by Storm
          </span>
        </div>

        <div style={{
          height: '12px',
          width: '1px',
          background: 'var(--border-subtle)',
          margin: '0 2px'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <span className={`status-dot ${isOnline ? 'status-dot-green' : 'status-dot-red'}`} />
          <span style={{ fontWeight: 500 }}>{isOnline ? t.statusOnline : t.statusOffline}</span>
        </div>
      </div>

      {/* Center Drag Area */}
      <div style={{ flex: 1, height: '100%' }} />

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }} className="app-region-no-drag">
        {/* Linux Console Launcher */}
        <button
          onClick={() => window.stormAPI?.openLinuxTerminal()}
          title={t.linuxTerminalTooltip || 'Linux Console'}
          style={{
            height: '22px',
            padding: '0 8px',
            marginRight: '6px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <Terminal size={11} style={{ color: '#38bdf8' }} />
          <span>Console</span>
        </button>

        {/* Subtle Language Pill */}
        <button
          onClick={onToggleLang}
          title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
          style={{
            height: '22px',
            padding: '0 8px',
            marginRight: '8px',
            borderRadius: 'var(--radius-xs)',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <Globe size={11} style={{ opacity: 0.7 }} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{lang === 'ru' ? 'RU' : 'EN'}</span>
        </button>

        {/* Minimalist Window Controls */}
        <button
          onClick={handleMinimize}
          title="Minimize"
          style={{
            width: '42px',
            height: '100%',
            color: 'var(--text-muted)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Minus size={13} />
        </button>

        <button
          onClick={handleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
          style={{
            width: '42px',
            height: '100%',
            color: 'var(--text-muted)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          {isMaximized ? <Copy size={11} style={{ transform: 'rotate(90deg)' }} /> : <Square size={11} />}
        </button>

        <button
          onClick={handleClose}
          title="Close"
          style={{
            width: '44px',
            height: '100%',
            color: 'var(--text-muted)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e11d48';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
});
