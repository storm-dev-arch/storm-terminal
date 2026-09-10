import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  height?: number;
  showText?: boolean;
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = 4,
  showText = false,
  color,
  className
}) => {
  const clamped = Math.min(Math.max(value, 0), 100);

  let barColor = color;
  if (!barColor) {
    if (clamped >= 85) barColor = 'var(--accent-rose)';
    else if (clamped >= 70) barColor = 'var(--accent-amber)';
    else barColor = 'var(--text-secondary)';
  }

  return (
    <div className={className} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1,
        height: `${height}px`,
        background: 'rgba(255, 255, 255, 0.06)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${clamped}%`,
          height: '100%',
          background: barColor,
          borderRadius: '2px',
          transition: 'width 240ms cubic-bezier(0.16, 1, 0.3, 1)'
        }} />
      </div>
      {showText && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          minWidth: '32px',
          textAlign: 'right'
        }}>
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  );
};
