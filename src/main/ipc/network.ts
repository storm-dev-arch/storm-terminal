import { ipcMain } from 'electron';
import si from 'systeminformation';
import { exec } from 'child_process';
import { NetworkDetails, PingResult } from '../../shared/types/network';

export function registerNetworkHandlers(): void {
  ipcMain.handle('network:getDetails', async (): Promise<NetworkDetails> => {
    try {
      const [ifaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats()
      ]);

      const ifaceList = Array.isArray(ifaces) ? ifaces : [];
      // Find non-internal IPv4 interface
      const primary = ifaceList.find(i => i.ip4 && i.ip4 !== '127.0.0.1' && !i.internal) || ifaceList[0] || {
        iface: 'Ethernet',
        ip4: '127.0.0.1',
        ip6: '::1',
        mac: '00:00:00:00:00:00',
        type: 'wired',
        speed: 1000,
        dhcp: true
      };

      const statList = Array.isArray(stats) ? stats : [];
      const currentStat = statList.find(s => s.iface === primary.iface) || statList[0] || {
        rx_sec: 0,
        tx_sec: 0,
        rx_bytes: 0,
        tx_bytes: 0
      };

      return {
        iface: primary.ifaceName || primary.iface || 'Ethernet',
        ip4: primary.ip4 || 'Unavailable',
        ip6: primary.ip6 || 'Unavailable',
        mac: primary.mac || 'Unavailable',
        type: primary.type || 'wired',
        speed: primary.speed || 1000,
        dhcp: !!primary.dhcp,
        rxSec: currentStat.rx_sec || 0,
        txSec: currentStat.tx_sec || 0,
        rxTotal: currentStat.rx_bytes || 0,
        txTotal: currentStat.tx_bytes || 0
      };
    } catch (err) {
      console.error('Failed to get network details:', err);
      return {
        iface: 'Ethernet',
        ip4: 'Unavailable',
        ip6: 'Unavailable',
        mac: 'Unavailable',
        type: 'wired',
        speed: 0,
        dhcp: false,
        rxSec: 0,
        txSec: 0,
        rxTotal: 0,
        txTotal: 0
      };
    }
  });

  ipcMain.handle('network:ping', async (_event, host: string): Promise<PingResult> => {
    const cleanHost = host.trim().replace(/[^a-zA-Z0-9.-]/g, '');
    if (!cleanHost) {
      return { host, alive: false, time: null, error: 'Invalid hostname' };
    }

    return new Promise<PingResult>((resolve) => {
      // Windows ping command with 1 packet and 2000ms timeout
      exec(`ping -n 1 -w 2000 ${cleanHost}`, (error, stdout) => {
        if (error || !stdout) {
          resolve({ host: cleanHost, alive: false, time: null, error: 'Host unreachable' });
          return;
        }

        // Match English "time=XXms" or "<1ms" or Russian "время=XXмс" or "время<1мс"
        const timeMatch = stdout.match(/(?:time|время)[=<](\d+)m?s?/i);
        if (timeMatch && timeMatch[1]) {
          const latency = parseInt(timeMatch[1], 10);
          resolve({
            host: cleanHost,
            alive: true,
            time: isNaN(latency) ? 1 : Math.max(1, latency)
          });
        } else if (stdout.toLowerCase().includes('ttl=')) {
          resolve({
            host: cleanHost,
            alive: true,
            time: 1
          });
        } else {
          resolve({
            host: cleanHost,
            alive: false,
            time: null,
            error: 'Request timed out'
          });
        }
      });
    });
  });
}
