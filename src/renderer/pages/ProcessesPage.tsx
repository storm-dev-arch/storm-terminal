import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  Pause,
  Play
} from 'lucide-react';
import { ProcessInfo } from '../../shared/types/process';
import { Language, translations } from '../i18n/translations';
import { ConfirmModal } from '../components/ConfirmModal';

interface ProcessesPageProps {
  lang: Language;
  onNotify: (title: string, msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

type SortField = 'cpu' | 'mem' | 'name' | 'pid';
type SortOrder = 'asc' | 'desc';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return mb.toFixed(1) + ' MB';
  }
  return (mb / 1024).toFixed(2) + ' GB';
}

export const ProcessesPage: React.FC<ProcessesPageProps> = ({ lang, onNotify }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [targetProcess, setTargetProcess] = useState<ProcessInfo | null>(null);
  const t = translations[lang];

  const fetchProcesses = async () => {
    try {
      const list = await window.stormAPI?.getProcesses();
      setProcesses(list || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(fetchProcesses, 3500);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleKill = async () => {
    if (!targetProcess) return;
    try {
      const res = await window.stormAPI?.killProcess(targetProcess.pid, false);
      if (res.success) {
        onNotify(
          lang === 'ru' ? 'Процесс завершён' : 'Process Terminated',
          `${targetProcess.name} (PID: ${targetProcess.pid})`,
          'success'
        );
        fetchProcesses();
      } else {
        onNotify(
          lang === 'ru' ? 'Ошибка завершения' : 'Termination Failed',
          res.error || 'Permission denied',
          'error'
        );
      }
    } catch (err: any) {
      onNotify('Error', err.message || 'Failed to kill process', 'error');
    } finally {
      setTargetProcess(null);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = processes;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.pid.toString().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'mem') {
        valA = a.memRss;
        valB = b.memRss;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [processes, query, sortField, sortOrder]);

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* Control bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px 0 6px 0',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '8px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-clean"
              placeholder={t.filterTasks}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '28px', height: '30px', fontSize: '12px' }}
            />
          </div>

          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {filteredAndSorted.length} / {processes.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-action"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            title="Auto-refresh"
          >
            {isAutoRefresh ? <Pause size={12} /> : <Play size={12} />}
            <span>{isAutoRefresh ? 'Auto: ON' : 'Auto: OFF'}</span>
          </button>

          <button className="btn-action" onClick={fetchProcesses} title={t.refresh}>
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 3fr) 80px 100px 120px 90px 80px',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-muted)'
        }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSort('name')}>
            <span>{t.colProcess}</span>
            {sortField === 'name' && <ArrowUpDown size={10} />}
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSort('pid')}>
            <span>{t.colPid}</span>
            {sortField === 'pid' && <ArrowUpDown size={10} />}
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSort('cpu')}>
            <span>{t.colCpu}</span>
            {sortField === 'cpu' && <ArrowUpDown size={10} />}
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSort('mem')}>
            <span>{t.colRam}</span>
            {sortField === 'mem' && <ArrowUpDown size={10} />}
          </div>
          <div>{t.colStatus}</div>
          <div style={{ textAlign: 'right' }}>{t.colAction}</div>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {lang === 'ru' ? 'Загрузка списка процессов...' : 'Loading task table...'}
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {lang === 'ru' ? 'Процессы не найдены.' : 'No processes match your filter.'}
            </div>
          ) : (
            filteredAndSorted.map((proc) => {
              const cpuVal = proc.cpu;
              const isHighCpu = cpuVal > 15;
              const isCritical = proc.isCritical;

              return (
                <div
                  key={proc.pid}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 3fr) 80px 100px 120px 90px 80px',
                    alignItems: 'center',
                    padding: '7px 14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono)',
                    transition: 'background-color 100ms ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                    <span style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {proc.name}
                    </span>
                    {isCritical && (
                      <span
                        title="Critical Windows System Service"
                        style={{
                          fontSize: '9px',
                          padding: '0 4px',
                          borderRadius: '2px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: 'var(--accent-amber)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          fontWeight: 500
                        }}
                      >
                        SYS
                      </span>
                    )}
                  </div>

                  {/* PID */}
                  <div style={{ color: 'var(--text-muted)' }}>
                    {proc.pid}
                  </div>

                  {/* CPU */}
                  <div style={{
                    color: isHighCpu ? 'var(--accent-rose)' : cpuVal > 3 ? 'var(--accent-amber)' : 'var(--text-secondary)'
                  }}>
                    {cpuVal.toFixed(1)}%
                  </div>

                  {/* RAM */}
                  <div style={{ color: 'var(--text-primary)' }}>
                    {formatBytes(proc.memRss)}
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--text-muted)',
                      fontSize: '11px'
                    }}>
                      <span className="status-dot status-dot-green" style={{ width: '5px', height: '5px' }} />
                      Active
                    </span>
                  </div>

                  {/* Kill Button */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action btn-danger"
                      style={{ padding: '2px 7px', fontSize: '11px' }}
                      onClick={() => setTargetProcess(proc)}
                      disabled={isCritical}
                      title={isCritical ? 'System protected process' : 'End process'}
                    >
                      {t.endBtn}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirm Kill Modal */}
      {targetProcess && (
        <ConfirmModal
          isOpen={true}
          title={lang === 'ru' ? 'Завершить процесс?' : 'Terminate Process?'}
          message={
            lang === 'ru'
              ? `Вы уверены, что хотите принудительно остановить процесс "${targetProcess.name}" (PID: ${targetProcess.pid})?`
              : `Are you sure you want to forcibly terminate process "${targetProcess.name}" (PID: ${targetProcess.pid})?`
          }
          confirmText={t.yesEnd}
          cancelText={t.cancel}
          isDanger={true}
          onConfirm={handleKill}
          onCancel={() => setTargetProcess(null)}
        />
      )}
    </div>
  );
};
