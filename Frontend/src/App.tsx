import { useCallback, useEffect, useState } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import {
  convertMidiToNotes,
  fetchMidiList,
  fetchMidiData,
  convertBackendMidiToNotes,
  uploadMidiToBackend
} from "./components/utilities";
import { useAudioPlayer } from "./components/audio/AudioPlayer";

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
  const [midiFiles, setMidiFiles] = useState<string[]>([]);
  const [loadingMidis, setLoadingMidis] = useState(false);
  const [showFileList, setShowFileList] = useState(true);

  // Initialize audio player at App level
  const { triggerAttack, triggerRelease, stopAllNotes, initAudio, isInitialized } = useAudioPlayer();

  // Upload MIDI file to backend
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload to backend
      const uploadedFilename = await uploadMidiToBackend(file);

      // Refresh the MIDI file list
      const files = await fetchMidiList();
      setMidiFiles(files);

      // Auto-load the uploaded file
      const midiData = await fetchMidiData(uploadedFilename);
      const midiNotes = convertBackendMidiToNotes(midiData);
      setNotes(midiNotes);

      // Hide file list
      setShowFileList(false);
    } catch (error) {
      console.error('Error uploading MIDI file:', error);
    }

    // Reset the input so the same file can be uploaded again
    event.target.value = '';
  };

  // Fetch MIDI list from backend on component mount
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
      setShowFileList(false);
    } catch (error) {
      console.error(`Failed to load MIDI file ${filename}:`, error);
    }
  };

  // Handle back button click
  const handleBack = () => {
    stopAllNotes();
    setNotes([]);
    setShowFileList(true);
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
      {/* File list and upload controls - only show when showFileList is true */}
      {showFileList && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
          <input
            type="file"
            accept=".mid,.midi"
            onChange={onFileChange}
            className="px-4 py-2 rounded bg-gray-700 text-white"
          />

          {/* MIDI file list from backend */}
          <div className="bg-gray-800 rounded-lg p-4 min-w-[300px]">
            <h2 className="text-white text-lg font-semibold mb-3">Available MIDI Files</h2>
            {loadingMidis ? (
              <p className="text-gray-400">Loading...</p>
            ) : midiFiles.length > 0 ? (
              <div className="flex flex-col gap-2">
                {midiFiles.map((filename) => (
                  <button
                    key={filename}
                    onClick={() => handleMidiClick(filename)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors duration-200"
                  >
                    {filename}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No MIDI files available</p>
            )}
          </div>
        </div>
      )}

      {/* Back button - only show when file list is hidden */}
      {!showFileList && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            ← Back to File List
          </button>
        </div>
      )}

      {notes.length > 0 && (
        <NoteRenderer
          notes={notes}
          border={300}
          triggerAttack={triggerAttack}
          triggerRelease={triggerRelease}
          initAudio={initAudio}
          isInitialized={isInitialized}
        />
      )}
      <Keyboard keyStates={keyStates} />
    </div>
  );
}

export default App;
