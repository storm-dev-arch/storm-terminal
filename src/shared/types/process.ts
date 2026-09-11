export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
  memRss: number;
  memVsz: number;
  user: string;
  state: string;
  isCritical?: boolean;
}

export interface KillProcessResult {
  success: boolean;
  error?: string;
}
