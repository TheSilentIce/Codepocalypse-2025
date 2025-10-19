import { useCallback, useEffect, useState } from "react";
import NoteRenderer from "./components/Note/NoteRenderer";
import type { Note } from "./components/utilities";
import {
  convertMidiToNotes,
  fetchMidiList,
  fetchMidiData,
  convertBackendMidiToNotes,
  uploadMidiToBackend,
  uploadFileToBackend,
  getProcessingStatus,
  getProcessingResult,
  checkMidiUpdates,
  type ProcessingStatus,
  type ProcessingResult,
  type MidiListResponse
} from "./components/utilities";
import { useAudioPlayer } from "./components/audio/AudioPlayer";

import { Keyboard } from "./components/keyboard/KeyboardTwo";
type KeyName = "a" | "s" | "d" | "f" | "j" | "k" | "l" | ";";

// Type for the state object holding the pressed status of all target keys
interface KeyStateMap {
  [key: string]: boolean;
}

// Props for the individual PianoKey component
interface PianoKeyProps {
  x: number;
  y: number;
  size: number;
  keyName: KeyName | string;
  isPressed: boolean;
}

// Props for the Keyboard component
interface KeyboardProps {
  keyStates: KeyStateMap;
}
// ------------------------

// Define the keys we are interested in tracking
const TARGET_KEYS: KeyName[] = ["a", "s", "d", "f", "j", "k", "l", ";"];

// --- Configuration for the Piano Key Layout ---
const KEY_SIZE = 60; // Base width of a key in pixels
const KEY_Y_OFFSET = 50; // Y offset from the top for all keys

// Map keys to their horizontal position index, skipping one index for the gap
const KEY_LAYOUT: { [key: string]: number } = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
  j: 5, // Gap at index 4
  k: 6,
  l: 7,
  ";": 8,
};
// ---------------------------------------------

// Initial state object where all keys are set to false (not pressed)
const createInitialKeyState = (): KeyStateMap => {
  return TARGET_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as KeyStateMap); // Type assertion needed for reduce initial value
};

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [midiFiles, setMidiFiles] = useState<string[]>([]);
  const [loadingMidis, setLoadingMidis] = useState(false);
  const [showFileList, setShowFileList] = useState(true);
  
  // Processing status states
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMidiUpdate, setLastMidiUpdate] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Initialize audio player at App level
  const { triggerAttack, triggerRelease, stopAllNotes, initAudio, isInitialized } = useAudioPlayer();

  // Upload file to backend (MIDI or audio)
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload to backend
      const uploadResponse = await uploadFileToBackend(file);
      
      // Check if it's a MIDI file or audio file
      const isMidi = file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi');
      
      if (isMidi) {
        // For MIDI files, load immediately
        const uploadedFilename = uploadResponse.filename.replace(/\.(mid|midi)$/i, '');
        
        // Refresh the MIDI file list
        const midiListResponse = await fetchMidiList();
        setMidiFiles(midiListResponse.midi_files);
        setLastMidiUpdate(midiListResponse.last_update);

        // Auto-load the uploaded file
        const midiData = await fetchMidiData(uploadedFilename);
        const midiNotes = convertBackendMidiToNotes(midiData);
        setNotes(midiNotes);

        // Hide file list
        setShowFileList(false);
      } else {
        // For audio files, start processing
        setIsProcessing(true);
        setProcessingStatus({
          status: 'running',
          message: 'Processing started in background...'
        });
        
        // Refresh the MIDI file list to show current state
        const midiListResponse = await fetchMidiList();
        setMidiFiles(midiListResponse.midi_files);
        setLastMidiUpdate(midiListResponse.last_update);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsProcessing(false);
      setProcessingStatus({
        status: 'failed',
        message: 'Upload failed. Please try again.'
      });
      
      // Show error notification
      setNotification({
        type: 'error',
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Reset the input so the same file can be uploaded again
    event.target.value = '';
  };

  // Fetch MIDI list from backend on component mount
  useEffect(() => {
    const loadMidiList = async () => {
      setLoadingMidis(true);
      try {
        const midiListResponse = await fetchMidiList();
        setMidiFiles(midiListResponse.midi_files);
        setLastMidiUpdate(midiListResponse.last_update);
      } catch (error) {
        console.error("Failed to fetch MIDI list:", error);
      } finally {
        setLoadingMidis(false);
      }
    };

    loadMidiList();
  }, []);

  // Polling for processing status and MIDI updates
  useEffect(() => {
    if (!isProcessing) return;

    const pollInterval = setInterval(async () => {
      try {
        // Check processing status
        const status = await getProcessingStatus();
        setProcessingStatus(status);

        if (status.status === 'idle') {
          // Processing completed, check for results
          const result = await getProcessingResult();
          if (result.status === 'completed' && result.midi_filename) {
            // Processing successful, refresh MIDI list
            const midiListResponse = await fetchMidiList();
            setMidiFiles(midiListResponse.midi_files);
            setLastMidiUpdate(midiListResponse.last_update);
            
            // Auto-load the new MIDI file
            const midiData = await fetchMidiData(result.midi_filename);
            const midiNotes = convertBackendMidiToNotes(midiData);
            setNotes(midiNotes);
            setShowFileList(false);
            
            setIsProcessing(false);
            setProcessingStatus({
              status: 'completed',
              message: 'Processing completed successfully!'
            });
            
            // Show success notification
            setNotification({
              type: 'success',
              message: `Successfully converted ${result.original_filename} to MIDI!`
            });
          } else if (result.status === 'failed') {
            setIsProcessing(false);
            setProcessingStatus({
              status: 'failed',
              message: result.error || 'Processing failed'
            });
            
            // Show error notification
            setNotification({
              type: 'error',
              message: `Processing failed: ${result.error || 'Unknown error'}`
            });
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isProcessing]);

  // Polling for MIDI list updates (when not processing)
  useEffect(() => {
    if (isProcessing || !lastMidiUpdate) return;

    const pollInterval = setInterval(async () => {
      try {
        const updateCheck = await checkMidiUpdates(lastMidiUpdate);
        if (updateCheck.has_updates) {
          // MIDI list updated, refresh it
          const midiListResponse = await fetchMidiList();
          setMidiFiles(midiListResponse.midi_files);
          setLastMidiUpdate(midiListResponse.last_update);
        }
      } catch (error) {
        console.error('Error checking MIDI updates:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isProcessing, lastMidiUpdate]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle clicking a MIDI file from the backend list
  const handleMidiClick = async (filename: string) => {
    try {
      const midiData = await fetchMidiData(filename);
      const midiNotes = convertBackendMidiToNotes(midiData);
      setNotes(midiNotes);
      setShowFileList(false);
    } catch (error) {
      console.error(`Failed to load MIDI file ${filename}:`, error);
    }
  };

  // Handle back button click
  const handleBack = () => {
    stopAllNotes();
    setNotes([]);
    setShowFileList(true);
  };

  const [keyStates, setKeyStates] = useState<KeyStateMap>(
    createInitialKeyState,
  );

  // Function to handle key state updates
  const updateKeyState = useCallback((key: string, isPressed: boolean) => {
    if (TARGET_KEYS.includes(key as KeyName)) {
      setKeyStates((prevStates) => {
        if (prevStates[key] === isPressed) {
          return prevStates;
        }
        return {
          ...prevStates,
          [key]: isPressed,
        };
      });
    }
  }, []);

  // Event handler for keydown
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!event.repeat) {
        updateKeyState(event.key.toLowerCase(), true);
      }
    },
    [updateKeyState],
  );

  // Event handler for keyup
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      updateKeyState(event.key.toLowerCase(), false);
    },
    [updateKeyState],
  );

  // useEffect to set up and clean up global event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  return (
    <div className="h-screen w-screen bg-black">
      {/* Notification */}
      {notification && (
        <div className="absolute top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-900 border border-green-600 text-green-200' 
              : 'bg-red-900 border border-red-600 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-lg hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File list and upload controls - only show when showFileList is true */}
      {showFileList && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
          {/* File upload input */}
          <div className="flex flex-col items-center gap-2">
            <input
              type="file"
              accept=".mid,.midi,.mp3,.wav,.ogg,.flac,.m4a,.aac,.wma,.aiff"
              onChange={onFileChange}
              className="px-4 py-2 rounded bg-gray-700 text-white"
            />
            <p className="text-gray-400 text-sm text-center">
              Upload MIDI files to play immediately, or audio files to convert to MIDI
            </p>
          </div>

          {/* Processing status */}
          {isProcessing && processingStatus && (
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 min-w-[300px]">
              <h3 className="text-yellow-200 text-lg font-semibold mb-2">Processing Audio</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-200"></div>
                <p className="text-yellow-200">{processingStatus.message}</p>
              </div>
              {processingStatus.original_filename && (
                <p className="text-yellow-300 text-sm">
                  Processing: {processingStatus.original_filename}
                </p>
              )}
            </div>
          )}

          {/* MIDI file list from backend */}
          <div className="bg-gray-800 rounded-lg p-4 min-w-[300px]">
            <h2 className="text-white text-lg font-semibold mb-3">
              Available MIDI Files ({midiFiles.length})
            </h2>
            {loadingMidis ? (
              <p className="text-gray-400">Loading...</p>
            ) : midiFiles.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {midiFiles.map((filename) => (
                  <button
                    key={filename}
                    onClick={() => handleMidiClick(filename)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors duration-200 text-left"
                  >
                    {filename}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No MIDI files available</p>
            )}
          </div>
        </div>
      )}

      {/* Back button - only show when file list is hidden */}
      {!showFileList && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            ← Back to File List
          </button>
        </div>
      )}

      {notes.length > 0 && (
        <NoteRenderer
          notes={notes}
          border={300}
          triggerAttack={triggerAttack}
          triggerRelease={triggerRelease}
          initAudio={initAudio}
          isInitialized={isInitialized}
        />
      )}
      <Keyboard keyStates={keyStates} />
    </div>
  );
}

export default App;
