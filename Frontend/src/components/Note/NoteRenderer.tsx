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

  const { triggerAttack, initAudio, isInitialized } = useAudioPlayer();

  // Initialize audio once
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  // Measure container height dynamically
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current)
        setContainerHeight(containerRef.current.clientHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Schedule notes for audio and visuals
  useEffect(() => {
    if (!notes.length || !isInitialized) return;

    const leadTime = 2; // seconds ahead to spawn visual notes
    const offsetStep = 0.01; // small offset for simultaneous notes

    notes.forEach((note, index) => {
      // Audio scheduling
      triggerAttack(
        note.midi,
        note.velocity ?? 0.7,
        note.duration ?? 1,
        note.startTime + index * offsetStep,
      );

      // Visual scheduling
      const spawnTime = Math.max((note.startTime - leadTime) * 1000, 0);
      setTimeout(() => setActiveNotes((prev) => [...prev, note]), spawnTime);
    });
  }, [notes, isInitialized, triggerAttack]);

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
          />
        ))}
      </div>
    </div>
  );
}
