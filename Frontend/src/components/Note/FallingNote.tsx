import { motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useRef } from "react";
import ParticleBurst from "./ParticleBurst";
import type { Note } from "../utilities";

interface FallingNoteProps {
  note: Note;
  border: number;
  containerHeight: number;
  onFinish?: (id: string) => void;
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
  const hasFinishedRef = useRef(false);

  // Check every frame if note reached the bottom
  useMotionValueEvent(y, "change", (latest) => {
    if (!hasFinishedRef.current && latest + noteHeight >= border) {
      hasFinishedRef.current = true;
      onFinish?.(note.id);
    }
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
      <motion.div
        style={{
          position: "absolute",
          top: y,
          width: "100%",
          height: motionHeight,
          backgroundColor: color,
          borderRadius: 4,
          zIndex: 1,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}, inset 0 0 20px ${color}`,
          filter: "brightness(1.3) saturate(1.5)",
        }}
        animate={{ top: containerHeight }}
        transition={{ duration: duration * 5, ease: "linear" }}
      />
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
