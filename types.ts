
export interface CarState {
  rpm: number;
  speed: number;
  gear: number; // 0 = Neutral, -1 = Reverse, 1-8 = Forward (For CVT, 1 is Drive)
  clutchPosition: number; // 0.0 (fully engaged/up) to 1.0 (fully disengaged/down)
  throttlePosition: number; // 0.0 to 1.0
  brakePosition: number; // 0.0 to 1.0
  isEngineRunning: boolean;
  distanceTraveled: number;
  isStalled: boolean;
  fuel: number; // 0 to 100
  laneSystemActive: boolean;
  isDrifting: boolean; // True if car is crossing lines
  engineTemp: number; // Degrees Celsius
  
  // New Features
  transmissionMode: 'MT' | 'AT' | 'DCT' | 'CVT';
  accelTimer: number; // Current timer value in seconds
  lastZeroToHundred: number | null; // Last 0-100 time
  bestZeroToHundred: number | null; // Best 0-100 time
  isTimingAccel: boolean; // If currently timing a run
  
  // Logic helpers
  lastShiftTime: number; // Timestamp of last automatic shift to prevent skipping
}

export interface PhysicsConfig {
  idleRpm: number;
  maxRpm: number;
  gearRatios: number[]; // Index 0 = Reverse, 1 = 1st, etc.
  finalDrive: number;
  tireDiameter: number; // meters
  mass: number; // kg
  brakingPower: number;
  enginePower: number;
}

export enum GameEvent {
  NONE,
  STALL,
  GRIND,
  REDLINE,
  PERFECT_SHIFT,
  START_ENGINE,
  STOP_ENGINE,
  OUT_OF_FUEL
}

export type ThemeMode = 'sport' | 'race' | 'eco' | 'retro';
export type ClusterBackground = 'none' | 'highway' | 'city' | 'tunnel';
