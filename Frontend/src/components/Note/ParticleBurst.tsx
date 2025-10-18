import { useMotionValueEvent, MotionValue } from "motion/react";
import { useState } from "react";

interface ParticleBurstProps {
  x: number; // left position of note
  yMotion: MotionValue<number>; // motion value from FallingNote
  width: number; // note width
  height: number; // full note height including extraHeight
}

export default function ParticleBurst({
  x,
  yMotion,
  width,
  height,
}: ParticleBurstProps) {
  const [y, setY] = useState(yMotion.get());

  // Update y position whenever motion value changes
  useMotionValueEvent(yMotion, "change", (latest) => {
    setY(latest);
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x, // align left with note
        top: y, // match top of note
        width: width, // same width as note
        height: height, // same height as note
        border: "2px solid yellow", // outline effect to visualize alignment
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 5,
        boxSizing: "border-box", // include border in dimensions
      }}
    />
  );
}
