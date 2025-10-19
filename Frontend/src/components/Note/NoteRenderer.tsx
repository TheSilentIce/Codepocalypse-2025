import { useEffect, useState, useRef } from "react";
import FallingNote from "./FallingNote";
import type { Note } from "../utilities";
import { useAudioPlayer } from "../audio/AudioPlayer";

interface RendererProps {
  notes: Note[];
  border: number;
  speedFactor?: number; // <--- optional playback speed factor
}

export default function NoteRenderer({
  notes,
  border,
  speedFactor = 1,
}: RendererProps) {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const { triggerAttack, initAudio, isInitialized } = useAudioPlayer();

  const LEAD_TIME = 2; // seconds it takes for a note to fall visually

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

  // Schedule notes with staggered visuals for overlapping startTimes
  useEffect(() => {
    if (!notes.length || !isInitialized) return;

    // Group notes by startTime (after applying speedFactor)
    const grouped = new Map<number, Note[]>();
    notes.forEach((note) => {
      const adjustedStartTime = (note.startTime ?? 0) / speedFactor;
      const adjustedDuration = (note.duration ?? 1) / speedFactor;
      const n: Note = {
        ...note,
        startTime: adjustedStartTime,
        duration: adjustedDuration,
      };

      if (!grouped.has(adjustedStartTime)) grouped.set(adjustedStartTime, []);
      grouped.get(adjustedStartTime)!.push(n);
    });

    grouped.forEach((group, startTime) => {
      group.forEach((note, index) => {
        // Apply small horizontal offset for overlapping notes
        const xOffset = index * 5;
        note.x = (note.x ?? 0) + xOffset;

        // Schedule visual spawn LEAD_TIME seconds before audio
        const spawnTime = Math.max((startTime - LEAD_TIME) * 1000, 0);
        setTimeout(() => setActiveNotes((prev) => [...prev, note]), spawnTime);

        // Schedule audio playback
        setTimeout(
          () =>
            triggerAttack(note.midi, note.velocity ?? 0.7, note.duration ?? 1),
          startTime * 1000,
        );
      });
    });
  }, [notes, isInitialized, speedFactor, triggerAttack]);

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
