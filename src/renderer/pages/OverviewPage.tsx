import React from 'react';
import {
  Cpu,
  Tv,
  HardDrive,
  Activity,
  Zap,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { SystemOverview } from '../../shared/types/system';
import { AppSettings } from '../../shared/types/settings';
import { Language, translations } from '../i18n/translations';
import { MetricCard } from '../components/MetricCard';
import { RealtimeChart } from '../components/RealtimeChart';
import { ProgressBar } from '../components/ProgressBar';
import { NavTab } from '../components/Sidebar';

interface OverviewPageProps {
  overview: SystemOverview | null;
  history: {
    cpu: number[];
    gpu: number[];
    ram: number[];
    netDown: number[];
    netUp: number[];
  };
  settings: AppSettings;
  lang: Language;
  onNavigate: (tab: NavTab) => void;
  onRefresh: () => void;
  onOpenTaskManager: () => void;
  onCopyInfo: () => void;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
  const k = 1024;
  if (bytesPerSec < k * k) {
    return (bytesPerSec / k).toFixed(1) + ' KB/s';
  }
  return (bytesPerSec / (k * k)).toFixed(1) + ' MB/s';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  overview,
  history,
  settings,
  lang,
  onRefresh,
  onOpenTaskManager,
  onCopyInfo
}) => {
  const t = translations[lang];

  if (!overview) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px'
      }}>
        {lang === 'ru' ? 'Считывание системной телеметрии...' : 'Connecting to telemetry stream...'}
      </div>
    );
  }

  const { cpu, gpu, memory, disk, network } = overview;

  const formatTemp = (celsius: number | null) => {
    if (celsius === null || celsius === undefined || isNaN(celsius)) return 'N/A';
    if (settings.temperatureUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const ramTotalGb = (memory.total / 1024 ** 3).toFixed(1);
  const ramUsedGb = (memory.used / 1024 ** 3).toFixed(1);
  const ramFreeGb = (memory.free / 1024 ** 3).toFixed(1);

  const diskTotalGb = (disk.total / 1024 ** 3).toFixed(0);
  const diskUsedGb = (disk.used / 1024 ** 3).toFixed(0);
  const diskFreeGb = (disk.free / 1024 ** 3).toFixed(0);

  const uptimeHours = Math.floor(overview.uptime / 3600);
  const uptimeMinutes = Math.floor((overview.uptime % 3600) / 60);

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '2px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              {t.overview}
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)'
            }}>
              <span className="status-dot status-dot-green" />
              {t.statusOnline} • {uptimeHours}{lang === 'ru' ? 'ч' : 'h'} {uptimeMinutes}{lang === 'ru' ? 'м' : 'm'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className="btn-action" onClick={onCopyInfo} title={t.copyInfo}>
            <Copy size={12} />
            <span>{lang === 'ru' ? 'Копия отчёта' : 'Copy'}</span>
          </button>
          <button className="btn-action" onClick={onOpenTaskManager} title={t.taskManager}>
            <ExternalLink size={12} />
            <span>{lang === 'ru' ? 'Диспетчер' : 'Taskmgr'}</span>
          </button>
          <button className="btn-action" onClick={onRefresh} title={t.refresh}>
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '12px'
      }}>
        <MetricCard
          title={t.cpuTitle}
          subtitle={cpu.model}
          value={cpu.usage.toFixed(1)}
          unit="%"
          icon={<Cpu size={14} />}
          badge={`${cpu.cores}C / ${cpu.threads}T`}
          footer={
            <>
              <span>{t.temp}: <strong style={{ color: 'var(--text-primary)' }}>{formatTemp(cpu.temp)}</strong></span>
              <span>{t.clock}: <strong style={{ color: 'var(--text-primary)' }}>{cpu.frequency > 0 ? `${cpu.frequency} GHz` : 'N/A'}</strong></span>
            </>
          }
        >
          <div style={{ marginBottom: '8px' }}>
            <RealtimeChart data={history.cpu} color="#94a3b8" maxVal={100} height={52} />
          </div>

          {cpu.loadPerCore && cpu.loadPerCore.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(cpu.loadPerCore.length, 16)}, 1fr)`,
              gap: '3px',
              marginTop: '6px',
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)'
            }}>
              {cpu.loadPerCore.slice(0, 16).map((load, idx) => (
                <div key={idx} title={`Core #${idx}: ${load}%`} style={{
                  height: '18px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end'
                }}>
                  <div style={{
                    height: `${Math.min(100, Math.max(load, 5))}%`,
                    background: load > 85 ? 'var(--accent-rose)' : load > 65 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    borderRadius: '1px',
                    transition: 'height 180ms ease'
                  }} />
                </div>
              ))}
            </div>
          )}
        </MetricCard>

        <MetricCard
          title={t.gpuTitle}
          subtitle={gpu.name}
          value={gpu.utilization !== null ? gpu.utilization : 'N/A'}
          unit={gpu.utilization !== null ? '%' : ''}
          icon={<Tv size={14} />}
          badge={gpu.vendor || 'GPU'}
          footer={
            <>
              <span>{t.temp}: <strong style={{ color: 'var(--text-primary)' }}>{formatTemp(gpu.temp)}</strong></span>
              <span>
                {t.vram}: <strong style={{ color: 'var(--text-primary)' }}>
                  {gpu.vramUsed !== null ? `${gpu.vramUsed} MB` : gpu.vramTotal ? `${gpu.vramTotal} MB` : 'N/A'}
                </strong>
              </span>
            </>
          }
        >
          <div style={{ marginBottom: '8px' }}>
            <RealtimeChart data={history.gpu} color="#94a3b8" maxVal={100} height={52} />
          </div>
          <ProgressBar value={gpu.utilization || 0} showText height={4} />
        </MetricCard>

        <MetricCard
          title={t.ramTitle}
          subtitle={`${ramUsedGb} GB / ${ramTotalGb} GB`}
          value={memory.percentage}
          unit="%"
          icon={<Zap size={14} />}
          badge="DDR"
          footer={
            <>
              <span>{t.available}: <strong style={{ color: 'var(--text-primary)' }}>{ramFreeGb} GB</strong></span>
              <span>{t.total}: <strong style={{ color: 'var(--text-primary)' }}>{ramTotalGb} GB</strong></span>
            </>
          }
        >
          <div style={{ marginBottom: '8px' }}>
            <RealtimeChart data={history.ram} color="#94a3b8" maxVal={100} height={52} />
          </div>
          <ProgressBar value={memory.percentage} showText height={4} />
        </MetricCard>

        <MetricCard
          title={t.diskTitle}
          subtitle={`${disk.name} (${disk.fs})`}
          value={disk.percentage}
          unit="%"
          icon={<HardDrive size={14} />}
          badge="FIXED"
          footer={
            <>
              <span>{t.used}: <strong style={{ color: 'var(--text-primary)' }}>{diskUsedGb} GB</strong></span>
              <span>{t.available}: <strong style={{ color: 'var(--text-primary)' }}>{diskFreeGb} GB</strong></span>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <ProgressBar value={disk.percentage} showText height={4} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}>
              <span>{t.read}: <strong style={{ color: 'var(--text-primary)' }}>{formatSpeed(disk.readSpeed)}</strong></span>
              <span>{t.write}: <strong style={{ color: 'var(--text-primary)' }}>{formatSpeed(disk.writeSpeed)}</strong></span>
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title={t.netTitle}
          subtitle={`${network.iface} • ${network.ip4}`}
          value={formatSpeed(network.rxSec)}
          unit=""
          icon={<Activity size={14} />}
          badge={t.activeAdapter}
          footer={
            <>
              <span>↓ {t.down}: <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(network.rxTotal)}</strong></span>
              <span>↑ {t.up}: <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(network.txTotal)}</strong></span>
            </>
          }
        >
          <div style={{ marginBottom: '8px' }}>
            <RealtimeChart
              data={history.netDown}
              secondaryData={history.netUp}
              color="#94a3b8"
              secondaryColor="#64748b"
              height={52}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            <span>↓ {formatSpeed(network.rxSec)}</span>
            <span>↑ {formatSpeed(network.txSec)}</span>
          </div>
        </MetricCard>
      </div>
    </div>
  );
};
