export interface Key {
    x: number,
    y: number,
    size: number,
    isPressed: number
}
export default function Keys({x, y, size, isPressed} : Key) {
    const keyStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size * 3.2}px`,
    backgroundColor: 'rgb(255,255,255)',
    border:'1px solid #333333', // Distinct border for white keys
    borderRadius: '0 0 5px 5px', // Rounded bottom
    boxShadow: isPressed
      ? `inset 0 2px 5px rgba(0, 0, 0, 0.2)`
      : '0 4px 6px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    transition: 'background-color 0.1s, box-shadow 0.1s, transform 0.1s',
    transform: isPressed ? 'translateY(1px)' : 'translateY(0)', // Visual press effect
  };

  return (
    <div
      className={`key ${isPressed ? 'is-pressed' : ''}`}
      style={keyStyle}
    >
      {/* Note: In a real application, you'd handle complex keyboard/MIDI events 
          and touch interactions in the parent component to manage the isPressed state. */}
    </div>
  );
}