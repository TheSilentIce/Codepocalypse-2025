import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import type { Note } from "./components/utilities";
import "./App.css";

import Keyboard from "./components/keyboard/Keyboard";
import NoteRenderer from "./components/Note/NoteRenderer";
function App() {
  const notes: Note[] = [
    {
      id: "1",
      midi: 60,
      startTime: 0,
      duration: 1,
    },
    {
      id: "4",
      midi: 60,
      startTime: 0.5,
      duration: 1,
    },
    {
      id: "n2",
      midi: 64, // E4
      startTime: 0.5,
      duration: 1.5,
      color: "green",
      x: 100,
      width: 20,
    },
    {
      id: "n3",
      midi: 67, // G4
      startTime: 1,
      duration: 2,
      color: "blue",
      x: 150,
      width: 20,
    },
  ];

  return (
    <div className="h-screen w-screen bg-black">
      <NoteRenderer notes={notes} border={400} />
    </div>
  );
}

export default App;
