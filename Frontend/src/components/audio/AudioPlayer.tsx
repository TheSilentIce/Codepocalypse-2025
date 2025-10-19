import { useRef, useState, useCallback, useEffect } from "react";
import Soundfont from "soundfont-player";

export const useAudioPlayer = () => {
  const playerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize AudioContext and piano player
  const initAudio = useCallback(async () => {
    if (!isInitialized) {
      const ac = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = ac;
      playerRef.current = await Soundfont.instrument(
        ac,
        "acoustic_grand_piano",
      );
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const triggerAttack = useCallback((midi: number, velocity: number = 0.7) => {
    if (!playerRef.current || !audioContextRef.current) return;
    const duration = 2; // fallback duration in seconds
    playerRef.current.play(midi, audioContextRef.current.currentTime, {
      gain: velocity,
      duration,
    });
  }, []);

  const triggerRelease = useCallback((_midi: number) => {
    // Soundfont-player auto releases notes after duration
  }, []);

  const stopAllNotes = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    playerRef.current = null;
    setIsInitialized(false);
  }, []);

  return {
    initAudio,
    triggerAttack,
    triggerRelease,
    stopAllNotes,
    isInitialized,
  };
};
