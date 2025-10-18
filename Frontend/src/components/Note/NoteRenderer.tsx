import { motion } from "motion/react";
import type { Note } from "../utilities";

//notes - array that holds notes
//border - y line that notes will disappear at
interface RendererProps {
  notes: Note[];
  border: number;
}

function NoteRenderer({ notes, border }: RendererProps) {
  return (
    <>
      <div className="w-full relative h-[400px] overflow-hidden">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            style={{
              position: "absolute",
              left: note.x ?? 0,
              width: note.width ?? 20,
              height: note.duration * 1000, // keep visual note length
              backgroundColor: note.color ?? "blue",
            }}
            initial={{ y: 0 }}
            animate={{ y: border }} // all notes end at same Y
            transition={{
              duration: note.duration, // optional: scale speed by note duration
              ease: "linear",
            }}
          />
        ))}
      </div>
    </>
  );
}

export default NoteRenderer;
