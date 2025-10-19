import { Midi } from "@tonejs/midi";

export interface Note {
  id: string;
  midi: number;
  startTime: number;
  duration: number;
  velocity?: number;
  color?: string;
  track?: number;
  isActive?: boolean;
  x?: number;
  width?: number;
}

export const convertMidiToNotes = (midiFile: ArrayBuffer): Note[] => {
  const midi = new Midi(midiFile);
  const notes: Note[] = [];
  const keyWidth = 20;
  const pianoStartMidi = 21;

  midi.tracks.forEach((track, trackIndex) => {
    track.notes.forEach((note, index) => {
      notes.push({
        id: `${trackIndex}-${index}`,
        midi: note.midi,
        startTime: note.time,
        duration: note.duration,
        velocity: note.velocity,
        track: trackIndex,
        x: (note.midi - pianoStartMidi) * keyWidth,
        width: keyWidth,
        color: `hsl(${(trackIndex * 60) % 360}, 80%, 50%)`,
      });
    });
  });

  return notes;
};
