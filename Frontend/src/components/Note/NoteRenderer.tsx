import { useEffect, useState, useRef } from "react";
import FallingNote from "./FallingNote";
import type { Note } from "../utilities";

interface RendererProps {
  notes: Note[];
  border: number;
  triggerAttack: (midi: number, velocity?: number) => void;
  triggerRelease: (midi: number) => void;
  initAudio: () => Promise<void>;
  isInitialized: boolean;
}

export default function NoteRenderer({
  notes,
  border,
  triggerAttack,
  triggerRelease,
  initAudio,
  isInitialized,
}: RendererProps) {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Debug logging
  // console.log("=== NoteRenderer Debug ===");
  // console.log("Notes passed to renderer:", notes.length);
  // console.log("Active notes:", activeNotes.length);
  // console.log("Border position:", border);
  // console.log("Container height:", containerHeight);
  // console.log("Audio initialized:", isInitialized);
  // console.log(
  //   "Border is at:",
  //   ((border / containerHeight) * 100).toFixed(0) + "% from top",
  // );
  // console.log("Sample note:", notes[0]);

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

  // Manual audio init button
  const handleInitAudio = async () => {
    // console.log("Manual audio init clicked");
    await initAudio();
  };

  // Test button to verify audio works
  const testSound = () => {
    // console.log("Test sound button clicked");
    triggerAttack(60, 0.8);
    setTimeout(() => triggerRelease(60), 500);
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
