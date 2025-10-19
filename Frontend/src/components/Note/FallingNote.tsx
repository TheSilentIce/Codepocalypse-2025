import { motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useState, useRef } from "react";
import ParticleBurst from "./ParticleBurst";
import { type Note } from "../utilities";

interface FallingNoteProps {
  note: Note;
  border: number;
  containerHeight: number;
  onFinish?: (id: string | number) => void;
  triggerAttack?: (midi: number, velocity: number) => void;
  triggerRelease?: (midi: number) => void;
}

export default function FallingNote({
  note,
  border,
  containerHeight,
  onFinish,
  triggerAttack,
  triggerRelease,
}: FallingNoteProps) {
  const x = note.x ?? 0;
  const width = note.width ?? 20;
  const duration = note.duration ?? 1;
  const color = note.color ?? "aqua";
  const midi = note.midi ?? 60;
  const velocity = note.velocity ?? 0.7;

  const noteHeight = 20 + duration * 10;
  const extraHeight = 50;
  const motionHeight = noteHeight + extraHeight;
  const y = useMotionValue(-motionHeight);
  const hasPlayedRef = useRef(false);

  // Use motionValueEvent to check **every frame**
  useMotionValueEvent(y, "change", (latest) => {
    if (!hasPlayedRef.current && latest + noteHeight >= border) {
      // Trigger the note **exactly when it hits the floor**
      if (triggerAttack) {
        // Use triggerAttackRelease for exact duration
        if ("triggerAttackRelease" in triggerAttack) {
          (triggerAttack as any).triggerAttackRelease?.(
            midi,
            duration,
            velocity,
          );
        } else {
          triggerAttack(midi, velocity);
          if (triggerRelease) {
            setTimeout(() => triggerRelease(midi), duration * 1000);
          }
        }
      }

      hasPlayedRef.current = true;
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
        onAnimationComplete={() => onFinish?.(note.id)}
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
