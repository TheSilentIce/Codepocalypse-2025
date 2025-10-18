import { useState, useEffect, useRef } from "react";
import type { Note } from "../utilities";
import FallingNote from "./FallingNote";

interface RendererProps {
  notes: Note[];
  border: number;
}

export default function NoteRenderer({ notes, border }: RendererProps) {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measure container height dynamically
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div
      ref={containerRef}
      className="w-full relative h-[400px] overflow-hidden bg-black"
    >
      {activeNotes.map((note) => (
        <FallingNote
          key={note.id}
          note={note}
          border={border}
          containerHeight={containerHeight}
          onFinish={removeNote}
        />
      ))}
    </div>
  );
}
