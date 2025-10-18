import { motion } from "motion/react";
import type { Note } from "../utilities";

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
  const noteHeight = duration * 50;

  return (
    <div
      className="absolute"
      style={{
        left: x,
        width,
        height: containerHeight, // full container height
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: -noteHeight, // start slightly above container
          width: "100%",
          height: noteHeight,
          backgroundColor: color,
        }}
        animate={{ top: border }} // fall to the actual border
        transition={{ duration: duration * 2, ease: "linear" }}
        onAnimationComplete={() => onFinish?.(note.id)}
      />
    </div>
  );
}
