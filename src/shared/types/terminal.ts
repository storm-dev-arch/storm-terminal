export interface TerminalStreamChunk {
  id: string;
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  data?: string;
  code?: number;
}

export interface TerminalCommandRequest {
  id: string;
  command: string;
}
