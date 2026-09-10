import { ipcMain } from 'electron';
import { TerminalManager } from '../terminal/runner';

export function registerTerminalHandlers(terminalManager: TerminalManager): void {
  ipcMain.handle('terminal:run', (_event, command: string) => {
    const id = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    terminalManager.execute(id, command);
    return { id };
  });

  ipcMain.handle('terminal:kill', (_event, id: string) => {
    terminalManager.kill(id);
  });
}
