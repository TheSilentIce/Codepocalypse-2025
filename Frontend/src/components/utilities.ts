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
