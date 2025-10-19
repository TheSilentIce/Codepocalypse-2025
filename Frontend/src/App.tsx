import { useState, useCallback, useEffect } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import { convertMidiToNotes } from "./components/utilities";
import { Keyboard } from "./components/keyboard/KeyboardTwo";
import type { KeyName } from "./components/keyboard/KeyboardTwo";

interface KeyStateMap {
  [key: string]: boolean;
}

const TARGET_KEYS: KeyName[] = ["a", "s", "d", "f", "j", "k", "l", ";"];

const createInitialKeyState = (): KeyStateMap =>
  TARGET_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as KeyStateMap);

// Grid column mapping for each MIDI note (1-indexed for CSS Grid)
const MIDI_TO_GRID_COLUMN: { [key: number]: number } = {
  38: 1,
  39: 1,
  40: 1,
  50: 2,
  51: 2,
  52: 2,
  53: 3,
  54: 3,
  55: 3,
  57: 4,
  58: 4,
  59: 4,
  60: 6,
  61: 6,
  62: 6,
  63: 7,
  64: 7,
  65: 7,
  66: 8,
  67: 8,
  68: 8,
  69: 9,
  70: 9,
  71: 9,
};

// Map grid column back to key for keyboard animation
const GRID_COLUMN_TO_KEY: { [key: number]: KeyName } = {
  1: "a",
  2: "s",
  3: "d",
  4: "f",
  6: "j",
  7: "k",
  8: "l",
  9: ";",
};

const KEY_COLORS: { [key: string]: string } = {
  a: "#FF6B6B",
  s: "#4ECDC4",
  d: "#45B7D1",
  f: "#FFA07A",
  j: "#98D8C8",
  k: "#F7DC6F",
  l: "#BB8FCE",
  ";": "#85C1E2",
};

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [keyStates, setKeyStates] = useState<KeyStateMap>(
    createInitialKeyState(),
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let midiNotes = convertMidiToNotes(reader.result as ArrayBuffer, 880);

        // Remap x positions to grid columns and assign colors
        midiNotes = midiNotes.map((note) => {
          const gridColumn = MIDI_TO_GRID_COLUMN[note.midi] ?? 1;
          const key = GRID_COLUMN_TO_KEY[gridColumn];
          const pixelX = (gridColumn - 1) * 60 + 30;
          const noteColor = KEY_COLORS[key] || "#FF00FF";
          return {
            ...note,
            x: pixelX,
            color: noteColor,
          };
        });

        console.log("Notes with colors:", midiNotes[0]);
        setNotes(midiNotes);
      };
      reader.readAsArrayBuffer(file);
    },
    [],
  );

  const updateKeyState = useCallback((key: string, isPressed: boolean) => {
    if (TARGET_KEYS.includes(key as KeyName)) {
      setKeyStates((prev) => ({ ...prev, [key]: isPressed }));
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!event.repeat) updateKeyState(event.key.toLowerCase(), true);
    },
    [updateKeyState],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => updateKeyState(event.key.toLowerCase(), false),
    [updateKeyState],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleNoteHit = useCallback((midi: number) => {
    const gridColumn = MIDI_TO_GRID_COLUMN[midi];
    const key = gridColumn ? GRID_COLUMN_TO_KEY[gridColumn] : undefined;
    if (key) {
      setKeyStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setKeyStates((prev) => ({ ...prev, [key]: false }));
      }, 100);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <input
          type="file"
          accept=".mid,.midi"
          onChange={handleFileChange}
          className="px-4 py-2 rounded bg-gray-700 text-white"
        />
      </div>

      {notes.length > 0 && (
        <div className="flex-1 flex justify-center">
          <div style={{ width: "540px" }}>
            <NoteRenderer
              notes={notes}
              border={725}
              speedFactor={1}
              onNoteHit={handleNoteHit}
            />
          </div>
        </div>
      )}

      <div className="flex justify-center pb-4">
        <Keyboard keyStates={keyStates} />
      </div>
    </div>
  );
}
