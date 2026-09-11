import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LinuxTerminalWindow } from './pages/LinuxTerminalWindow';
import './styles/index.css';

const isLinuxWindow = window.location.search.includes('window=linux-terminal');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {isLinuxWindow ? <LinuxTerminalWindow /> : <App />}
  </React.StrictMode>
);
