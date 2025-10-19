import React, { type CSSProperties } from "react";

export type KeyName = "a" | "s" | "d" | "f" | "j" | "k" | "l" | ";";

interface KeyStateMap {
  [key: string]: boolean;
}

interface PianoKeyProps {
  keyName: KeyName | string;
  isPressed: boolean;
  gridColumn: number;
  color: string;
}

interface KeyboardProps {
  keyStates: KeyStateMap;
}

const TARGET_KEYS: KeyName[] = ["a", "s", "d", "f", "j", "k", "l", ";"];
const KEY_SIZE = 60;

// Grid column for each key (1-indexed for CSS Grid)
const KEY_GRID_COLUMNS: { [key: string]: number } = {
  a: 1,
  s: 2,
  d: 3,
  f: 4,
  j: 6,
  k: 7,
  l: 8,
  ";": 9,
};

const KEY_COLORS: { [key: string]: string } = {
  a: "#FF6B6B",
  s: "#4ECDC4",
  d: "#45B7D1",
  f: "#FFA07A",
  j: "#98D8C8",
  k: "#F7DC6F",
  l: "#BB8FCE",
  ";": "#85C1E2",
};

const PianoKey: React.FC<PianoKeyProps> = ({
  keyName,
  isPressed,
  gridColumn,
  color,
}) => {
  const isKeyActive = isPressed ? 1 : 0;

  const keyStyle: CSSProperties = {
    gridColumn,
    width: `${KEY_SIZE}px`,
    height: `${KEY_SIZE * 3.2}px`,
    backgroundColor: isKeyActive ? color : "rgb(255, 255, 255)",
    border: `2px solid ${color}`,
    borderRadius: "0 0 5px 5px",
    boxShadow: isKeyActive
      ? `inset 0 2px 5px rgba(0, 0, 0, 0.2), 0 0 15px ${color}`
      : "0 4px 6px rgba(0, 0, 0, 0.4)",
    cursor: "pointer",
    transition: "background-color 0.1s, box-shadow 0.1s, transform 0.1s",
    transform: isKeyActive ? "translateY(2px)" : "translateY(0)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: "10px",
    color: isKeyActive ? "white" : "#333",
    fontWeight: "bold",
    fontSize: "1rem",
  };

  const displayKey = keyName === ";" ? ";" : keyName.toUpperCase();

  return (
    <div
      className={`key ${isKeyActive ? "is-pressed" : ""}`}
      style={keyStyle}
      aria-label={`Key ${keyName}`}
    >
      {displayKey}
    </div>
  );
};

export const Keyboard: React.FC<KeyboardProps> = ({ keyStates }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(9, ${KEY_SIZE}px)`,
        gap: "0",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
      }}
    >
      {TARGET_KEYS.map((key) => (
        <PianoKey
          key={key}
          keyName={key}
          isPressed={keyStates[key]}
          gridColumn={KEY_GRID_COLUMNS[key]}
          color={KEY_COLORS[key]}
        />
      ))}
    </div>
  );
};

