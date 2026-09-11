import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
import { TerminalStreamChunk } from '../../shared/types/terminal';

export class TerminalManager {
  private activeProcesses = new Map<string, ChildProcess>();

  constructor(private getWindow?: () => BrowserWindow | null) {}

  private broadcast(channel: string, data: any) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    }
  }

  public execute(id: string, command: string): void {
    this.broadcast('terminal:stream', {
      id,
      type: 'stdout',
      data: `\r\n> ${command}\r\n`
    } as TerminalStreamChunk);

    const proc = spawn('cmd.exe', ['/d', '/s', '/c', `chcp 65001 >nul && ${command}`], {
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', LANG: 'en_US.UTF-8' }
    });

    this.activeProcesses.set(id, proc);

    proc.stdout.on('data', (chunk: Buffer) => {
      this.broadcast('terminal:stream', {
        id,
        type: 'stdout',
        data: chunk.toString('utf8')
      } as TerminalStreamChunk);
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      this.broadcast('terminal:stream', {
        id,
        type: 'stderr',
        data: chunk.toString('utf8')
      } as TerminalStreamChunk);
    });

    proc.on('close', (code) => {
      this.activeProcesses.delete(id);
      this.broadcast('terminal:stream', {
        id,
        type: 'exit',
        code: code ?? 0
      } as TerminalStreamChunk);
    });

    proc.on('error', (err) => {
      this.activeProcesses.delete(id);
      this.broadcast('terminal:stream', {
        id,
        type: 'error',
        data: `\r\nExecution Error: ${err.message}\r\n`
      } as TerminalStreamChunk);
    });
  }

  public kill(id: string): void {
    const proc = this.activeProcesses.get(id);
    if (proc) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', proc.pid?.toString() || '', '/f', '/t'], { windowsHide: true });
        } else {
          proc.kill('SIGTERM');
        }
      } catch (err) {
        console.error('Failed to terminate terminal process:', err);
      }
      this.activeProcesses.delete(id);
    }
  }

  public cleanup(): void {
    for (const [id, proc] of this.activeProcesses.entries()) {
      try {
        proc.kill();
      } catch {}
    }
    this.activeProcesses.clear();
  }
}
