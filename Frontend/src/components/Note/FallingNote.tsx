import { motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import ParticleBurst from "./ParticleBurst";

interface Note {
  id: string | number;
  x?: number;
  width?: number;
  duration?: number;
  color?: string;
}

interface FallingNoteProps {
  note: Note;
  border: number;
  containerHeight: number;
  onFinish?: (id: string | number) => void;
}

export default function FallingNote({
  note,
  border,
  containerHeight,
  onFinish,
}: FallingNoteProps) {
  const x = note.x ?? 0;
  const width = note.width ?? 20;
  const duration = note.duration ?? 1;
  const color = note.color ?? "aqua";
  const noteHeight = 20 + duration * 10;
  const extraHeight = 50;
  const motionHeight = noteHeight + extraHeight;
  const y = useMotionValue(-motionHeight);
  const [hitBorder, setHitBorder] = useState(false);

  useMotionValueEvent(y, "change", (latest) => {
    const bottom = latest + motionHeight;
    if (bottom >= border) setHitBorder(true);
  });

  return (
    <div
      className="absolute"
      style={{
        left: x,
        width,
        height: containerHeight,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {/* Note itself */}
      <motion.div
        style={{
          position: "absolute",
          top: y,
          width: "100%",
          height: motionHeight,
          backgroundColor: color,
          borderRadius: 4,
          zIndex: 1,
        }}
        animate={{ top: containerHeight }}
        transition={{ duration: duration * 1, ease: "linear" }}
        onAnimationComplete={() => onFinish?.(note.id)}
      />

      {/* ParticleBurst aligned with note */}
      <ParticleBurst
        x={0}
        yMotion={y}
        width={width}
        height={motionHeight}
        color={color}
      />
    </div>
  );
}
