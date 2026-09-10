import React, { useState, useEffect } from 'react';
import {
  Activity,
  Globe,
  Radio,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Send,
  Clock
} from 'lucide-react';
import { NetworkDetails, PingResult } from '../../shared/types/network';
import { Language, translations } from '../i18n/translations';
import { RealtimeChart } from '../components/RealtimeChart';

interface NetworkPageProps {
  networkHistory: {
    down: number[];
    up: number[];
  };
  lang: Language;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
  const k = 1024;
  if (bytesPerSec < k * k) {
    return (bytesPerSec / k).toFixed(1) + ' KB/s';
  }
  return (bytesPerSec / (k * k)).toFixed(1) + ' MB/s';
}

export const NetworkPage: React.FC<NetworkPageProps> = ({ networkHistory, lang }) => {
  const [details, setDetails] = useState<NetworkDetails | null>(null);
  const [pingTargets, setPingTargets] = useState<string[]>(['google.com', 'github.com', 'cloudflare.com']);
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});
  const [pinging, setPinging] = useState<Record<string, boolean>>({});
  const [customHost, setCustomHost] = useState('');
  const t = translations[lang];

  const fetchDetails = async () => {
    try {
      const data = await window.stormAPI?.getNetworkDetails();
      setDetails(data);
    } catch (err) {
      console.error('Failed to get network details:', err);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 2000);
    return () => clearInterval(interval);
  }, []);

  const runPing = async (host: string) => {
    setPinging((prev) => ({ ...prev, [host]: true }));
    try {
      const res = await window.stormAPI?.pingHost(host);
      setPingResults((prev) => ({ ...prev, [host]: res }));
    } catch {
      setPingResults((prev) => ({
        ...prev,
        [host]: { host, alive: false, time: null, error: 'Ping failed' }
      }));
    } finally {
      setPinging((prev) => ({ ...prev, [host]: false }));
    }
  };

  useEffect(() => {
    pingTargets.forEach((t) => runPing(t));
  }, []);

  const handleAddCustomHost = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customHost.trim();
    if (!clean) return;
    if (!pingTargets.includes(clean)) {
      setPingTargets((prev) => [...prev, clean]);
    }
    runPing(clean);
    setCustomHost('');
  };

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Interface & Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '12px'
      }}>
        {/* Adapter Details */}
        <div className="surface-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Globe size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t.adapterSection}
              </span>
            </div>
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontWeight: 500
            }}>
              ONLINE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.adapterIface}:</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{details?.iface || 'Ethernet'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.adapterIp4}:</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{details?.ip4 || '127.0.0.1'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.adapterIp6}:</span>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{details?.ip6 || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.adapterMac}:</span>
              <span className="font-mono">{details?.mac || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.adapterSpeed}:</span>
              <span className="font-mono">{details?.speed ? `${details.speed} Mbps` : '1000 Mbps'}</span>
            </div>
          </div>
        </div>

        {/* Realtime Transfer Statistics */}
        <div className="surface-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Activity size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t.trafficSection}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <ArrowDown size={13} />
                  <span>{t.down}</span>
                </div>
                <div className="font-mono" style={{ fontSize: '17px', fontWeight: 600, marginTop: '3px', color: 'var(--text-primary)' }}>
                  {formatSpeed(details?.rxSec || 0)}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {t.total}: {formatBytes(details?.rxTotal || 0)}
                </div>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <ArrowUp size={13} />
                  <span>{t.up}</span>
                </div>
                <div className="font-mono" style={{ fontSize: '17px', fontWeight: 600, marginTop: '3px', color: 'var(--text-primary)' }}>
                  {formatSpeed(details?.txSec || 0)}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {t.total}: {formatBytes(details?.txTotal || 0)}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>DUAL-CHANNEL</span>
            <span style={{ color: 'var(--accent-emerald)' }}>STABLE</span>
          </div>
        </div>
      </div>

      {/* Network Traffic Chart */}
      <div className="surface-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Radio size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.trafficChart}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>↓ {t.down}</span>
            <span>↑ {t.up}</span>
          </div>
        </div>

        <RealtimeChart
          data={networkHistory.down}
          secondaryData={networkHistory.up}
          color="#94a3b8"
          secondaryColor="#64748b"
          height={70}
        />
      </div>

      {/* Ping Diagnostics Utility */}
      <div className="surface-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Clock size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t.pingSection}
            </span>
          </div>

          {/* Add custom ping target */}
          <form onSubmit={handleAddCustomHost} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="input-clean"
              placeholder={t.pingInputPlaceholder}
              value={customHost}
              onChange={(e) => setCustomHost(e.target.value)}
              style={{ width: '210px', height: '28px', fontSize: '11.5px' }}
            />
            <button type="submit" className="btn-action btn-primary" style={{ height: '28px', padding: '0 10px' }}>
              <Send size={11} />
              <span>{t.pingBtn}</span>
            </button>
          </form>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '10px'
        }}>
          {pingTargets.map((host) => {
            const res = pingResults[host];
            const isPending = pinging[host];
            const isAlive = res?.alive;
            const latency = res?.time;

            return (
              <div
                key={host}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {host}
                  </span>
                  <button
                    onClick={() => runPing(host)}
                    disabled={isPending}
                    style={{ color: 'var(--text-muted)', padding: '2px' }}
                    title="Ping"
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  {isPending ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {t.pinging}...
                    </span>
                  ) : isAlive ? (
                    <>
                      <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: latency && latency < 60 ? 'var(--accent-emerald)' : latency && latency < 120 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                      }}>
                        {latency}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ms
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--accent-rose)' }}>
                      {res?.error || t.unreachable}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  <span className={`status-dot ${isAlive ? 'status-dot-green' : 'status-dot-red'}`} style={{ width: '5px', height: '5px' }} />
                  <span>{isAlive ? t.online : t.unreachable}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
