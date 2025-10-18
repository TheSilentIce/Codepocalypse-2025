import { motion } from "motion/react";

interface NoteHitEffectProps {
  x: number; // bar left
  y: number; // bar bottom (border)
  width: number; // bar width
  height: number; // bar height
  gifUrl: string;
}

export default function NoteHitEffect({
  x,
  y,
  width,
  height,
  gifUrl,
}: NoteHitEffectProps) {
  return (
    <motion.img
      src={gifUrl}
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 0.75, rotate: 90 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        left: x - width * 0.75, // adjusted for smaller scale
        top: y - height * 0.75 - 20,
        width: width * 3 * 0.75, // shrink by 25%
        height: height * 2 * 0.75,
        objectFit: "cover",
        pointerEvents: "none",
        zIndex: 100,
      }}
      alt="note-hit-gif"
    />
  );
}
