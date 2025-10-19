import { useEffect, useState, useRef } from "react";
import FallingNote from "./FallingNote";
import type { Note } from "../utilities";
import { useAudioPlayer } from "../audio/AudioPlayer";

interface RendererProps {
  notes: Note[];
  border: number;
}

export default function NoteRenderer({ notes, border }: RendererProps) {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const { triggerAttack, triggerRelease, initAudio, isInitialized } =
    useAudioPlayer();

  // Initialize audio once
  useEffect(() => {
    initAudio();
  }, [initAudio]);

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

  // Schedule notes based on startTime
  useEffect(() => {
    if (!notes.length) return;

    const grouped = new Map<number, Note[]>();
    notes.forEach((note) => {
      const t = note.startTime ?? 0;
      if (!grouped.has(t)) grouped.set(t, []);
      grouped.get(t)!.push(note);
    });

    const timers: number[] = [];
    grouped.forEach((group, startTime) => {
      const timer = window.setTimeout(() => {
        setActiveNotes((prev) => [...prev, ...group]);
      }, startTime * 1000);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [notes]);

  const removeNote = (id: string) => {
    setActiveNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative w-full">
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
            triggerAttack={triggerAttack}
            triggerRelease={triggerRelease}
          />
        ))}
      </div>
    </div>
  );
}
