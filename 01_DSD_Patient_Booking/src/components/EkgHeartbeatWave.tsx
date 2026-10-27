import React, { useEffect, useRef } from 'react';

interface EkgHeartbeatWaveProps {
  className?: string;
  heartRate?: number;
  color?: string;
}

export const EkgHeartbeatWave: React.FC<EkgHeartbeatWaveProps> = ({
  className = '',
  heartRate = 72,
  color = '#10b981'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 240);
    let height = (canvas.height = 32);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 32;
    };
    window.addEventListener('resize', handleResize);

    let offset = 0;
    const speed = 1.4;

    // Mathematical EKG Heartbeat waveform generator (P-Q-R-S-T wave)
    const getEkgY = (x: number): number => {
      const cycleLength = 110;
      const phase = (x % cycleLength + cycleLength) % cycleLength;
      const mid = height / 2;

      // Flat isoelectric line
      if (phase < 30) return mid;

      // P wave (small atrial depolarization)
      if (phase >= 30 && phase < 45) {
        return mid - Math.sin(((phase - 30) / 15) * Math.PI) * 4;
      }

      // PR segment
      if (phase >= 45 && phase < 52) return mid;

      // Q wave (small downward dip)
      if (phase >= 52 && phase < 56) {
        return mid + 3.5;
      }

      // R wave (sharp systolic spike)
      if (phase >= 56 && phase < 62) {
        return mid - 14;
      }

      // S wave (deep downward spike)
      if (phase >= 62 && phase < 68) {
        return mid + 6;
      }

      // ST segment
      if (phase >= 68 && phase < 76) return mid;

      // T wave (ventricular repolarization dome)
      if (phase >= 76 && phase < 94) {
        return mid - Math.sin(((phase - 76) / 18) * Math.PI) * 6;
      }

      // U wave / Return to baseline
      return mid;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw glowing EKG path
      ctx.beginPath();
      for (let x = 0; x < width; x += 1.5) {
        const y = getEkgY(x + offset);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Lead sweeping pulse dot
      const leadX = width - 8;
      const leadY = getEkgY(leadX + offset);
      ctx.beginPath();
      ctx.arc(leadX, leadY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.shadowBlur = 0;
      offset += speed;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [heartRate, color]);

  return (
    <div className={`relative flex items-center overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-8" />
    </div>
  );
};

export default EkgHeartbeatWave;
