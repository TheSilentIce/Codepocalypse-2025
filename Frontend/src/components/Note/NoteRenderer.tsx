import { useState, useEffect, useRef } from "react";
import type { Note } from "../utilities";
import FallingNote from "./FallingNote";

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
  isInitialized
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

  // Auto-initialize audio on mount
  useEffect(() => {
    const init = async () => {
      await initAudio();
    };
    init();
  }, [initAudio]);

  // Schedule notes based on startTime
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
        // console.log("Spawning notes at time:", startTime, group);
        setActiveNotes((prev) => [...prev, ...group]);
      }, startTime * 1000);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [notes]);

  const removeNote = (id: string | number) => {
    // console.log("Removing note:", id);
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
      {/* Debug buttons */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        {!isInitialized && (
          <button
            onClick={handleInitAudio}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            🔊 Enable Audio
          </button>
        )}
        <button
          onClick={testSound}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          🎵 Test Sound
        </button>
      </div>

      {/* Note renderer container */}
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
