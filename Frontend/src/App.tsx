import { useState, useCallback } from "react";
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

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [keyStates, setKeyStates] = useState<KeyStateMap>(
    createInitialKeyState,
  );

  // --- Handle MIDI file upload ---
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

  // --- Keyboard handling ---
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

  // Attach global listeners
  useState(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  });

  return (
    <div className="h-screen w-screen bg-black">
      {/* --- MIDI Upload --- */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <input
          type="file"
          accept=".mid,.midi"
          onChange={handleFileChange}
          className="px-4 py-2 rounded bg-gray-700 text-white"
        />
      </div>

      {/* --- Falling notes --- */}
      {notes.length > 0 && (
        <NoteRenderer notes={notes} border={300} speedFactor={1} />
      )}

      {/* --- Keyboard --- */}
      <Keyboard keyStates={keyStates} />
    </div>
  );
}
