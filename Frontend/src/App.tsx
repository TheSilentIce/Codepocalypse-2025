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

// MIDI to keyboard key mapping
// Maps your actual MIDI range to the 8 keys
const MIDI_TO_KEY: { [key: number]: KeyName } = {
  38: "a",
  50: "s",
  53: "d",
  57: "f",
  60: "j",
  62: "k",
  64: "l",
  // Add more mappings if needed
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
        const midiNotes = convertMidiToNotes(reader.result as ArrayBuffer);
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
    const key = MIDI_TO_KEY[midi];
    console.log("handleNoteHit:", {
      midi,
      mappedKey: key,
      allMappings: MIDI_TO_KEY,
    });
    if (key) {
      setKeyStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setKeyStates((prev) => ({ ...prev, [key]: false }));
      }, 100);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* --- MIDI Upload --- */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <input
          type="file"
          accept=".mid,.midi"
          onChange={handleFileChange}
          className="px-4 py-2 rounded bg-gray-700 text-white"
        />
      </div>

      {/* --- Falling notes (takes remaining space) --- */}
      {notes.length > 0 && (
        <div className="flex-1">
          <NoteRenderer
            notes={notes}
            border={550}
            speedFactor={1}
            onNoteHit={handleNoteHit}
          />
        </div>
      )}

      {/* --- Keyboard (pinned to bottom) --- */}
      <div className="flex justify-center pb-4">
        <Keyboard keyStates={keyStates} />
      </div>
    </div>
  );
}
