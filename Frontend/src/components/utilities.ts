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

export const convertMidiToNotes = (
  midiFile: ArrayBuffer,
  containerWidth = 880, // optional, for scaling x
): Note[] => {
  const midi = new Midi(midiFile);
  const notes: Note[] = [];
  const keyWidth = containerWidth / 88;
  const pianoStartMidi = 21;

  midi.tracks.forEach((track, trackIndex) => {
    track.notes.forEach((note, index) => {
      const velocity = Math.min(Math.max(note.velocity ?? 0.7, 0.05), 1);
      notes.push({
        id: `${trackIndex}-${index}`,
        midi: note.midi,
        startTime: note.time, // seconds
        duration: Math.max(note.duration, 0.1),
        velocity,
        track: trackIndex,
        x: (note.midi - pianoStartMidi) * keyWidth,
        width: keyWidth,
        color: `hsl(${(trackIndex * 60) % 360}, 80%, 50%)`,
      });
    });
  });

  return notes.sort((a, b) => a.startTime - b.startTime);
};
