import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Monitor,
  Layers,
  Copy,
  FileText,
  Check,
  Server
} from 'lucide-react';
import { SystemHardwareInfo } from '../../shared/types/system';
import { Language, translations } from '../i18n/translations';

interface SystemPageProps {
  lang: Language;
  onCopyInfo: () => void;
  onExportReport: (format: 'json' | 'txt') => void;
}

function formatUptime(seconds: number, lang: Language): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const dayStr = lang === 'ru' ? 'д' : 'd';
  const hrStr = lang === 'ru' ? 'ч' : 'h';
  const minStr = lang === 'ru' ? 'м' : 'm';
  if (d > 0) return `${d}${dayStr} ${h}${hrStr} ${m}${minStr}`;
  return `${h}${hrStr} ${m}${minStr}`;
}

const cleanVendor = (v?: string): string => {
  if (!v) return '';
  return v
    .replace(/\s*(Technology|Co\.,?\s*Ltd\.?|Inc\.?|Corporation|Corp\.?|International,\s*LLC\.?)/gi, '')
    .trim();
};

const SpecRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}> = ({ label, value, mono = true }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '12px',
    minHeight: '18px'
  }}>
    <span style={{
      color: 'var(--text-muted)',
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }}>
      {label}:
    </span>
    <span
      className={mono ? 'font-mono' : ''}
      style={{
        color: 'var(--text-primary)',
        textAlign: 'right',
        wordBreak: 'break-word',
        lineHeight: 1.35
      }}
    >
      {value || '—'}
    </span>
  </div>
);

export const SystemPage: React.FC<SystemPageProps> = ({ lang, onCopyInfo, onExportReport }) => {
  const [specs, setSpecs] = useState<SystemHardwareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    window.stormAPI?.getHardwareSpecs()
      .then((data) => {
        setSpecs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load specs:', err);
        setLoading(false);
      });
  }, []);

  const handleCopy = () => {
    onCopyInfo();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
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
        {lang === 'ru' ? 'Считывание аппаратных датчиков Windows...' : 'Querying hardware sensors...'}
      </div>
    );
  }

  if (!specs) {
    return (
      <div style={{ padding: '20px', color: 'var(--accent-rose)' }}>
        {lang === 'ru' ? 'Данные о спецификациях оборудования недоступны.' : 'Hardware specification data unavailable.'}
      </div>
    );
  }

  const { os, cpu, gpu, memory, motherboard } = specs;

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Action Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '2px'
      }}>
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t.specsTitle}
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {t.specsSub}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn-action" onClick={handleCopy}>
            {copied ? <Check size={13} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={13} />}
            <span>{copied ? (lang === 'ru' ? 'Скопировано' : 'Copied') : t.copyReport}</span>
          </button>
          <button className="btn-action" onClick={() => onExportReport('json')}>
            <FileText size={13} />
            <span>JSON</span>
          </button>
          <button className="btn-action" onClick={() => onExportReport('txt')}>
            <FileText size={13} />
            <span>TXT</span>
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '12px'
      }}>
        {/* Operating System */}
        <div className="surface-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
            <Monitor size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.osSection}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SpecRow label={t.osEdition} value={os.distro} />
            <SpecRow label={t.osRelease} value={os.release} />
            <SpecRow label={t.osArch} value={os.arch} />
            <SpecRow label={t.osHost} value={os.hostname} />
            <SpecRow label={t.osUser} value={os.username} />
            <SpecRow label={t.uptime} value={formatUptime(os.uptime, lang)} />
          </div>
        </div>

        {/* Processor */}
        <div className="surface-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
            <Cpu size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.cpuSection}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SpecRow label={t.cpuModel} value={cpu.brand} />
            <SpecRow label={t.cpuVendor} value={cpu.manufacturer} />
            <SpecRow label={t.cpuCores} value={cpu.physicalCores} />
            <SpecRow label={t.cpuThreads} value={cpu.threads} />
            <SpecRow label={t.cpuBaseClock} value={cpu.speed ? `${cpu.speed} GHz` : 'N/A'} />
            <SpecRow label={t.cpuL3Cache} value={cpu.cache.l3 ? `${cpu.cache.l3 / 1024} KB` : 'WMI'} />
          </div>
        </div>

        {/* Graphics Cards */}
        <div className="surface-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
            <Server size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.gpuSection}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gpu.controllers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t.noGpu}</div>
            ) : (
              gpu.controllers.map((ctrl, idx) => (
                <div key={idx} style={{
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ctrl.model}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '11px' }}>
                    <span>{ctrl.vendor}</span>
                    <span className="font-mono">{ctrl.vram > 0 ? `${ctrl.vram} MB` : 'Dynamic'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10.5px' }}>
                    <span>Bus: {ctrl.bus}</span>
                    <span>Driver: {ctrl.driverVersion}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motherboard & BIOS */}
        <div className="surface-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
            <Layers size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.moboSection}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SpecRow
              label={t.moboModel}
              value={
                motherboard.model.toLowerCase().includes(cleanVendor(motherboard.manufacturer).toLowerCase())
                  ? motherboard.model
                  : `${cleanVendor(motherboard.manufacturer)} ${motherboard.model}`
              }
            />
            <SpecRow label={t.moboRev} value={motherboard.version || 'x.x'} />
            <SpecRow label={t.biosVendor} value={cleanVendor(motherboard.biosVendor) || motherboard.biosVendor} />
            <SpecRow label={t.biosVer} value={motherboard.biosVersion} />
            <SpecRow label={t.biosDate} value={motherboard.biosReleaseDate} />
          </div>
        </div>
      </div>

      {/* RAM Modules Breakdown */}
      <div className="surface-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
          <Layers size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t.ramSection} ({memory.layout.length} {t.installedModules})
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {memory.layout.map((stick, idx) => (
            <div key={idx} style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}>
                  {stick.bank || `Slot ${idx + 1}`}
                </span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-muted)'
                }}>
                  {stick.type}
                </span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {(stick.size / 1024 ** 3).toFixed(0)} GB
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{stick.manufacturer}</span>
                <span className="font-mono">{stick.clockSpeed} MHz</span>
              </div>

              {stick.partNum && stick.partNum !== 'N/A' && (
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Part: {stick.partNum}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
