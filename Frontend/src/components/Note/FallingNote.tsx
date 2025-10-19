import { motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useRef, useEffect } from "react";
import type { Note } from "../utilities";

interface FallingNoteProps {
  note: Note;
  border: number;
  containerHeight: number;
  leadTime: number; // How long the note takes to fall (in seconds)
  onFinish?: (id: string | number) => void;
}

export default function FallingNote({
  note,
  border,
  containerHeight,
  leadTime,
  onFinish,
}: FallingNoteProps) {
  const x = note.x ?? 0;
  const width = note.width ?? 20;
  const color = note.color ?? "aqua";

  const extraHeight = 50;
  const noteHeight = 20 + (note.duration ?? 1) * 10;
  const motionHeight = noteHeight + extraHeight;
  const y = useMotionValue(-motionHeight);
  const hasFinishedRef = useRef(false);

  // Use the leadTime prop for animation duration
  const animationDuration = leadTime;

  // Fire onFinish when note reaches the bottom
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
        transition={{ duration: animationDuration, ease: "linear" }}
      />
    </div>
  );
}
