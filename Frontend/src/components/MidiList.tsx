import { useState, useEffect } from "react";
import { fetchMidiList, fetchMidiData, convertBackendMidiToNotes } from "./utilities";
import type { Note } from "./utilities";

interface MidiListProps {
  onMidiSelect: (notes: Note[], filename: string) => void;
}

export default function MidiList({ onMidiSelect }: MidiListProps) {
  const [midiFiles, setMidiFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadMidiList();
  }, []);

  const loadMidiList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMidiList();
      setMidiFiles(data.midi_files);
    } catch (err) {
      setError("Failed to load MIDI files");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMidiClick = async (filename: string) => {
    try {
      setSelectedFile(filename);
      const midiData = await fetchMidiData(filename);
      const notes = convertBackendMidiToNotes(midiData, 800);

      // Remap notes for the game's grid system
      const MIDI_TO_GRID_COLUMN: { [key: number]: number } = (() => {
        const mapping: { [key: number]: number } = {};
        for (let midi = 0; midi < 128; midi++) {
          const keyIndex = midi % 8;
          const columns = [1, 2, 3, 4, 6, 7, 8, 9];
          mapping[midi] = columns[keyIndex];
        }
        return mapping;
      })();

      const GRID_COLUMN_TO_KEY: { [key: number]: string } = {
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

      const remappedNotes = notes.map((note) => {
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

      onMidiSelect(remappedNotes, filename);
    } catch (err) {
      console.error(`Failed to load MIDI: ${filename}`, err);
      setError(`Failed to load ${filename}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-white">
        Loading MIDI files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-white">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadMidiList}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white max-h-96 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Available MIDI Files</h2>
      {midiFiles.length === 0 ? (
        <p className="text-gray-400">No MIDI files available</p>
      ) : (
        <ul className="space-y-2">
          {midiFiles.map((filename) => (
            <li key={filename}>
              <button
                onClick={() => handleMidiClick(filename)}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  selectedFile === filename
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {filename}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
