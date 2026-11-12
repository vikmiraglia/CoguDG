import React, { useEffect, useRef } from 'react';

interface AmbientSporeCanvasProps {
  intensity: number; // 0 to 1 based on risk
  isLoss?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  phaseSpeed: number;
  hueType: 'gold' | 'cream' | 'ember';
}

const PARTICLE_COUNT = 42;

export const AmbientSporeCanvas: React.FC<AmbientSporeCanvasProps> = ({ intensity, isLoss = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intensityRef = useRef(intensity);
  const isLossRef = useRef(isLoss);

  useEffect(() => {
    intensityRef.current = intensity;
    isLossRef.current = isLoss;
  }, [intensity, isLoss]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Pre-allocate fixed particle pool (Zero GC in loop)
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 18,
      vy: -(12 + Math.random() * 24),
      radius: 1.2 + Math.random() * 2.6,
      alpha: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 1.2 + Math.random() * 2.0,
      hueType: i % 5 === 0 ? 'ember' : i % 2 === 0 ? 'gold' : 'cream',
    }));

    let rafId = 0;
    let timerId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.08);
      lastTime = now;

      const currentIntensity = intensityRef.current;
      const lossMode = isLossRef.current;

      ctx.clearRect(0, 0, width, height);

      // Subtle radial table spotlight
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        20,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.7
      );

      if (lossMode) {
        grad.addColorStop(0, 'rgba(185, 28, 28, 0.22)');
        grad.addColorStop(0.6, 'rgba(69, 10, 10, 0.12)');
        grad.addColorStop(1, 'rgba(13, 11, 10, 0)');
      } else {
        const r = Math.round(35 + currentIntensity * 110);
        const g = Math.round(28 - currentIntensity * 12);
        const b = Math.round(18 - currentIntensity * 8);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.28)`);
        grad.addColorStop(0.6, 'rgba(20, 16, 13, 0.12)');
        grad.addColorStop(1, 'rgba(13, 11, 10, 0)');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const speedMult = lossMode ? 2.4 : 1 + currentIntensity * 1.6;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        p.phase += p.phaseSpeed * dt;
        p.x += (p.vx + Math.sin(p.phase) * 8) * dt * speedMult;
        p.y += p.vy * dt * speedMult;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const twinkle = 0.6 + 0.4 * Math.sin(p.phase);
        const finalAlpha = p.alpha * twinkle;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (lossMode || (currentIntensity > 0.55 && p.hueType === 'ember')) {
          ctx.fillStyle = `rgba(239, 68, 68, ${finalAlpha})`;
        } else if (p.hueType === 'gold') {
          ctx.fillStyle = `rgba(212, 175, 55, ${finalAlpha})`;
        } else {
          ctx.fillStyle = `rgba(245, 239, 230, ${finalAlpha * 0.75})`;
        }
        ctx.fill();
      }

      timerId = window.setTimeout(() => {
        rafId = requestAnimationFrame(render);
      }, 50);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
