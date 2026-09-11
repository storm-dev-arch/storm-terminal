import { BrowserWindow, Notification } from 'electron';

export class BackgroundMonitor {
  private timer: NodeJS.Timeout | null = null;
  private lastAlertTime = 0;
  private alertCooldown = 60000;

  constructor(
    private getWindow: () => BrowserWindow | null,
    private getTemperatures?: () => { cpuTemp: number | null; gpuTemp: number | null }
  ) {}

  public start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.check(), 8000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private check(): void {
    try {
      const now = Date.now();
      if (now - this.lastAlertTime < this.alertCooldown) return;

      if (!this.getTemperatures) return;
      const { cpuTemp, gpuTemp } = this.getTemperatures();

      if (cpuTemp && cpuTemp >= 85) {
        this.emitAlert('CPU TEMPERATURE HIGH', `Processor temperature has reached ${Math.round(cpuTemp)}°C`);
        this.lastAlertTime = now;
      } else if (gpuTemp && gpuTemp >= 85) {
        this.emitAlert('GPU TEMPERATURE HIGH', `Graphics card temperature has reached ${Math.round(gpuTemp)}°C`);
        this.lastAlertTime = now;
      }
    } catch {
    }
  }

  private emitAlert(title: string, message: string): void {
    const win = this.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('system:notification', {
        title,
        message,
        type: 'warning'
      });
    }

    if (Notification.isSupported()) {
      new Notification({
        title: `STORM TERMINAL: ${title}`,
        body: message,
        silent: false
      }).show();
    }
  }
}
