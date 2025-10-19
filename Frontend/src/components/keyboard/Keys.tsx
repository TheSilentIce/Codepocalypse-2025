import React from 'react';

/**
 * Interface defining the expected properties for the Key component.
 */
interface KeyProps {
  /** The absolute x-coordinate (in pixels) for the key's position. */
  x: number;
  /** The absolute y-coordinate (in pixels) for the key's position. */
  y: number;
  /** Object containing width and height of the key. */
  size: {
    width: number;
    height: number;
  };
  /** The state of the key (true if pressed, false otherwise). */
  isPressed: boolean;
  /** The base color of the key ('white' or 'black'). */
  color?: 'white' | 'black';
  /** Optional handler for when the key is interacted with. */
  onKeyAction?: () => void;
}

/**
 * A component representing a single piano key with absolute positioning and state.
 */
const Key: React.FC<KeyProps> = ({
  x,
  y,
  size,
  isPressed,
  color = 'white',
  onKeyAction,
}) => {
  const isBlackKey = color === 'black';
  const baseColor = isBlackKey ? '#000000' : '#FFFFFF';
  const pressedColor = isBlackKey ? '#333333' : '#CCCCCC';

  const keyStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    backgroundColor: isPressed ? pressedColor : baseColor,
    border: isBlackKey ? '1px solid #000000' : '1px solid #333333',
    borderRadius: '0 0 5px 5px',
    boxShadow: isPressed
      ? `inset 0 2px 5px rgba(0, 0, 0, 0.2)`
      : '0 4px 6px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    transition: 'background-color 0.1s, box-shadow 0.1s, transform 0.1s',
    zIndex: isBlackKey ? 10 : 5,
    transform: isPressed ? 'translateY(1px)' : 'translateY(0)',
  };

  return (
    <div
      className={`piano-key piano-key--${color} ${isPressed ? 'is-pressed' : ''}`}
      style={keyStyle}
      onClick={onKeyAction}
    >
      {/* Key content goes here */}
    </div>
  );
};

// Export the component using the desired import name (Keys) for the parent file.
export default Key;