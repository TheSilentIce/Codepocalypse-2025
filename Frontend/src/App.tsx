import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import {
  generateChordNotes,
  generateMelodyNotes,
  generateMockNotes,
  type Note,
} from "./components/utilities";
import "./App.css";

import Keyboard from "./components/keyboard/Keyboard";
import NoteRenderer from "./components/Note/NoteRenderer";
function App() {
  const notes: Note[] = generateChordNotes(30, 1000);
  // const notes: Note[] = generateMockNotes(50, 1000);
  // const notes: Note[] = generateMelodyNotes(30, 1000);

  return (
    <div className="h-screen w-screen bg-black">
      <NoteRenderer notes={notes} border={300} />
      {/* <Keyboard /> */}
    </div>
  );
}

export default App;
