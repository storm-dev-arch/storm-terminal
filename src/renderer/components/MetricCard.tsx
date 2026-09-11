import React from 'react';

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  badge?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  subtitle,
  value,
  unit,
  icon,
  badge,
  children,
  footer
}) => {
  return (
    <div className="surface-card" style={{
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {icon && <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>}
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)'
          }}>
            {title}
          </span>
        </div>
        {badge && (
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontWeight: 500
          }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-muted)'
          }}>
            {unit}
          </span>
        )}
        {subtitle && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px',
            fontFamily: 'var(--font-mono)'
          }}>
            {subtitle}
          </span>
        )}
      </div>

      {children && <div style={{ width: '100%' }}>{children}</div>}

      {footer && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {footer}
        </div>
      )}
    </div>
  );
};
