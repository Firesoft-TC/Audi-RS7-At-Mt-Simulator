
import { PhysicsConfig } from './types';

// Audi RS7 Specs (Approximate for Simulation)
export const RS7_CONFIG: PhysicsConfig = {
  idleRpm: 800,
  maxRpm: 7200,
  // R, 1, 2, 3, 4, 5, 6, 7, 8
  gearRatios: [3.2, 4.71, 3.14, 2.11, 1.67, 1.28, 1.00, 0.84, 0.67], 
  finalDrive: 3.07,
  tireDiameter: 0.7, // ~21 inch wheels + tires
  mass: 2065, // kg
  brakingPower: 0.8, // Coefficient for braking logic
  enginePower: 0.195, // Increased from 0.15 to allow 330km/h top speed
};
