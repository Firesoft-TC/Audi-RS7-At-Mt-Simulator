import { CarState, GameEvent } from "../types";

// This service is now a local "Digital Instructor" and does not use the Gemini API.
// It analyzes telemetry locally to provide instant feedback.

export const getInstructorFeedback = (state: CarState, lastEvent: GameEvent): string => {
  // 1. Handle Critical Events immediately
  switch (lastEvent) {
    case GameEvent.STALL:
      return "You stalled! Clutch in and restart the engine.";
    case GameEvent.GRIND:
      return "CRUNCH! Push the clutch all the way down before shifting.";
    case GameEvent.REDLINE:
      return "SHIFT UP! You're hitting the rev limiter!";
    case GameEvent.START_ENGINE:
      return "Engine ready. Press clutch to engage 1st gear.";
    case GameEvent.STOP_ENGINE:
      return "Ignition off. Parking brake set.";
    default:
      break;
  }

  // 2. Analyze Driving State
  
  if (!state.isEngineRunning) {
    return "Press 'Start Engine' to begin.";
  }

  // Idling
  if (state.speed < 2 && state.rpm < 1000) {
    if (state.gear !== 0 && state.clutchPosition < 0.5) {
      return "Watch out! Clutch in or Neutral, or you'll stall.";
    }
    return "Ready to roll. Ease off the clutch slowly.";
  }

  // Moving logic
  if (state.speed > 5) {
    // Lugging the engine (Low RPM, High Gear, High Throttle)
    if (state.rpm < 1300 && state.gear > 1 && state.throttlePosition > 0.5) {
      return "Downshift! You're lugging the engine.";
    }

    // High RPM cruising
    if (state.rpm > 5500 && state.gear < 6) {
      return "High RPM. Shift up to save fuel.";
    }
    
    // Smooth cruising
    if (state.rpm > 2000 && state.rpm < 4000) {
      return "Good RPM range. Keep it smooth.";
    }
    
    // Speeding
    if (state.speed > 120 && state.speed < 200) {
      return "Getting fast. Watch your braking distances.";
    }
    if (state.speed >= 200) {
      return "Eyes on the road! Too fast!";
    }
  }

  return "Focus on clutch control and rev matching.";
};
