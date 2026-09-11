import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Trash2, ArrowDownCircle, CornerDownLeft, ExternalLink } from 'lucide-react';
import { TerminalStreamChunk } from '../../shared/types/terminal';
import { Language, translations } from '../i18n/translations';

interface TerminalPageProps {
  fontSize?: number;
  lang: Language;
}

interface TerminalLogLine {
  id: string;
  type: 'stdout' | 'stderr' | 'exit' | 'command' | 'system';
  text: string;
}

export const TerminalPage: React.FC<TerminalPageProps> = ({ fontSize = 13, lang }) => {
  const t = translations[lang];

  const [lines, setLines] = useState<TerminalLogLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'STORM Terminal v1.2 [Windows Diagnostic Shell] • Made by Storm'
    },
    {
      id: 'init-2',
      type: 'system',
      text: lang === 'ru'
        ? 'Разработчик: Storm | Введите команду Windows (например: systeminfo, ipconfig, ping google.com, whoami)'
        : 'Developer: Storm | Type safe Windows diagnostic commands below (e.g. systeminfo, ipconfig, ping google.com, whoami)'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const suggestions = [
    'systeminfo',
    'ipconfig',
    'ping google.com -n 3',
    'whoami',
    'tasklist',
    'netstat -an',
    'node -v'
  ];

  useEffect(() => {
    const unsub = window.stormAPI?.onTerminalData((chunk: TerminalStreamChunk) => {
      if (chunk.data) {
        setLines((prev) => [
          ...prev,
          {
            id: 'chunk_' + Date.now() + '_' + Math.random(),
            type: chunk.type === 'stderr' || chunk.type === 'error' ? 'stderr' : 'stdout',
            text: chunk.data!
          }
        ]);
      } else if (chunk.type === 'exit') {
        setActiveCommandId(null);
        setLines((prev) => [
          ...prev,
          {
            id: 'exit_' + Date.now(),
            type: 'system',
            text: `[Process exited with code ${chunk.code ?? 0}]`
          }
        ]);
      }
    });

    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll]);

  const runCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === 'clear' || trimmed === 'cls') {
      setLines([]);
      setInputVal('');
      return;
    }

    setLines((prev) => [
      ...prev,
      {
        id: 'cmd_' + Date.now(),
        type: 'command',
        text: `❯ ${trimmed}`
      }
    ]);

    setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 50));
    setHistoryIndex(-1);
    setInputVal('');

    try {
      const res = await window.stormAPI?.runCommand(trimmed);
      if (res?.id) {
        setActiveCommandId(res.id);
      }
    } catch (err: any) {
      setLines((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          type: 'stderr',
          text: `Command failed to start: ${err.message}`
        }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(inputVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setLines([]);
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'c' && activeCommandId) {
      e.preventDefault();
      window.stormAPI?.killCommand(activeCommandId);
      setActiveCommandId(null);
      setLines((prev) => [
        ...prev,
        {
          id: 'cancel_' + Date.now(),
          type: 'stderr',
          text: '^C [Terminated]'
        }
      ]);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div className="page-fade" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '10px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t.terminalEnv}
          </h1>
          {activeCommandId && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              RUNNING
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-action"
            onClick={() => window.stormAPI?.openLinuxTerminal()}
            title={t.linuxTerminalTooltip}
          >
            <ExternalLink size={12} style={{ color: 'var(--accent-primary)' }} />
            <span>{t.openLinuxTerminal}</span>
          </button>

          <button
            className="btn-action"
            onClick={() => setAutoScroll(!autoScroll)}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle size={12} style={{ color: autoScroll ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
            <span>{autoScroll ? 'Scroll: ON' : 'Scroll: OFF'}</span>
          </button>

          <button className="btn-action" onClick={() => setLines([])} title={t.clearBtn}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
        {suggestions.map((cmd) => (
          <button
            key={cmd}
            onClick={() => runCommand(cmd)}
            style={{
              padding: '3px 8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
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
            {cmd}
          </button>
        ))}
      </div>

      <div
        className="surface-card"
        style={{
          flex: 1,
          background: 'var(--bg-app)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <div style={{
          flex: 1,
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: `${fontSize}px`,
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}>
          {lines.map((line) => {
            let color = '#e2e8f0';
            if (line.type === 'command') color = '#ffffff';
            else if (line.type === 'stderr') color = 'var(--accent-rose)';
            else if (line.type === 'system') color = 'var(--text-muted)';

            return (
              <div key={line.id} style={{ color, marginBottom: line.type === 'command' ? '4px' : '2px' }}>
                {line.text}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '8px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: `${fontSize}px`,
            color: 'var(--text-muted)',
            fontWeight: 600,
            userSelect: 'none'
          }}>
            ❯
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.typeCommand}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: `${fontSize}px`
            }}
          />
          <button type="submit" style={{ color: 'var(--text-muted)', padding: '2px 4px' }} title="Execute (Enter)">
            <CornerDownLeft size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
