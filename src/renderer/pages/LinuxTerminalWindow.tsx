import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { SystemOverview, SystemHardwareInfo } from '../../shared/types/system';
import { AppTheme } from '../../shared/types/settings';
import { STORM_LOGO } from '../assets/logo';

interface TerminalLine {
  id: string;
  type: 'cmd' | 'out' | 'err' | 'neofetch';
  text?: string;
}

const themeList: { id: AppTheme; label: string; dot: string }[] = [
  { id: 'dark', label: 'Obsidian Dark', dot: '#38bdf8' },
  { id: 'slate', label: 'Midnight Slate', dot: '#60a5fa' },
  { id: 'oled', label: 'Pure OLED', dot: '#ffffff' },
  { id: 'nord', label: 'Nord Frost', dot: '#88c0d0' },
  { id: 'tokyo', label: 'Tokyo Night', dot: '#7aa2f7' },
  { id: 'gruvbox', label: 'Gruvbox Dark', dot: '#fabd2f' },
  { id: 'monokai', label: 'Monokai Pro', dot: '#ffd866' }
];

export const LinuxTerminalWindow: React.FC = () => {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [specs, setSpecs] = useState<SystemHardwareInfo | null>(null);
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 'start-cmd', type: 'cmd', text: 'neofetch' },
    { id: 'start-neo', type: 'neofetch' }
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load and listen to settings & theme changes
  useEffect(() => {
    window.stormAPI?.getSettings().then((cfg) => {
      if (cfg?.theme) {
        setTheme(cfg.theme);
        document.documentElement.setAttribute('data-theme', cfg.theme);
      }
    }).catch(() => {});

    const unsubSettings = window.stormAPI?.onSettingsUpdated?.((cfg) => {
      if (cfg?.theme) {
        setTheme(cfg.theme);
        document.documentElement.setAttribute('data-theme', cfg.theme);
      }
    });

    return () => unsubSettings?.();
  }, []);

  useEffect(() => {
    window.stormAPI?.getOverview().then((data) => {
      if (data) setOverview(data);
    }).catch(() => {});

    window.stormAPI?.getHardwareSpecs().then((data) => {
      if (data) setSpecs(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = window.stormAPI?.onTerminalData((chunk) => {
      if (chunk.data) {
        setLines((prev) => [
          ...prev,
          {
            id: 'stream_' + Date.now() + '_' + Math.random(),
            type: chunk.type === 'stderr' ? 'err' : 'out',
            text: chunk.data
          }
        ]);
      }
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleMinimize = () => window.stormAPI?.minimize();
  const handleMaximize = () => window.stormAPI?.maximize();
  const handleClose = () => window.stormAPI?.close();

  const handleCycleTheme = async () => {
    const idx = themeList.findIndex((t) => t.id === theme);
    const nextTheme = themeList[(idx + 1) % themeList.length].id;
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    await window.stormAPI?.saveSettings({ theme: nextTheme });
  };

  const handleRunCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === 'clear' || trimmed === 'cls') {
      setLines([]);
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase() === 'neofetch' || trimmed.toLowerCase() === 'fastfetch') {
      setLines((prev) => [
        ...prev,
        { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
        { id: 'n_' + Date.now(), type: 'neofetch' }
      ]);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase() === 'help') {
      setLines((prev) => [
        ...prev,
        { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
        {
          id: 'o_' + Date.now(),
          type: 'out',
          text: `STORM Linux-Style Console Shell\r\nBuilt-in commands:\r\n  neofetch    - Print system info banner\r\n  free -m     - Show memory statistics\r\n  df -h       - Show disk partitions\r\n  uname -a    - Show OS kernel information\r\n  clear       - Clear screen\r\n  ... or type any Windows / CMD / PowerShell command (e.g. ipconfig, ping, whoami)`
        }
      ]);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase() === 'free -m' || trimmed.toLowerCase() === 'free') {
      const totalMb = overview ? Math.round(overview.memory.total / (1024 * 1024)) : 16384;
      const usedMb = overview ? Math.round(overview.memory.used / (1024 * 1024)) : 4120;
      const freeMb = totalMb - usedMb;
      setLines((prev) => [
        ...prev,
        { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
        {
          id: 'o_' + Date.now(),
          type: 'out',
          text: `               total        used        free      shared  buff/cache   available\r\nMem:           ${totalMb}        ${usedMb}        ${freeMb}         124        1840       ${freeMb + 1200}\r\nSwap:          4096         120        3976`
        }
      ]);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase() === 'df -h' || trimmed.toLowerCase() === 'df') {
      let dfText = 'Filesystem      Size  Used Avail Use% Mounted on\r\n';
      try {
        const disks = await window.stormAPI?.getStorageDetails();
        if (disks && disks.length > 0) {
          disks.forEach((d) => {
            const sz = (d.size / (1024 ** 3)).toFixed(0) + 'G';
            const us = (d.used / (1024 ** 3)).toFixed(0) + 'G';
            const av = (d.available / (1024 ** 3)).toFixed(0) + 'G';
            const mount = d.mount || 'C:';
            dfText += `${mount.padEnd(16)}${sz.padEnd(6)}${us.padEnd(6)}${av.padEnd(6)}${String(d.use || 0).padStart(3)}%  ${mount}\r\n`;
          });
        } else {
          dfText += '/dev/nvme0n1p2  238G  142G   84G  63% /';
        }
      } catch {
        dfText += '/dev/nvme0n1p2  238G  142G   84G  63% /';
      }
      setLines((prev) => [
        ...prev,
        { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
        { id: 'o_' + Date.now(), type: 'out', text: dfText.trim() }
      ]);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase().startsWith('theme')) {
      const parts = trimmed.split(' ');
      if (parts.length > 1) {
        const targetTheme = parts[1].toLowerCase() as AppTheme;
        const matched = themeList.find((t) => t.id === targetTheme);
        if (matched) {
          setTheme(matched.id);
          document.documentElement.setAttribute('data-theme', matched.id);
          await window.stormAPI?.saveSettings({ theme: matched.id });
          setLines((prev) => [
            ...prev,
            { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
            { id: 'o_' + Date.now(), type: 'out', text: `Theme switched to ${matched.label}` }
          ]);
          setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
          setInputVal('');
          return;
        }
      }
      setLines((prev) => [
        ...prev,
        { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
        {
          id: 'o_' + Date.now(),
          type: 'out',
          text: `Current theme: ${theme}\nAvailable themes: ${themeList.map((t) => t.id).join(', ')}\nUsage: theme <name>`
        }
      ]);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
      setInputVal('');
      return;
    }

    if (trimmed.toLowerCase() === 'uname -a' || trimmed.toLowerCase() === 'uname') {
      const release = specs?.os.release || '10.0.19045';
      const host = specs?.os.hostname || 'STORM-PC';
      setLines((prev) => [
        ...prev,
        { id: 'c_' + Date.now(), type: 'cmd', text: trimmed },
        {
          id: 'o_' + Date.now(),
          type: 'out',
          text: `Windows NT ${host} ${release} x86_64 Microsoft Windows`
        }
      ]);
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
      setInputVal('');
      return;
    }

    // Run system command
    setLines((prev) => [
      ...prev,
      { id: 'c_' + Date.now(), type: 'cmd', text: trimmed }
    ]);
    setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
    setInputVal('');

    try {
      await window.stormAPI?.runCommand(trimmed);
    } catch (e: any) {
      setLines((prev) => [
        ...prev,
        { id: 'e_' + Date.now(), type: 'err', text: `Error: ${e.message}` }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const next = Math.min(histIdx + 1, history.length - 1);
        setHistIdx(next);
        setInputVal(history[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) {
        const next = histIdx - 1;
        setHistIdx(next);
        setInputVal(history[next]);
      } else if (histIdx === 0) {
        setHistIdx(-1);
        setInputVal('');
      }
    }
  };

  const username = specs?.os.username || 'storm';
  const hostname = specs?.os.hostname || 'storm-pc';

  const uptimeStr = overview
    ? `${Math.floor(overview.uptime / 3600)} hours, ${Math.floor((overview.uptime % 3600) / 60)} mins`
    : '3 hours, 24 mins';
  const memUsedMb = overview ? Math.round(overview.memory.used / (1024 * 1024)) : 4120;
  const memTotMb = overview ? Math.round(overview.memory.total / (1024 * 1024)) : 16384;
  const memPercent = overview ? overview.memory.percentage : 25;

  const cpuName = overview?.cpu.model || specs?.cpu.brand || 'x86_64 Processor';
  const cpuSpeed = overview?.cpu.frequency
    ? (overview.cpu.frequency > 50 ? `${(overview.cpu.frequency / 1000).toFixed(2)} GHz` : `${overview.cpu.frequency.toFixed(2)} GHz`)
    : '3.40 GHz';
  const gpuName = overview?.gpu.name || specs?.gpu.controllers?.[0]?.model || 'Graphics Card';

  const diskUsedGb = overview ? Math.round(overview.disk.used / (1024 ** 3)) : 180;
  const diskTotalGb = overview ? Math.round(overview.disk.total / (1024 ** 3)) : 512;
  const diskPercent = overview?.disk.percentage || Math.round((diskUsedGb / diskTotalGb) * 100);

  const currentThemeObj = themeList.find((t) => t.id === theme) || themeList[0];

  // Custom, original STORM Terminal Lightning Bolt / Crest Logo (NOT Arch Linux)
  const asciiStorm = [
    '          ⚡ STORM          ',
    '        .-----------.       ',
    '       /   .-----.   \\      ',
    '      /   /       \\   \\     ',
    '     /   /___/\\    \\   \\    ',
    '    /   /___/  \\    \\   \\   ',
    '   /   /        \\    \\   \\  ',
    '  /___/   /\\     \\    \\___\\ ',
    '         /  \\     \\   \\     ',
    '        / /\\ \\     \\   \\    ',
    '       / /  \\ \\     \\   \\   ',
    '      / /____\\ \\     \\   \\  ',
    '     /__________\\     \\___\\ '
  ];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxSizing: 'border-box'
      }}
    >
      {/* Authentic Linux Konsole / SierraBreeze Header */}
      <header
        className="app-region-drag"
        style={{
          height: '36px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          userSelect: 'none'
        }}
      >
        {/* Left window traffic dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="app-region-no-drag">
          <button
            onClick={handleClose}
            title="Close"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ef4444',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.85
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
          />
          <button
            onClick={handleMinimize}
            title="Minimize"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#f59e0b',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.85
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
          />
          <button
            onClick={handleMaximize}
            title="Maximize"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#10b981',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.85
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
          />
        </div>

        {/* Center Title */}
        <div style={{
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <img src={STORM_LOGO} alt="STORM" style={{ width: '13px', height: '13px', objectFit: 'contain' }} />
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{username}@{hostname}</span>
          <span>:</span>
          <span style={{ color: 'var(--text-secondary)' }}>storm-console</span>
        </div>

        {/* Right Status & Quick Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="app-region-no-drag">
          <button
            onClick={handleCycleTheme}
            title="Click to switch theme"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              padding: '2px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentThemeObj.dot,
              display: 'inline-block'
            }} />
            <span>{currentThemeObj.label}</span>
          </button>

          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>x86_64</span>
        </div>
      </header>

      {/* Terminal Viewport */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => {
          if (line.type === 'cmd') {
            return (
              <div key={line.id} style={{ display: 'flex', gap: '8px', color: 'var(--text-primary)', marginTop: '8px' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>- $</span>
                <span style={{ color: 'var(--accent-primary)' }}>{line.text}</span>
              </div>
            );
          }

          if (line.type === 'err') {
            return (
              <div key={line.id} style={{ color: 'var(--accent-rose)', marginTop: '4px' }}>
                {line.text}
              </div>
            );
          }

          if (line.type === 'out') {
            return (
              <div key={line.id} style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                {line.text}
              </div>
            );
          }

          if (line.type === 'neofetch') {
            return (
              <div
                key={line.id}
                style={{
                  display: 'flex',
                  gap: '32px',
                  margin: '12px 0 16px 0',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left: Custom STORM Logo ASCII Art */}
                <div style={{
                  color: 'var(--accent-primary)',
                  lineHeight: '1.25',
                  userSelect: 'none',
                  fontSize: '12px'
                }}>
                  {asciiStorm.map((artLine, i) => (
                    <div key={i}>{artLine}</div>
                  ))}
                </div>

                {/* Right: Real System Telemetry Specs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12.5px' }}>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '14px' }}>
                    {username}<span style={{ color: 'var(--text-muted)' }}>@</span>{hostname}
                  </div>
                  <div style={{ color: 'var(--border-subtle)', userSelect: 'none' }}>
                    ------------------------
                  </div>

                  <div><strong style={{ color: 'var(--accent-primary)' }}>OS:</strong> Windows 11 {specs?.os.distro || 'Pro'} ({specs?.os.release || 'NT 10.0'}) x86_64</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Host:</strong> {specs?.motherboard.manufacturer || 'STORM'} {specs?.motherboard.model || 'PC'}</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Kernel:</strong> Windows NT {specs?.os.release || '10.0.19045'}</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Uptime:</strong> {uptimeStr}</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Shell:</strong> Windows PowerShell 7.4 / CMD</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>DE:</strong> Windows Fluent Acrylic</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>WM:</strong> DWM (Desktop Window Manager)</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Terminal:</strong> STORM Console</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Theme:</strong> {currentThemeObj.label} ({theme})</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>CPU:</strong> {cpuName} @ {cpuSpeed}</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>GPU:</strong> {gpuName}</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Memory:</strong> {memUsedMb}MiB / {memTotMb}MiB ({memPercent}%)</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Disk (C:):</strong> {diskUsedGb}GB / {diskTotalGb}GB ({diskPercent}%)</div>
                  <div><strong style={{ color: 'var(--accent-primary)' }}>Author:</strong> Storm (Made by Storm)</div>

                  {/* 8-color test palette blocks */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    {[
                      'var(--accent-rose)',
                      'var(--accent-emerald)',
                      'var(--accent-amber)',
                      'var(--accent-primary)',
                      '#a78bfa',
                      '#38bdf8',
                      'var(--text-primary)',
                      'var(--text-muted)'
                    ].map((col, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-block',
                          width: '24px',
                          height: '13px',
                          background: col,
                          borderRadius: '2px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Live Input prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand(inputVal);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px'
          }}
        >
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>- $</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px'
            }}
          />
        </form>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
