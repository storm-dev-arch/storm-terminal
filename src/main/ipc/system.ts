import { ipcMain, screen } from 'electron';
import os from 'os';
import { execFile } from 'child_process';
import si from 'systeminformation';
import { SystemOverview, SystemHardwareInfo, DiskPartition, DisplayInfo } from '../../shared/types/system';

function sanitizeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || isNaN(Number(val))) return fallback;
  return Number(val);
}

function sanitizeString(val: any, fallback: string = 'N/A'): string {
  if (!val || typeof val !== 'string' || val.trim() === '') return fallback;
  return val.trim();
}

let cachedCpuInfo: any = null;
let cachedGpuInfo: any = null;
let cachedPrimaryDisk: any = null;
let cachedPrimaryIface: any = null;

let lastGpuLoad: number | null = null;
let lastGpuTemp: number | null = null;
let lastGpuVramUsed: number | null = null;
let lastGpuVramTotal: number | null = null;
let lastCpuTemp: number | null = null;
let lastDiskInfo: any = null;
let lastProcessesCount = 0;

let lastRxBytes = 0;
let lastTxBytes = 0;
let lastNetRxSec = 0;
let lastNetTxSec = 0;
let lastNetSampleTime = 0;

interface CpuSnapshot {
  idle: number;
  total: number;
}
function getCpuSnapshots(): CpuSnapshot[] {
  return os.cpus().map((c) => ({
    idle: c.times.idle,
    total: Object.values(c.times).reduce((a, b) => a + b, 0)
  }));
}

let prevCpuSnapshots: CpuSnapshot[] = getCpuSnapshots();
let lastCpuUsage = 0;
let lastLoadPerCore: number[] = [];
let baseCpuFreq = 3.4;
let lastCpuFreq = 3.4;

function sampleCpu(): void {
  try {
    const curr = getCpuSnapshots();
    let totalDiff = 0;
    let idleDiff = 0;
    const perCore: number[] = [];

    for (let i = 0; i < curr.length; i++) {
      const prev = prevCpuSnapshots[i] || curr[i];
      const cTotal = curr[i].total - prev.total;
      const cIdle = curr[i].idle - prev.idle;
      totalDiff += cTotal;
      idleDiff += cIdle;
      const pct = cTotal > 0 ? (1 - cIdle / cTotal) * 100 : 0;
      perCore.push(Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10);
    }

    prevCpuSnapshots = curr;
    lastCpuUsage = totalDiff > 0 ? Math.round(Math.min(100, Math.max(0, 1 - idleDiff / totalDiff)) * 1000) / 10 : 0;
    lastLoadPerCore = perCore;

    const cpus = os.cpus();
    if (cpus.length > 0 && cpus[0].speed) {
      baseCpuFreq = Math.round((cpus[0].speed / 1000) * 100) / 100;
      if (lastCpuFreq <= 0) lastCpuFreq = baseCpuFreq;
    }
  } catch {}
}

let lastOverview: SystemOverview | null = null;

export function getLatestTemperatures(): { cpuTemp: number | null; gpuTemp: number | null } {
  return {
    cpuTemp: lastCpuTemp,
    gpuTemp: lastGpuTemp
  };
}

async function initStaticHardwareCache() {
  try {
    const [cpu, graphics, fsSize, ifaces] = await Promise.all([
      si.cpu().catch(() => ({ brand: 'Processor', manufacturer: 'Unknown', cores: 1, physicalCores: 1 })),
      si.graphics().catch(() => ({ controllers: [] })),
      si.fsSize().catch(() => []),
      si.networkInterfaces().catch(() => [])
    ]);

    cachedCpuInfo = cpu;
    cachedGpuInfo = graphics.controllers?.[0] || null;

    const primaryDisk = fsSize.find((f: any) => f.mount.toUpperCase().startsWith('C:')) || fsSize[0] || {
      mount: 'C:',
      fs: 'NTFS',
      size: 512 * 1024 ** 3,
      used: 200 * 1024 ** 3,
      available: 312 * 1024 ** 3,
      use: 39
    };
    cachedPrimaryDisk = primaryDisk;
    lastDiskInfo = primaryDisk;

    const ifaceList = Array.isArray(ifaces) ? ifaces : [];
    const activeIface = ifaceList.find((i: any) => i.ip4 && i.ip4 !== '127.0.0.1' && !i.internal) || ifaceList[0] || {
      ifaceName: 'Ethernet',
      iface: 'Ethernet',
      ip4: '127.0.0.1'
    };
    cachedPrimaryIface = activeIface;
  } catch (err) {
    console.error('Error initializing static hardware cache:', err);
  }
}

function sampleNetwork(isMoving: () => boolean) {
  if (isMoving && isMoving()) return;

  execFile('netstat', ['-e'], { windowsHide: true }, (err, stdout) => {
    if (err || !stdout) return;
    try {
      const lines = stdout.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
          const rx = parseInt(parts[1], 10);
          const tx = parseInt(parts[2], 10);
          const now = Date.now();
          if (lastNetSampleTime > 0) {
            const deltaSec = (now - lastNetSampleTime) / 1000;
            if (deltaSec > 0.5 && rx >= lastRxBytes && tx >= lastTxBytes) {
              lastNetRxSec = Math.round((rx - lastRxBytes) / deltaSec);
              lastNetTxSec = Math.round((tx - lastTxBytes) / deltaSec);
            }
          }
          lastRxBytes = rx;
          lastTxBytes = tx;
          lastNetSampleTime = now;
          break;
        }
      }
    } catch {}
  });
}

function startSlowSensorsWorker(isMoving: () => boolean) {
  setInterval(() => {
    sampleNetwork(isMoving);
  }, 1500);

  setInterval(() => {
    if (isMoving && isMoving()) return;
    execFile('powershell', ['-NoProfile', '-Command', "(Get-CimInstance Win32_PerfFormattedData_Counters_ProcessorInformation | Where-Object Name -eq '_Total').PercentProcessorPerformance"], { windowsHide: true }, (err, stdout) => {
      if (!err && stdout) {
        const perfPct = parseInt(stdout.trim(), 10);
        if (!isNaN(perfPct) && perfPct > 10) {
          const liveFreq = Math.round((baseCpuFreq * (perfPct / 100)) * 100) / 100;
          if (liveFreq >= 1.0 && liveFreq <= 8.0) {
            lastCpuFreq = liveFreq;
          }
        }
      }
    });
  }, 2500);

  setInterval(() => {
    if (isMoving && isMoving()) return;
    execFile('nvidia-smi', ['--query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw', '--format=csv,noheader,nounits'], { windowsHide: true }, (err, stdout) => {
      if (!err && stdout) {
        const parts = stdout.trim().split(',').map((s: string) => s.trim());
        if (parts.length >= 4) {
          const t = parseInt(parts[0], 10);
          const u = parseInt(parts[1], 10);
          const mUsed = parseInt(parts[2], 10);
          const mTotal = parseInt(parts[3], 10);
          if (!isNaN(t) && t > 0) lastGpuTemp = t;
          if (!isNaN(u)) lastGpuLoad = u;
          if (!isNaN(mUsed)) lastGpuVramUsed = mUsed;
          if (!isNaN(mTotal)) lastGpuVramTotal = mTotal;
        }
      }
    });
  }, 2500);

  setInterval(async () => {
    if (isMoving && isMoving()) return;

    try {
      const [cpuTemp, graphics, fsSize, processes] = await Promise.all([
        si.cpuTemperature().catch(() => ({ main: null })),
        si.graphics().catch(() => ({ controllers: [] })),
        si.fsSize().catch(() => []),
        si.processes().catch(() => ({ all: 0 }))
      ]);

      if (cpuTemp.main && !isNaN(cpuTemp.main)) {
        if (cpuTemp.main > 20) {
          lastCpuTemp = Math.round(cpuTemp.main);
        } else {
          lastCpuTemp = null;
        }
      } else {
        lastCpuTemp = null;
      }

      const gpu = graphics.controllers?.[0];
      if (gpu) {
        if (lastGpuLoad === null && gpu.utilizationGpu !== undefined) lastGpuLoad = Math.round(gpu.utilizationGpu);
        if (lastGpuTemp === null && gpu.temperatureGpu !== undefined) lastGpuTemp = Math.round(gpu.temperatureGpu);
        if (lastGpuVramUsed === null && gpu.memoryUsed !== undefined) lastGpuVramUsed = gpu.memoryUsed;
        if (lastGpuVramTotal === null && gpu.memoryTotal !== undefined) lastGpuVramTotal = gpu.memoryTotal;
      }

      const primary = fsSize.find((f: any) => f.mount.toUpperCase().startsWith('C:')) || fsSize[0];
      if (primary) {
        lastDiskInfo = primary;
      }

      if (processes && processes.all > 0) {
        lastProcessesCount = processes.all;
      }
    } catch {}
  }, 4500);
}

export function registerSystemHandlers(isWindowMoving?: () => boolean): void {
  const isMoving = isWindowMoving || (() => false);

  initStaticHardwareCache();
  startSlowSensorsWorker(isMoving);

  ipcMain.handle('system:getDisplays', (): DisplayInfo[] => {
    try {
      const displays = screen.getAllDisplays();
      const primary = screen.getPrimaryDisplay();
      return displays.map((d) => ({
        id: d.id,
        isPrimary: d.id === primary.id,
        width: d.size.width,
        height: d.size.height,
        scaleFactor: d.scaleFactor,
        refreshRate: (d as any).displayFrequency || 60,
        colorDepth: d.colorDepth || 24
      }));
    } catch {
      return [];
    }
  });

  ipcMain.handle('system:getOverview', async (): Promise<SystemOverview> => {
    if (isMoving() && lastOverview) {
      return lastOverview;
    }

    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memPct = Math.min(100, Math.max(0, Math.round((usedMem / totalMem) * 1000) / 10));

      sampleCpu();

      const disk = lastDiskInfo || cachedPrimaryDisk || {
        mount: 'C:',
        fs: 'NTFS',
        size: 0,
        used: 0,
        available: 0,
        use: 0
      };

      const result: SystemOverview = {
        cpu: {
          model: cachedCpuInfo ? sanitizeString(cachedCpuInfo.brand, 'Processor') : 'Processor',
          manufacturer: cachedCpuInfo ? sanitizeString(cachedCpuInfo.manufacturer, 'Unknown') : 'Unknown',
          usage: lastCpuUsage,
          temp: lastCpuTemp,
          frequency: lastCpuFreq,
          cores: cachedCpuInfo ? sanitizeNumber(cachedCpuInfo.physicalCores, 1) : 1,
          threads: cachedCpuInfo ? sanitizeNumber(cachedCpuInfo.cores, 1) : 1,
          loadPerCore: lastLoadPerCore
        },
        gpu: {
          name: cachedGpuInfo ? sanitizeString(cachedGpuInfo.model, 'Graphics Adapter') : 'Display Adapter',
          vendor: cachedGpuInfo ? sanitizeString(cachedGpuInfo.vendor, 'Unknown') : 'Unknown',
          utilization: lastGpuLoad,
          temp: lastGpuTemp,
          vramUsed: lastGpuVramUsed,
          vramTotal: lastGpuVramTotal,
          fanSpeed: null,
          powerDraw: null
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          percentage: memPct
        },
        disk: {
          name: disk.mount || 'C:',
          fs: sanitizeString(disk.fs, 'NTFS'),
          total: sanitizeNumber(disk.size, 0),
          used: sanitizeNumber(disk.used, 0),
          free: sanitizeNumber(disk.available, 0),
          percentage: Math.round(sanitizeNumber(disk.use, 0) * 10) / 10,
          readSpeed: 0,
          writeSpeed: 0
        },
        network: {
          iface: cachedPrimaryIface ? sanitizeString(cachedPrimaryIface.ifaceName || cachedPrimaryIface.iface, 'Ethernet') : 'Ethernet',
          ip4: cachedPrimaryIface ? sanitizeString(cachedPrimaryIface.ip4, '127.0.0.1') : '127.0.0.1',
          rxSec: lastNetRxSec,
          txSec: lastNetTxSec,
          rxTotal: lastRxBytes,
          txTotal: lastTxBytes
        },
        uptime: Math.floor(os.uptime()),
        processCount: lastProcessesCount || 180
      };

      lastOverview = result;
      return result;
    } catch (err) {
      console.error('Failed to query fast telemetry:', err);
      if (lastOverview) return lastOverview;
      return {
        cpu: { model: 'Processor', manufacturer: 'Unknown', usage: 0, temp: null, frequency: 0, cores: 1, threads: 1, loadPerCore: [] },
        gpu: { name: 'GPU', vendor: 'Unknown', utilization: null, temp: null, vramUsed: null, vramTotal: null, fanSpeed: null, powerDraw: null },
        memory: { total: 1024 * 1024 * 1024, used: 0, free: 0, percentage: 0 },
        disk: { name: 'C:', fs: 'NTFS', total: 0, used: 0, free: 0, percentage: 0, readSpeed: 0, writeSpeed: 0 },
        network: { iface: 'Ethernet', ip4: '127.0.0.1', rxSec: 0, txSec: 0, rxTotal: 0, txTotal: 0 },
        uptime: Math.floor(os.uptime()),
        processCount: 0
      };
    }
  });

  ipcMain.handle('system:getHardwareSpecs', async (): Promise<SystemHardwareInfo> => {
    try {
      const [osInfo, cpuInfo, graphicsInfo, memLayout, memInfo, baseboard, bios, fsSize] = await Promise.all([
        si.osInfo().catch(() => ({ platform: 'win32', distro: 'Windows', release: '11', arch: 'x64', hostname: 'PC' })),
        si.cpu().catch(() => ({ manufacturer: 'Unknown', brand: 'Unknown CPU', speed: 0, speedMax: 0, cores: 1, physicalCores: 1, socket: 'Unknown', cache: {} })),
        si.graphics().catch(() => ({ controllers: [] })),
        si.memLayout().catch(() => []),
        si.mem().catch(() => ({ total: os.totalmem() })),
        si.baseboard().catch(() => ({ manufacturer: 'Unknown', model: 'Unknown', version: '1.0' })),
        si.bios().catch(() => ({ vendor: 'Unknown', version: 'Unknown', releaseDate: 'Unknown' })),
        si.fsSize().catch(() => [])
      ]);

      const controllers = (graphicsInfo.controllers || []).map((c: any) => ({
        vendor: sanitizeString(c.vendor, 'Unknown'),
        model: sanitizeString(c.model, 'Display Adapter'),
        bus: sanitizeString(c.bus, 'PCIe'),
        vram: sanitizeNumber(c.vram, 0),
        driverVersion: sanitizeString(c.driverVersion, 'N/A'),
        subDeviceId: sanitizeString(c.subDeviceId, 'N/A')
      }));

      const layout = (memLayout || []).map((m: any, idx: number) => ({
        bank: sanitizeString(m.bank, `Slot ${idx + 1}`),
        type: sanitizeString(m.type, 'DDR4'),
        size: sanitizeNumber(m.size, 0),
        clockSpeed: sanitizeNumber(m.clockSpeed, 0),
        manufacturer: sanitizeString(m.manufacturer, 'Generic'),
        partNum: sanitizeString(m.partNum, 'N/A')
      }));

      const disks: DiskPartition[] = (fsSize || []).map((d: any) => ({
        fs: sanitizeString(d.fs, 'NTFS'),
        type: sanitizeString(d.type, 'Fixed'),
        size: sanitizeNumber(d.size, 0),
        used: sanitizeNumber(d.used, 0),
        available: sanitizeNumber(d.available, 0),
        use: sanitizeNumber(d.use, 0),
        mount: sanitizeString(d.mount, 'C:')
      }));

      return {
        os: {
          platform: sanitizeString(osInfo.platform, 'win32'),
          distro: sanitizeString(osInfo.distro, 'Windows'),
          release: sanitizeString(osInfo.release, '11'),
          arch: sanitizeString(osInfo.arch, 'x64'),
          hostname: sanitizeString(osInfo.hostname, 'STORM-PC'),
          uptime: Math.floor(os.uptime()),
          username: os.userInfo?.()?.username || 'User'
        },
        cpu: {
          manufacturer: sanitizeString(cpuInfo.manufacturer, 'Unknown'),
          brand: sanitizeString(cpuInfo.brand, 'Processor'),
          speed: sanitizeNumber(cpuInfo.speed, 0),
          speedMax: sanitizeNumber(cpuInfo.speedMax, 0),
          cores: sanitizeNumber(cpuInfo.cores, 1),
          physicalCores: sanitizeNumber(cpuInfo.physicalCores, 1),
          threads: sanitizeNumber(cpuInfo.cores, 1),
          socket: sanitizeString(cpuInfo.socket, 'Socket'),
          cache: {
            l1d: sanitizeNumber((cpuInfo.cache as any)?.l1d, 0),
            l1i: sanitizeNumber((cpuInfo.cache as any)?.l1i, 0),
            l2: sanitizeNumber((cpuInfo.cache as any)?.l2, 0),
            l3: sanitizeNumber((cpuInfo.cache as any)?.l3, 0)
          }
        },
        gpu: {
          controllers
        },
        memory: {
          total: sanitizeNumber(memInfo.total, os.totalmem()),
          layout
        },
        motherboard: {
          manufacturer: sanitizeString(baseboard.manufacturer, 'Unknown'),
          model: sanitizeString(baseboard.model, 'Mainboard'),
          version: sanitizeString(baseboard.version, '1.0'),
          biosVendor: sanitizeString(bios.vendor, 'Unknown'),
          biosVersion: sanitizeString(bios.version, '1.0'),
          biosReleaseDate: sanitizeString(bios.releaseDate, 'Unknown')
        },
        disks
      };
    } catch (err) {
      console.error('Failed to get hardware specs:', err);
      throw err;
    }
  });

  ipcMain.handle('system:getStorageDetails', async (): Promise<DiskPartition[]> => {
    try {
      const fsSize = await si.fsSize().catch(() => []);
      if (Array.isArray(fsSize) && fsSize.length > 0) {
        return fsSize.map((d: any) => ({
          fs: sanitizeString(d.fs, 'NTFS'),
          type: sanitizeString(d.type, 'Fixed'),
          size: sanitizeNumber(d.size, 0),
          used: sanitizeNumber(d.used, 0),
          available: sanitizeNumber(d.available, 0),
          use: Math.round(sanitizeNumber(d.use, 0) * 10) / 10,
          mount: sanitizeString(d.mount || d.fs, 'C:')
        }));
      }

      if (cachedPrimaryDisk) {
        return [{
          fs: sanitizeString(cachedPrimaryDisk.fs, 'NTFS'),
          type: 'Fixed',
          size: sanitizeNumber(cachedPrimaryDisk.size, 0),
          used: sanitizeNumber(cachedPrimaryDisk.used, 0),
          available: sanitizeNumber(cachedPrimaryDisk.available, 0),
          use: Math.round(sanitizeNumber(cachedPrimaryDisk.use, 0) * 10) / 10,
          mount: sanitizeString(cachedPrimaryDisk.mount, 'C:')
        }];
      }

      return [];
    } catch (err) {
      console.error('Failed to query storage details:', err);
      return [];
    }
  });
}
