import { useRef, useState, useCallback } from "react";
import Soundfont from "soundfont-player";

export const useAudioPlayer = () => {
  const playerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize AudioContext and piano instrument
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

  /**
   * Play a note at a specific time with duration and velocity
   */
  const triggerAttack = useCallback(
    (midi: number, velocity = 0.7, duration = 1, startTime = 0) => {
      if (!playerRef.current || !audioContextRef.current) return;

      const ac = audioContextRef.current;
      const currentTime = ac.currentTime;

      playerRef.current.play(midi, currentTime + startTime, {
        gain: velocity,
        duration,
      });
    },
    [],
  );

  const stopAllNotes = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    playerRef.current = null;
    setIsInitialized(false);
  }, []);

  return {
    initAudio,
    triggerAttack,
    stopAllNotes,
    isInitialized,
  };
};
