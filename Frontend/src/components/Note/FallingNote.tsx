import { motion, useMotionValue, useMotionValueEvent } from "motion/react";
import type { Note } from "../utilities";
import { useState } from "react";

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
  const extraHeight = 50; // extra height for longer visuals
  const motionHeight = noteHeight + extraHeight;

  const y = useMotionValue(-motionHeight);
  const [showGif, setShowGif] = useState(false);

  // Keep GIF visible as long as **bottom of motion div touches the border**
  useMotionValueEvent(y, "change", (latest) => {
    const bottom = latest + motionHeight;
    setShowGif(bottom >= border);
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
          overflow: "visible",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            top: y,
            width: "100%",
            height: motionHeight,
            backgroundColor: color,
          }}
          animate={{ top: containerHeight }}
          transition={{ duration: duration * 2, ease: "linear" }}
          onAnimationComplete={() => onFinish?.(note.id)}
        />
      </div>

      {/* GIF at border */}
      {showGif && (
        <motion.img
          src={gifUrl}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            left: x - width / 2,
            top: border - 50, // adjust to lift GIF above border
            width: width * 2,
            height: width * 2,
            pointerEvents: "none",
            zIndex: 50,
          }}
          alt="note-hit-gif"
        />
      )}
    </>
  );
}
