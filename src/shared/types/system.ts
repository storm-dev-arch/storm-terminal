export interface CpuLoadPerCore {
  core: number;
  load: number;
}

export interface SystemOverview {
  cpu: {
    model: string;
    manufacturer: string;
    usage: number;
    temp: number | null;
    frequency: number;
    cores: number;
    threads: number;
    loadPerCore: number[];
  };
  gpu: {
    name: string;
    vendor: string;
    utilization: number | null;
    temp: number | null;
    vramUsed: number | null;
    vramTotal: number | null;
    fanSpeed: number | null;
    powerDraw: number | null;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    name: string;
    fs: string;
    total: number;
    used: number;
    free: number;
    percentage: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    iface: string;
    ip4: string;
    rxSec: number;
    txSec: number;
    rxTotal: number;
    txTotal: number;
  };
  uptime: number; // in seconds
  processCount: number;
}

export interface RamStick {
  bank: string;
  type: string;
  size: number;
  clockSpeed: number;
  manufacturer: string;
  partNum: string;
}

export interface GpuDetails {
  vendor: string;
  model: string;
  bus: string;
  vram: number;
  driverVersion: string;
  subDeviceId: string;
}

export interface DiskPartition {
  fs: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
  readSec?: number;
  writeSec?: number;
}

export interface SystemHardwareInfo {
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
    uptime: number;
    username: string;
  };
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    speedMax: number;
    cores: number;
    physicalCores: number;
    threads: number;
    socket: string;
    cache: {
      l1d: number;
      l1i: number;
      l2: number;
      l3: number;
    };
  };
  gpu: {
    controllers: GpuDetails[];
  };
  memory: {
    total: number;
    layout: RamStick[];
  };
  motherboard: {
    manufacturer: string;
    model: string;
    version: string;
    biosVendor: string;
    biosVersion: string;
    biosReleaseDate: string;
  };
  disks: DiskPartition[];
}

export interface DisplayInfo {
  id: number;
  isPrimary: boolean;
  width: number;
  height: number;
  scaleFactor: number;
  refreshRate: number;
  colorDepth: number;
}

export interface PowerSchemeInfo {
  activeGuid: string;
  activeName: string;
  schemes: Array<{ guid: string; name: string; isActive: boolean }>;
}

export interface StartupAppInfo {
  name: string;
  command: string;
  location: string;
  enabled: boolean;
}

export interface DiskBenchmarkResult {
  seqWriteMBs: number;
  seqReadMBs: number;
  randWriteIOPS: number;
  randReadIOPS: number;
  testSizeMB: number;
  timeMs: number;
}

export interface SystemHealthStatus {
  windowsIntegrity: { status: 'healthy' | 'warning' | 'unknown'; message: string };
  diskSpace: { status: 'healthy' | 'warning' | 'critical'; freeGB: number; percentFree: number };
  network: { status: 'online' | 'offline' | 'degraded'; gateway: string; pingMs: number | null };
  services: Array<{ name: string; displayName: string; status: 'running' | 'stopped' | 'unknown' }>;
}
