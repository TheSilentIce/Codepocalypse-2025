import { useCallback, useEffect, useState } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import { convertMidiToNotes } from "./components/utilities";

import { Keyboard } from "./components/keyboard/KeyboardTwo";
type KeyName = "a" | "s" | "d" | "f" | "j" | "k" | "l" | ";";

// Type for the state object holding the pressed status of all target keys
interface KeyStateMap {
  [key: string]: boolean;
}

// Props for the individual PianoKey component
interface PianoKeyProps {
  x: number;
  y: number;
  size: number;
  keyName: KeyName | string;
  isPressed: boolean;
}

// Props for the Keyboard component
interface KeyboardProps {
  keyStates: KeyStateMap;
}
// ------------------------

// Define the keys we are interested in tracking
const TARGET_KEYS: KeyName[] = ["a", "s", "d", "f", "j", "k", "l", ";"];

// --- Configuration for the Piano Key Layout ---
const KEY_SIZE = 60; // Base width of a key in pixels
const KEY_Y_OFFSET = 50; // Y offset from the top for all keys

// Map keys to their horizontal position index, skipping one index for the gap
const KEY_LAYOUT: { [key: string]: number } = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
  j: 5, // Gap at index 4
  k: 6,
  l: 7,
  ";": 8,
};
// ---------------------------------------------

// Initial state object where all keys are set to false (not pressed)
const createInitialKeyState = (): KeyStateMap => {
  return TARGET_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as KeyStateMap); // Type assertion needed for reduce initial value
};

function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  // Wrap handleFileUpload to also update state
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const midiNotes = convertMidiToNotes(reader.result as ArrayBuffer);
      setNotes(midiNotes);
    };
    reader.readAsArrayBuffer(file);
  };
  const [keyStates, setKeyStates] = useState<KeyStateMap>(
    createInitialKeyState,
  );

  // Function to handle key state updates
  const updateKeyState = useCallback((key: string, isPressed: boolean) => {
    if (TARGET_KEYS.includes(key as KeyName)) {
      setKeyStates((prevStates) => {
        if (prevStates[key] === isPressed) {
          return prevStates;
        }
        return {
          ...prevStates,
          [key]: isPressed,
        };
      });
    }
  }, []);

  // Event handler for keydown
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!event.repeat) {
        updateKeyState(event.key.toLowerCase(), true);
      }
    },
    [updateKeyState],
  );

  // Event handler for keyup
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      updateKeyState(event.key.toLowerCase(), false);
    },
    [updateKeyState],
  );

  // useEffect to set up and clean up global event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  return (
    <div className="h-screen w-screen bg-black">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <input
          type="file"
          accept=".mid,.midi"
          onChange={onFileChange}
          className="px-4 py-2 rounded bg-gray-700 text-white"
        />
      </div>

      {notes.length > 0 && <NoteRenderer notes={notes} border={300} />}
      <Keyboard keyStates={keyStates} />
    </div>
  );
}

export default App;
