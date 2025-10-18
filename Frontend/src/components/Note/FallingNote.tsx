import { motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import NoteHitEffect from "./NoteHitEffect";
import type { Note } from "../utilities";

interface FallingNoteProps {
  note: Note;
  border: number;
  containerHeight: number;
  gifUrl: string;
  onFinish?: (id: string | number) => void;
}

export default function FallingNote({
  note,
  border,
  containerHeight,
  gifUrl,
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
  const [showGif, setShowGif] = useState(false);

  // Show GIF only when bottom of note hits/passes the border
  useMotionValueEvent(y, "change", (latest) => {
    const bottom = latest + motionHeight;
    if (bottom >= border) setShowGif(true);
  });

  return (
    <>
      {/* Falling note */}
      <div
        className="absolute"
        style={{
          left: x,
          width,
          height: containerHeight,
          overflow: "visible", // allow GIF to show
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
          }}
          animate={{ top: containerHeight }}
          transition={{ duration: duration * 5, ease: "linear" }}
          onAnimationComplete={() => onFinish?.(note.id)}
        />
      </div>

      {/* NoteHitEffect appears above the bar */}
      {showGif && (
        <NoteHitEffect
          x={x + width / 2}
          y={border}
          width={width}
          height={motionHeight}
          gifUrl={gifUrl}
        />
      )}
    </>
  );
}
