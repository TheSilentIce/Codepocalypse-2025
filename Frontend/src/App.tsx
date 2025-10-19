import { useState, useCallback, useEffect, useRef } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import { convertMidiToNotes } from "./components/utilities";
import { Keyboard } from "./components/keyboard/KeyboardTwo";
import type { KeyName } from "./components/keyboard/KeyboardTwo";
import axios from "axios";

interface KeyStateMap {
  [key: string]: boolean;
}

const TARGET_KEYS: KeyName[] = ["a", "s", "d", "f", "j", "k", "l", ";"];

const createInitialKeyState = (): KeyStateMap =>
  TARGET_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as KeyStateMap);

const MIDI_TO_GRID_COLUMN: { [key: number]: number } = (() => {
  const mapping: { [key: number]: number } = {};
  for (let midi = 0; midi < 128; midi++) {
    const keyIndex = midi % 8;
    const columns = [1, 2, 3, 4, 6, 7, 8, 9];
    mapping[midi] = columns[keyIndex];
  }
  return mapping;
})();

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
  const [containerHeight, setContainerHeight] = useState(0);
  const noteContainerRef = useRef<HTMLDivElement>(null);

  // Measure the actual note container height
  useEffect(() => {
    const updateHeight = () => {
      if (noteContainerRef.current) {
        setContainerHeight(noteContainerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [notes.length]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const formData = new FormData();
      if (file != undefined) {
        formData.append("theFile", file, file.name);
        axios.post("http://localhost:5000/api/upload");
      }
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let midiNotes = convertMidiToNotes(reader.result as ArrayBuffer, 880);

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
    } else {
      console.warn("No mapping for MIDI:", midi);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header with glassmorphism */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">♪</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              MIDI <span className="text-purple-400">Hero</span>
            </h1>
          </div>

          <label className="cursor-pointer group">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Upload MIDI</span>
            </div>
            <input
              type="file"
              accept=".mid,.midi"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-2xl">
            <div className="mb-8 relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <span className="text-6xl">🎹</span>
              </div>
              <div className="absolute inset-0 w-32 h-32 mx-auto bg-purple-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            </div>

            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
              Play Music Like a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Hero
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Upload your MIDI file and experience the magic of visual music
              gameplay. Hit the notes as they fall and feel the rhythm come
              alive.
            </p>

            <div className="flex justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Real-time gameplay</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>Visual feedback</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span>8-key system</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex justify-center pt-24 px-6">
          <div
            ref={noteContainerRef}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            style={{ width: "540px", height: "100%" }}
          >
            {/* Beautiful background gradient only */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-purple-900/30 to-slate-900/95 pointer-events-none z-0"></div>

            {/* Hit zone indicator at bottom */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-lg shadow-purple-500/50 pointer-events-none z-20"
              style={{ bottom: "5%" }}
            ></div>

            <div className="absolute inset-0 z-10">
              <NoteRenderer
                notes={notes}
                border={containerHeight * 0.95}
                speedFactor={1}
                onNoteHit={handleNoteHit}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center pb-8 relative z-10">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/10">
          <Keyboard keyStates={keyStates} />
        </div>
      </div>
    </div>
  );
}
