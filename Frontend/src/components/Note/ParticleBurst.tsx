import { useMotionValueEvent, MotionValue } from "motion/react";
import { useState, useEffect, useRef, useMemo, memo } from "react";

interface Particle {
  x: number;
  y: number;
  speed: number;
  key: string;
  height: number;
  sway: number;
  swayDir: number;
  opacity: number;
  width: number;
}

interface ParticleBurstProps {
  x: number;
  yMotion: MotionValue<number>;
  width: number;
  height: number;
  color: string;
}

// Memoized particle component
const ParticleElement = memo(
  ({
    p,
    color,
    height,
    noteWidth,
  }: {
    p: Particle;
    color: string;
    height: number;
    noteWidth: number;
  }) => {
    const progress = p.y / height;
    const opacity = p.opacity * (1 - progress);
    const clampedX = Math.max(0, Math.min(noteWidth - 6, p.x + p.sway));

    return (
      <div
        key={p.key}
        style={{
          position: "absolute",
          left: clampedX,
          bottom: 0,
          width: p.width,
          height: p.height,
          background: `linear-gradient(to top, ${color}, ${color}00)`,
          transform: `translateY(-${p.y}px)`,
          borderRadius: 2,
          opacity,
          boxShadow: `0 0 4px ${color}`,
          willChange: "transform, opacity",
        }}
      />
    );
  },
);

ParticleElement.displayName = "ParticleElement";

function ParticleBurst({
  x,
  yMotion,
  width,
  height,
  color,
}: ParticleBurstProps) {
  const [y, setY] = useState(yMotion.get());
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);

  // Pre-generate random values for particle creation
  const particleFactory = useMemo(() => {
    const randomValues = new Float32Array(1000);
    for (let i = 0; i < randomValues.length; i++) {
      randomValues[i] = Math.random();
    }
    let index = 0;

    return () => {
      const getRandom = () => {
        const val = randomValues[index];
        index = (index + 1) % randomValues.length;
        return val;
      };

      return {
        x: getRandom() * width,
        y: 0,
        speed: 0.8 + getRandom() * 1.5,
        key: `${Date.now()}-${getRandom()}`,
        height: 8 + getRandom() * 14,
        sway: 0,
        swayDir: getRandom() > 0.5 ? 1 : -1,
        opacity: 0.8 + getRandom() * 0.2,
        width: 3 + getRandom() * 3,
      };
    };
  }, [width]);

  // Track note position efficiently
  useMotionValueEvent(yMotion, "change", setY);

  // Spawn particles with RAF instead of setInterval
  useEffect(() => {
    const spawnParticles = (timestamp: number) => {
      if (timestamp - lastSpawnTime.current > 40) {
        const newParticles: Particle[] = [
          particleFactory(),
          particleFactory(),
          particleFactory(),
        ];

        setParticles((prev) => {
          const combined = [...prev, ...newParticles];
          return combined.length > 500 ? combined.slice(-500) : combined;
        });

        lastSpawnTime.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(spawnParticles);
    };

    animationRef.current = requestAnimationFrame(spawnParticles);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleFactory]);

  // Animate particles with batched updates
  useEffect(() => {
    const animate = () => {
      setParticles((prev) => {
        const updated: Particle[] = [];

        for (let i = 0; i < prev.length; i++) {
          const p = prev[i];
          const newY = p.y + p.speed;

          if (newY <= height) {
            const newSway = p.sway + 0.15 * p.swayDir;
            const absSway = Math.abs(newSway);

            updated.push({
              ...p,
              y: newY,
              sway: newSway,
              swayDir: absSway > 4 ? -p.swayDir : p.swayDir,
            });
          }
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [height]);

  // Container style - don't memoize because y updates frequently
  const containerStyle = {
    position: "absolute" as const,
    left: x,
    top: y,
    width,
    height,
    pointerEvents: "none" as const,
    zIndex: 2,
    overflow: "visible" as const,
  };

  return (
    <div style={containerStyle}>
      {particles.map((p) => (
        <ParticleElement
          key={p.key}
          p={p}
          color={color}
          height={height}
          noteWidth={width}
        />
      ))}
    </div>
  );
}

export default memo(ParticleBurst);
