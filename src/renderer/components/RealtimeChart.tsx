import React, { useRef, useEffect } from 'react';

interface RealtimeChartProps {
  data: number[];
  secondaryData?: number[];
  color?: string;
  secondaryColor?: string;
  height?: number;
  maxVal?: number;
  minVal?: number;
  showGrid?: boolean;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  data,
  secondaryData,
  color = '#38bdf8',
  secondaryColor = '#94a3b8',
  height = 54,
  maxVal,
  minVal = 0,
  showGrid = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;

    if (width === 0) return;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Subtle hairline grid line at 50%
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();
    }

    let computedMax = maxVal;
    if (computedMax === undefined) {
      const highest = Math.max(...data, ...(secondaryData || [0]), 1);
      computedMax = Math.ceil(highest * 1.15);
    }
    const range = Math.max(computedMax - minVal, 1);

    const drawSpline = (points: number[], strokeCol: string, fillArea: boolean) => {
      if (!points || points.length < 2) return;

      const step = width / (points.length - 1);
      const coords: { x: number; y: number }[] = points.map((val, i) => {
        const norm = Math.min(Math.max((val - minVal) / range, 0), 1);
        return {
          x: i * step,
          y: height - (norm * (height - 8)) - 4
        };
      });

      // Smooth path with cubic curves
      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);

      for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const midX = (curr.x + next.x) / 2;
        ctx.bezierCurveTo(midX, curr.y, midX, next.y, next.x, next.y);
      }

      if (fillArea) {
        ctx.save();
        ctx.lineTo(coords[coords.length - 1].x, height);
        ctx.lineTo(coords[0].x, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Crisp 1.25px stroke without tacky neon glow
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Clean crisp endpoint dot
      const last = coords[coords.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeCol;
      ctx.fill();
    };

    if (secondaryData && secondaryData.length > 1) {
      drawSpline(secondaryData, secondaryColor, false);
    }
    drawSpline(data, color, true);

    ctx.restore();
  }, [data, secondaryData, color, secondaryColor, height, maxVal, minVal, showGrid]);

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          display: 'block'
        }}
      />
    </div>
  );
};
