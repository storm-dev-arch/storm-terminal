import { ipcMain } from 'electron';
import si from 'systeminformation';
import { exec } from 'child_process';
import { ProcessInfo, KillProcessResult } from '../../shared/types/process';

const CRITICAL_PROCESSES = new Set([
  'system',
  'system idle process',
  'csrss.exe',
  'smss.exe',
  'wininit.exe',
  'services.exe',
  'lsass.exe',
  'svchost.exe',
  'dwm.exe',
  'winlogon.exe',
  'explorer.exe',
  'fontdrvhost.exe',
  'sihost.exe',
  'taskhostw.exe'
]);

export function registerProcessesHandlers(): void {
  ipcMain.handle('processes:get', async (): Promise<ProcessInfo[]> => {
    try {
      const data = await si.processes();
      const list = data.list || [];

      return list.map(p => {
        const nameLower = (p.name || '').toLowerCase();
        const isCritical = CRITICAL_PROCESSES.has(nameLower) || CRITICAL_PROCESSES.has(nameLower + '.exe');

        return {
          pid: p.pid,
          name: p.name || 'Unknown',
          cpu: Math.round((p.cpu || 0) * 10) / 10,
          mem: Math.round((p.mem || 0) * 10) / 10,
          memRss: (p.memRss || 0) * 1024,
          memVsz: (p.memVsz || 0) * 1024,
          user: p.user || 'SYSTEM',
          state: p.state || 'running',
          isCritical
        };
      });
    } catch (err) {
      console.error('Failed to get processes:', err);
      return [];
    }
  });

  ipcMain.handle('processes:kill', async (_event, pid: number, force?: boolean): Promise<KillProcessResult> => {
    if (!pid || pid <= 4) {
      return { success: false, error: 'Cannot terminate system core process (PID <= 4)' };
    }

    try {
      const data = await si.processes();
      const target = (data.list || []).find(p => p.pid === pid);
      if (target) {
        const nameLower = (target.name || '').toLowerCase();
        if (CRITICAL_PROCESSES.has(nameLower) && !force) {
          return { success: false, error: `Refusing to terminate critical system process: ${target.name}` };
        }
      }

      return await new Promise<KillProcessResult>((resolve) => {
        exec(`taskkill /F /PID ${pid}`, (error, _stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: stderr.trim() || error.message });
          } else {
            resolve({ success: true });
          }
        });
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to kill process' };
    }
  });
}
