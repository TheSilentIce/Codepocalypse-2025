import * as Tone from "tone";
import { useRef, useState, useCallback, useEffect } from "react";

export const useAudioPlayer = () => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create synth on mount
  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();

      synthRef.current.maxPolyphony = 12;
      synthRef.current.volume.value = -12;
      synthRef.current.set({
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 },
        oscillator: { type: "triangle" },
      });
    }

    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  // Initialize audio context (must be called on user interaction)
  const initAudio = useCallback(async () => {
    if (!isInitialized) {
      await Tone.start();
      setIsInitialized(true);
      // console.log("Audio initialized!");
    }
  }, [isInitialized]);

  // Trigger attack (note on)
  const triggerAttack = useCallback(
    (midi: number, velocity: number = 0.7) => {
      if (!synthRef.current || !isInitialized) return;
      const freq = Tone.Frequency(midi, "midi").toFrequency();
      synthRef.current.triggerAttack(freq, Tone.now(), velocity);
    },
    [isInitialized],
  );

  // Trigger release (note off)
  const triggerRelease = useCallback(
    (midi: number) => {
      if (!synthRef.current || !isInitialized) return;
      const freq = Tone.Frequency(midi, "midi").toFrequency();
      synthRef.current.triggerRelease(freq, Tone.now());
    },
    [isInitialized],
  );

  // Stop all notes
  const stopAllNotes = useCallback(() => {
    synthRef.current?.releaseAll();
  }, []);

  return {
    initAudio,
    triggerAttack,
    triggerRelease,
    stopAllNotes,
    isInitialized,
  };
};
