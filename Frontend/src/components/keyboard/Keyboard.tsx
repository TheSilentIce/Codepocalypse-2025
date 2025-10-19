import React, { useState, useEffect, useCallback, type CSSProperties } from 'react';

// --- Type Definitions ---
type KeyName = 'a' | 's' | 'd' | 'f' | 'j' | 'k' | 'l' | ';';

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
const TARGET_KEYS: KeyName[] = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

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
  ';': 8,
};
// ---------------------------------------------

// Initial state object where all keys are set to false (not pressed)
const createInitialKeyState = (): KeyStateMap => {
  return TARGET_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as KeyStateMap); // Type assertion needed for reduce initial value
};

// --- PianoKey Component: Renders a single white piano key ---
const PianoKey: React.FC<PianoKeyProps> = ({ x, y, size, keyName, isPressed }) => {
  // Translate the boolean isPressed state to a number (0 or 1) for logic consistency
  const isKeyActive = isPressed ? 1 : 0;
  
  const keyStyle: CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size * 3.2}px`,
    backgroundColor: isKeyActive ? 'rgb(240, 240, 240)' : 'rgb(255, 255, 255)',
    border: '1px solid #333333',
    borderRadius: '0 0 5px 5px',
    boxShadow: isKeyActive
      ? `inset 0 2px 5px rgba(0, 0, 0, 0.2)`
      : '0 4px 6px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    transition: 'background-color 0.1s, box-shadow 0.1s, transform 0.1s',
    transform: isKeyActive ? 'translateY(2px)' : 'translateY(0)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: '10px',
    color: '#333',
    fontWeight: 'bold',
    fontSize: '1rem',
    zIndex: 10,
  };
  
  const displayKey = keyName === ';' ? ';' : keyName.toUpperCase();

  return (
    <div
      className={`key ${isKeyActive ? 'is-pressed' : ''}`}
      style={keyStyle}
      aria-label={`Key ${keyName}`}
    >
      {displayKey}
    </div>
  );
};

// --- Keyboard Component: Renders the entire layout using PianoKey ---
const Keyboard: React.FC<KeyboardProps> = ({ keyStates }) => {
  // Calculate total width for the wrapper based on the layout
  const totalWidth = (Object.keys(KEY_LAYOUT).length + 1) * KEY_SIZE;

  return (
    <div 
      className="relative bg-gray-700 rounded-lg shadow-2xl p-4 border border-gray-600"
      // Set the dimensions of the keyboard container
      style={{ width: `${totalWidth}px`, height: `${KEY_SIZE * 3.2 + KEY_Y_OFFSET * 2}px` }}
    >
      {/* Map over the target keys and render a PianoKey for each */}
      {TARGET_KEYS.map(key => {
        const positionIndex = KEY_LAYOUT[key];
        // Calculate horizontal position
        const xPos = positionIndex * KEY_SIZE;
        
        return (
          <PianoKey
            key={key}
            keyName={key}
            x={xPos}
            y={KEY_Y_OFFSET}
            size={KEY_SIZE}
            // Pass the current pressed state from the parent App component
            isPressed={keyStates[key]}
          />
        );
      })}
    </div>
  );
};