export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  mem: number; // percentage
  memRss: number; // in bytes or KB
  memVsz: number;
  user: string;
  state: string;
  isCritical?: boolean;
}

export interface KillProcessResult {
  success: boolean;
  error?: string;
}
