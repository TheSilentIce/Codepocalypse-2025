import { useEffect, useState, useRef } from "react";
import FallingNote from "./FallingNote";
import type { Note } from "../utilities";
import { useAudioPlayer } from "../audio/AudioPlayer";

interface RendererProps {
  notes: Note[];
  border: number;
  speedFactor?: number;
  onNoteHit?: (midi: number) => void;
}

export default function NoteRenderer({
  notes,
  border,
  speedFactor = 1,
  onNoteHit,
}: RendererProps) {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const { triggerAttack, initAudio, isInitialized } = useAudioPlayer();

  const LEAD_TIME = 2; // seconds for note to fall visually

  // Initialize audio once
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  // Measure container height dynamically
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setContainerHeight(height);
        const rect = containerRef.current.getBoundingClientRect();
        console.log("Notes container:", {
          height,
          clientHeight: height,
          top: rect.top,
        });
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Schedule notes to appear on screen
  useEffect(() => {
    if (!notes.length || !isInitialized) return;

    // Group notes by startTime
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

        // Schedule visual spawn LEAD_TIME seconds BEFORE the note should play
        const spawnTime = Math.max((startTime - LEAD_TIME) * 1000, 0);
        const timeoutId = setTimeout(() => {
          setActiveNotes((prev) => [...prev, note]);
        }, spawnTime);

        return () => clearTimeout(timeoutId);
      });
    });
  }, [notes, isInitialized, speedFactor]);

  // Callback when a note reaches the bottom - trigger audio and keyboard feedback
  const handleNoteHitBorder = (noteId: string | number) => {
    const hitNote = activeNotes.find((n) => n.id === noteId);
    if (hitNote) {
      console.log("Note hit:", {
        midi: hitNote.midi,
        x: hitNote.x,
        id: hitNote.id,
      });
      triggerAttack(
        hitNote.midi,
        hitNote.velocity ?? 0.7,
        hitNote.duration ?? 1,
      );
      // Notify parent to light up keyboard
      onNoteHit?.(hitNote.midi);
    }
    removeNote(noteId as string);
  };

  const removeNote = (id: string) => {
    setActiveNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const MASK_HEIGHT = 80; // Height of fade-out zone at bottom

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-visible bg-black"
        style={{
          minHeight: "100%",
          maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${((containerHeight - MASK_HEIGHT) / containerHeight) * 100}%, rgba(0,0,0,0) 100%)`,
          WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${((containerHeight - MASK_HEIGHT) / containerHeight) * 100}%, rgba(0,0,0,0) 100%)`,
        }}
      >
        {activeNotes.map((note) => (
          <FallingNote
            key={note.id}
            note={note}
            border={border}
            containerHeight={containerHeight}
            leadTime={LEAD_TIME}
            onFinish={handleNoteHitBorder}
          />
        ))}
      </div>
    </div>
  );
}
