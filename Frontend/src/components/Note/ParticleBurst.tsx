import { useMotionValueEvent, MotionValue } from "motion/react";
import { useState, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  speed: number;
  key: string;
  height: number;
  sway: number;
  swayDir: number;
}

interface ParticleBurstProps {
  x: number;
  yMotion: MotionValue<number>;
  width: number;
  height: number; // note height
  color: string; // <- pass note color
}

export default function ParticleBurst({
  x,
  yMotion,
  width,
  height,
  color,
}: ParticleBurstProps) {
  const [y, setY] = useState(yMotion.get());
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useMotionValueEvent(yMotion, "change", (latest) => setY(latest));

  // Spawn particles gradually from bottom
  useEffect(() => {
    const interval = setInterval(() => {
      const newParticles: Particle[] = Array.from({ length: 3 }).map(() => ({
        x: Math.random() * width,
        y: 0, // start at bottom of note
        speed: 0.5 + Math.random() * 1.2,
        key: Math.random().toString(36).substr(2, 9),
        height: 6 + Math.random() * 12,
        sway: Math.random() * 2,
        swayDir: Math.random() > 0.5 ? 1 : -1,
      }));
      setParticles((prev) => [...prev, ...newParticles].slice(-500));
    }, 50);

    return () => clearInterval(interval);
  }, [width]);

  // Animate particles rising up to top of note
  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          const newSway = p.sway + 0.1 * p.swayDir;
          const newSwayDir = Math.abs(newSway) > 3 ? -p.swayDir : p.swayDir;
          const newY = Math.min(p.y + p.speed, height);
          return { ...p, y: newY, sway: newSway, swayDir: newSwayDir };
        }),
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [height]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y, // container aligned with note top
        width,
        height, // container same height as note
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "visible",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x + p.sway,
            bottom: 0,
            width: 4 + Math.random() * 2,
            height: p.height,
            background: `linear-gradient(to top, ${color}, transparent)`,
            transform: `translateY(-${p.y}px)`,
            borderRadius: 2,
            opacity: Math.max(0, 1 - p.y / height),
          }}
        />
      ))}
    </div>
  );
}
