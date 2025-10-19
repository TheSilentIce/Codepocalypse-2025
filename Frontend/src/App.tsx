import { useState, useCallback, useEffect, useRef } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import { Keyboard } from "./components/keyboard/KeyboardTwo";
import type { KeyName } from "./components/keyboard/KeyboardTwo";
import MidiList from "./components/MidiList";
import axios from "axios";
import {
  convertMidiToNotes,
  fetchMidiList,
  fetchMidiData,
  convertBackendMidiToNotes
} from "./components/utilities";
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
// Maps all 128 MIDI notes to the 8 keyboard keys
const MIDI_TO_GRID_COLUMN: { [key: number]: number } = (() => {
  const mapping: { [key: number]: number } = {};
  for (let midi = 0; midi < 128; midi++) {
    // Cycle through columns 1-9 (skipping 5 for the gap)
    const keyIndex = midi % 8; // 0-7
    const columns = [1, 2, 3, 4, 6, 7, 8, 9];
    mapping[midi] = columns[keyIndex];
  }
  return mapping;
})();

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
  const [midiFiles, setMidiFiles] = useState<string[]>([]);
  const [loadingMidis, setLoadingMidis] = useState(false);
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
        let midiNotes = convertMidiToNotes(reader.result as ArrayBuffer);

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

        setNotes(midiNotes);
      };
      reader.readAsArrayBuffer(file);
    },
    [],
  );
useEffect(() => {
    const loadMidiList = async () => {
      setLoadingMidis(true);
      try {
        const files = await fetchMidiList();
        setMidiFiles(files);
      } catch (error) {
        console.error("Failed to fetch MIDI list:", error);
      } finally {
        setLoadingMidis(false);
      }
    };

    loadMidiList();
  }, []);

  // Handle clicking a MIDI file from the backend list
  const handleMidiClick = async (filename: string) => {
    try {
      const midiData = await fetchMidiData(filename);
      const midiNotes = convertBackendMidiToNotes(midiData);
      setNotes(midiNotes);
    } catch (error) {
      console.error(`Failed to load MIDI file ${filename}:`, error);
    }
  };
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

  const handleMidiSelect = useCallback((selectedNotes: Note[], filename: string) => {
    console.log(`Loading MIDI: ${filename}`);
    setNotes(selectedNotes);
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

      <div className="absolute top-4 left-4 z-50 w-80">
        <MidiList onMidiSelect={handleMidiSelect} />
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
