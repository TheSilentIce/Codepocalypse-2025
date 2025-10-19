import { useState } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import { convertMidiToNotes } from "./components/utilities";

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
    </div>
  );
}

export default App;
