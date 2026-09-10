import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDanger?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  isDanger = true,
  confirmText = 'Terminate Process',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="surface-card" style={{
        width: '400px',
        maxWidth: '90%',
        padding: '18px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-hover)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            color: isDanger ? 'var(--accent-rose)' : 'var(--accent-amber)',
            padding: '6px',
            borderRadius: 'var(--radius-xs)',
            background: isDanger ? 'var(--accent-rose-dim)' : 'var(--accent-amber-dim)'
          }}>
            <AlertTriangle size={18} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <button onClick={onCancel} style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px'
        }}>
          <button className="btn-action" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={isDanger ? 'btn-danger btn-action' : 'btn-primary btn-action'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
