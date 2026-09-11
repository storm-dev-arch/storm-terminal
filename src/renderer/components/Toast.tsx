import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '18px',
      right: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      zIndex: 2000,
      maxWidth: '340px'
    }}>
      {toasts.map((toast) => {
        let icon = <Info size={14} style={{ color: 'var(--text-secondary)' }} />;
        let borderColor = 'var(--border-hover)';
        if (toast.type === 'error' || toast.type === 'warning') {
          icon = <AlertCircle size={14} style={{ color: 'var(--accent-rose)' }} />;
          borderColor = 'rgba(239, 68, 68, 0.3)';
        } else if (toast.type === 'success') {
          icon = <CheckCircle size={14} style={{ color: 'var(--accent-emerald)' }} />;
          borderColor = 'rgba(16, 185, 129, 0.3)';
        }

        return (
          <div
            key={toast.id}
            className="surface-card"
            style={{
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '9px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ marginTop: '2px' }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {toast.message}
              </div>
            </div>
            <button onClick={() => onDismiss(toast.id)} style={{ color: 'var(--text-muted)' }}>
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
