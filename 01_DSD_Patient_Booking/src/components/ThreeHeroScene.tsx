import React, { useEffect, useRef } from 'react';

interface ThreeHeroSceneProps {
  className?: string;
}

export const ThreeHeroScene: React.FC<ThreeHeroSceneProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates with spring physics
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMouseMove);

    // 3D Particles & DNA Strand Nodes
    const NUM_BASE_PAIRS = 24;
    const HELIX_RADIUS = 75;
    const HELIX_HEIGHT = 380;
    let time = 0;

    // Molecular ambient particles
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 200 + 50,
      radius: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: Math.random() > 0.5 ? 'rgba(56, 189, 248, ' : 'rgba(52, 211, 153, '
    }));

    const render = () => {
      time += 0.02;

      // Spring physics dampening on mouse
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const tiltX = (mouse.x - width / 2) * 0.0008;
      const tiltY = (mouse.y - height / 2) * 0.0008;

      ctx.clearRect(0, 0, width, height);

      // Radial background glow behind 3D core
      const bgGlow = ctx.createRadialGradient(
        width / 2 + (mouse.x - width / 2) * 0.15,
        height / 2 + (mouse.y - height / 2) * 0.15,
        20,
        width / 2,
        height / 2,
        280
      );
      bgGlow.addColorStop(0, 'rgba(14, 165, 233, 0.14)');
      bgGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.06)');
      bgGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Render floating ambient particles (depth projection)
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const scale = 200 / (200 + p.z);
        const alpha = Math.min(0.7, scale * 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color + alpha + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3D DNA Double Helix Calculation
      const centerX = width / 2;
      const centerY = height / 2;

      interface StrandNode {
        x: number;
        y: number;
        z: number;
        type: 'strandA' | 'strandB';
        pairIndex: number;
      }

      const nodes: StrandNode[] = [];

      for (let i = 0; i < NUM_BASE_PAIRS; i++) {
        const progress = i / NUM_BASE_PAIRS;
        const yOffset = (progress - 0.5) * HELIX_HEIGHT;
        const angle = progress * Math.PI * 4 + time + tiltX * 10;

        // Strand A
        const xA = Math.cos(angle) * HELIX_RADIUS;
        const zA = Math.sin(angle) * HELIX_RADIUS;
        // Strand B (opposite 180 deg)
        const xB = Math.cos(angle + Math.PI) * HELIX_RADIUS;
        const zB = Math.sin(angle + Math.PI) * HELIX_RADIUS;

        // 3D Rotation with tilt
        const rotYA = xA * Math.cos(tiltY) - zA * Math.sin(tiltY);
        const rotZA = xA * Math.sin(tiltY) + zA * Math.cos(tiltY);

        const rotYB = xB * Math.cos(tiltY) - zB * Math.sin(tiltY);
        const rotZB = xB * Math.sin(tiltY) + zB * Math.cos(tiltY);

        nodes.push({
          x: centerX + rotYA,
          y: centerY + yOffset,
          z: rotZA,
          type: 'strandA',
          pairIndex: i
        });

        nodes.push({
          x: centerX + rotYB,
          y: centerY + yOffset,
          z: rotZB,
          type: 'strandB',
          pairIndex: i
        });
      }

      // Sort by Z for realistic 3D depth rendering
      nodes.sort((a, b) => a.z - b.z);

      // Render connecting hydrogen bonds between pairs
      for (let i = 0; i < NUM_BASE_PAIRS; i++) {
        const nodeA = nodes.find(n => n.pairIndex === i && n.type === 'strandA');
        const nodeB = nodes.find(n => n.pairIndex === i && n.type === 'strandB');
        if (!nodeA || !nodeB) continue;

        const avgZ = (nodeA.z + nodeB.z) / 2;
        const bondAlpha = Math.max(0.12, (avgZ + HELIX_RADIUS) / (HELIX_RADIUS * 2) * 0.45);

        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.strokeStyle = `rgba(148, 163, 184, ${bondAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Glowing center enzyme midpoint
        const midX = (nodeA.x + nodeB.x) / 2;
        const midY = (nodeA.y + nodeB.y) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 63, 94, ${bondAlpha * 1.5})`;
        ctx.fill();
      }

      // Render helix nucleotide nodes
      nodes.forEach(node => {
        const scale = (node.z + HELIX_RADIUS * 1.5) / (HELIX_RADIUS * 2.5);
        const nodeRadius = Math.max(2, 4.2 * scale);
        const alpha = Math.max(0.25, Math.min(1, scale));

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        
        if (node.type === 'strandA') {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 10 * scale;
        } else {
          ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
          ctx.shadowColor = '#059669';
          ctx.shadowBlur = 10 * scale;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // White core reflection
        ctx.beginPath();
        ctx.arc(node.x - nodeRadius * 0.3, node.y - nodeRadius * 0.3, nodeRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default ThreeHeroScene;
