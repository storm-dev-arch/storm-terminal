import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { DiskPartition } from '../../shared/types/system';
import { Language, translations } from '../i18n/translations';
import { ProgressBar } from '../components/ProgressBar';

interface StoragePageProps {
  lang: Language;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 GB';
  const gb = bytes / (1024 ** 3);
  if (gb < 1000) {
    return gb.toFixed(1) + ' GB';
  }
  return (gb / 1024).toFixed(2) + ' TB';
}

export const StoragePage: React.FC<StoragePageProps> = ({ lang }) => {
  const [disks, setDisks] = useState<DiskPartition[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  const fetchDisks = async () => {
    try {
      const data = await window.stormAPI?.getStorageDetails();
      setDisks(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to get storage:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisks();
  }, []);

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t.storageVolumes}
          </h1>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)'
          }}>
            {lang === 'ru'
              ? (disks.length === 1 ? '1 раздел' : (disks.length >= 2 && disks.length <= 4 ? `${disks.length} раздела` : `${disks.length} разделов`))
              : `${disks.length} ${disks.length === 1 ? 'partition' : 'partitions'}`}
          </span>
        </div>

        <button className="btn-action" onClick={fetchDisks}>
          <RefreshCw size={12} />
          <span>{t.scanDrives}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          {lang === 'ru' ? 'Сканирование накопителей...' : 'Reading filesystem partitions...'}
        </div>
      ) : disks.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          {lang === 'ru' ? 'Диски не обнаружены.' : 'No disk partitions reported by Windows.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '12px'
        }}>
          {disks.map((disk, idx) => {
            const usedStr = formatBytes(disk.used);
            const totalStr = formatBytes(disk.size);
            const freeStr = formatBytes(disk.available);
            const percent = disk.use || (disk.size > 0 ? Math.round((disk.used / disk.size) * 100) : 0);

            return (
              <div
                key={idx}
                className="surface-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      <HardDrive size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        {disk.mount || `Disk #${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {disk.fs} • {disk.type || 'Fixed'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {percent}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {freeStr} {lang === 'ru' ? 'свободно' : 'free'}
                    </div>
                  </div>
                </div>

                <ProgressBar value={percent} height={5} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>{t.used}: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{usedStr}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>{t.total}: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{totalStr}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
