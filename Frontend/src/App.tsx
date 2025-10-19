import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import type { Note } from "./components/utilities";
import "./App.css";
import Keys from "./components/keyboard/Keys";
import Keyboard from "./components/keyboard/Keyboard";
import NoteRenderer from "./components/Note/NoteRenderer";
function App() {
  const notes: Note[] = [];
  const keys = [60, 62, 64, 65, 67, 69, 71]; // some MIDI notes
  let currentTime = 0;

  const lastEndTimes: Record<number, number> = {}; // track last end per key

  for (let i = 0; i < 20; i++) {
    const midi = keys[Math.floor(Math.random() * keys.length)];
    const duration = 0.8 + Math.random() * 1.2; // 0.8–2 sec
    const lastEnd = lastEndTimes[midi] ?? 0;
    const startTime = Math.max(currentTime, lastEnd); // ensure no overlap on same key
    const color = ["aqua", "lime", "green", "orange", "blue", "pink", "yellow"][
      i % 7
    ];
    const x = 50 + (midi - 60) * 30;
    const width = 15 + Math.floor(Math.random() * 10);

    notes.push({
      id: `n${i + 1}`,
      midi,
      startTime,
      duration,
      color,
      x,
      width,
    });

    lastEndTimes[midi] = startTime + duration; // update last end for this key
    currentTime = startTime + Math.random() * 0.5; // small spacing before next note
  }

  return (
    <div className="h-screen w-screen bg-black">
      <NoteRenderer notes={notes} border={400} />
      <Keys x={0} y={0} size={100} isPressed={0}></Keys>
    </div>
  );
}

export default App;
