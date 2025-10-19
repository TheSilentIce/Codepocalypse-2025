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

// Backend MIDI data structure
export interface BackendMidiNote {
  note: number;
  time: number;
  duration: number;
  velocity: number;
}

export interface BackendMidiTrack {
  track_name: string;
  notes: BackendMidiNote[];
}

export interface BackendMidiData {
  filename: string;
  tempo: number;
  time_signature: string;
  duration: number;
  ticks_per_beat: number;
  tracks: BackendMidiTrack[];
}

export const handleFileUpload = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const notes = convertMidiToNotes(reader.result as ArrayBuffer);
      console.log(notes);
      // Now you can pass the `notes` array to your NoteRenderer component
    };
    reader.readAsArrayBuffer(file);
  }
};

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
        isActive: false,
        x: (note.midi - pianoStartMidi) * keyWidth,
        width: keyWidth,
        color: `hsl(${(trackIndex * 60) % 360}, 80%, 50%)`,
      });
    });
  });

  return notes;
};

// MIDI note range for piano (21-108 is standard 88-key piano)
const MIDI_MIN = 21;
const MIDI_MAX = 108;

// Neon color palette
const NEON_COLORS = [
  "#00ffff", // cyan
  "#ff00ff", // magenta
  "#00ff00", // lime
  "#ffff00", // yellow
  "#ff0080", // hot pink
  "#0080ff", // electric blue
  "#ff8000", // orange
  "#80ff00", // chartreuse
  "#8000ff", // purple
  "#ff0040", // red-pink
];

/**
 * Generates mock notes that mimic backend data
 * @param n - Number of notes to generate
 * @param containerWidth - Width of the piano/container for x positioning
 * @returns Array of mock Note objects
 */
export function generateMockNotes(
  n: number,
  containerWidth: number = 800,
): Note[] {
  const notes: Note[] = [];
  const noteWidth = containerWidth / 88; // Approximate width per piano key

  for (let i = 0; i < n; i++) {
    const midi =
      Math.floor(Math.random() * (MIDI_MAX - MIDI_MIN + 1)) + MIDI_MIN;
    const duration = 0.5 + Math.random() * 2.5; // 0.5 to 3 seconds
    const velocity = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    const startTime = i * 0.3 + Math.random() * 0.5; // Staggered start times
    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];

    // Calculate x position based on MIDI note (piano key position)
    const keyIndex = midi - MIDI_MIN;
    const x = keyIndex * noteWidth;

    notes.push({
      id: `note-${i}-${Date.now()}`,
      midi,
      startTime,
      duration,
      velocity,
      color,
      track: Math.floor(Math.random() * 3), // 0-2 tracks
      isActive: false,
      x,
      width: noteWidth * (0.8 + Math.random() * 0.4), // Slight width variation
    });
  }

  // Sort by startTime to simulate sequential playback
  return notes.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Generates a melody-like sequence of notes (more musical)
 */
export function generateMelodyNotes(
  n: number,
  containerWidth: number = 800,
): Note[] {
  const notes: Note[] = [];
  const noteWidth = containerWidth / 88;

  // Common scale degrees (C major scale)
  const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 to C5

  for (let i = 0; i < n; i++) {
    const scaleIndex = Math.floor(Math.random() * scale.length);
    const midi = scale[scaleIndex] + (Math.floor(Math.random() * 3) - 1) * 12; // ±1 octave
    const duration = [0.5, 1, 1.5, 2][Math.floor(Math.random() * 4)];
    const velocity = 0.6 + Math.random() * 0.4;
    const startTime = i * 0.4;
    const color = NEON_COLORS[scaleIndex % NEON_COLORS.length];

    const keyIndex = midi - MIDI_MIN;
    const x = keyIndex * noteWidth;

    notes.push({
      id: `melody-${i}-${Date.now()}`,
      midi,
      startTime,
      duration,
      velocity,
      color,
      track: 0,
      isActive: false,
      x,
      width: noteWidth * 0.9,
    });
  }

  return notes;
}

/**
 * Generates a chord progression
 */
export function generateChordNotes(
  numChords: number,
  containerWidth: number = 800,
): Note[] {
  const notes: Note[] = [];
  const noteWidth = containerWidth / 88;

  // Common chord progressions in C major
  const chords = [
    [60, 64, 67], // C major
    [65, 69, 72], // F major
    [67, 71, 74], // G major
    [57, 60, 64], // A minor
  ];

  for (let i = 0; i < numChords; i++) {
    const chord = chords[i % chords.length];
    const startTime = i * 2;
    const duration = 1.5 + Math.random() * 0.5;
    const color = NEON_COLORS[i % NEON_COLORS.length];

    chord.forEach((midi, noteIndex) => {
      const keyIndex = midi - MIDI_MIN;
      const x = keyIndex * noteWidth;

      notes.push({
        id: `chord-${i}-${noteIndex}-${Date.now()}`,
        midi,
        startTime,
        duration,
        velocity: 0.7,
        color,
        track: 0,
        isActive: false,
        x,
        width: noteWidth * 0.9,
      });
    });
  }

  return notes.sort((a, b) => a.startTime - b.startTime);
}

// Example usage:
// const mockNotes = generateMockNotes(20, 800);
// const melodyNotes = generateMelodyNotes(15, 800);
// const chordNotes = generateChordNotes(8, 800);

// Backend API URL
const API_BASE_URL = "http://localhost:5000";

/**
 * Fetches the list of available MIDI files from the backend
 * @returns Promise<string[]> - Array of MIDI filenames (without extensions)
 */
export async function fetchMidiList(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/midis`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching MIDI list:", error);
    throw error;
  }
}

/**
 * Fetches MIDI data from the backend for a specific file
 * @param filename - Name of the MIDI file (without extension)
 * @returns Promise<BackendMidiData> - Parsed MIDI data from backend
 */
export async function fetchMidiData(filename: string): Promise<BackendMidiData> {
  try {
    // Try with .mid extension first, then .midi
    let response = await fetch(`${API_BASE_URL}/api/midi/${filename}.mid`);
    if (!response.ok) {
      response = await fetch(`${API_BASE_URL}/api/midi/${filename}.midi`);
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching MIDI data for ${filename}:`, error);
    throw error;
  }
}

/**
 * Uploads a MIDI file to the backend
 * @param file - MIDI file to upload
 * @returns Promise<string> - Uploaded filename (without extension)
 */
export async function uploadMidiToBackend(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Remove extension from filename to match the format used by fetchMidiList
    const filenameWithoutExt = data.filename.replace(/\.(mid|midi)$/i, '');
    return filenameWithoutExt;
  } catch (error) {
    console.error('Error uploading MIDI file:', error);
    throw error;
  }
}

/**
 * Converts backend MIDI data format to frontend Note[] format
 * @param backendData - MIDI data from backend API
 * @param containerWidth - Width of the piano/container for x positioning
 * @returns Note[] - Array of notes ready for rendering
 */
export function convertBackendMidiToNotes(
  backendData: BackendMidiData,
  containerWidth: number = 800,
): Note[] {
  const notes: Note[] = [];
  const keyWidth = containerWidth / 88; // Standard 88-key piano
  const pianoStartMidi = 21; // A0

  backendData.tracks.forEach((track, trackIndex) => {
    track.notes.forEach((note, noteIndex) => {
      const midi = note.note;
      const keyIndex = midi - pianoStartMidi;
      const x = keyIndex * keyWidth;
      const color = NEON_COLORS[trackIndex % NEON_COLORS.length];

      notes.push({
        id: `${trackIndex}-${noteIndex}`,
        midi: midi,
        startTime: note.time,
        duration: note.duration,
        velocity: note.velocity / 127, // Convert from 0-127 to 0-1
        track: trackIndex,
        isActive: false,
        x: x,
        width: keyWidth,
        color: color,
      });
    });
  });

  return notes;
}
