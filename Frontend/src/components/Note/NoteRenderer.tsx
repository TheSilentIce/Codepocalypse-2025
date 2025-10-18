import { motion } from "motion/react";
import { useState, useEffect } from "react";
import type { Note } from "../utilities";

interface RendererProps {
  notes: Note[];
  border: number;
}

function NoteRenderer({ notes, border }: RendererProps) {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!notes.length) return;

    const grouped = new Map<number, Note[]>();
    for (const note of notes) {
      const t = note.startTime ?? 0;
      if (!grouped.has(t)) grouped.set(t, []);
      grouped.get(t)!.push(note);
    }

    const timers: number[] = [];
    grouped.forEach((group, startTime) => {
      const timer = window.setTimeout(() => {
        setActiveNotes((prev) => [...prev, ...group]);
      }, startTime * 1000);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [notes]);

  const removeNote = (id: string | number) => {
    setActiveNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="w-full relative h-[400px] overflow-hidden bg-black">
      {activeNotes.map((note) => (
        <div
          key={note.id}
          className="absolute overflow-hidden"
          style={{
            left: note.x ?? 0,
            width: note.width ?? 20,
            height: border,
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              top: -note.duration * 100,
              width: "100%",
              height: note.duration * 100,
              backgroundColor: note.color ?? "aqua",
            }}
            animate={{ top: border }}
            transition={{
              duration: note.duration * 2,
              ease: "linear",
            }}
            onAnimationComplete={() => removeNote(note.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default NoteRenderer;
