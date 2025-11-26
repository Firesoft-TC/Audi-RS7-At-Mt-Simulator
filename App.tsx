
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import Assistant from './components/Assistant';
import { CarState, GameEvent, PhysicsConfig, ThemeMode, ClusterBackground } from './types';
import { RS7_CONFIG } from './constants';
import { getInstructorFeedback } from './services/geminiService';
import { engineAudio } from './services/audioService';

const App: React.FC = () => {
  // State
  const [car, setCar] = useState<CarState>({
    rpm: 0,
    speed: 0,
    gear: 0,
    clutchPosition: 0, // 0 = Up (Engaged), 1 = Down (Disengaged)
    throttlePosition: 0,
    brakePosition: 0,
    isEngineRunning: false,
    distanceTraveled: 0,
    isStalled: false,
    fuel: 100,
    laneSystemActive: false,
    isDrifting: false,
    engineTemp: 20, // Ambient temp Celsius
    transmissionMode: 'MT',
    accelTimer: 0,
    lastZeroToHundred: null,
    bestZeroToHundred: null,
    isTimingAccel: false,
    lastShiftTime: 0
  });

  const [instructorMsg, setInstructorMsg] = useState("Start the engine. Clutch in!");
  const [theme, setTheme] = useState<ThemeMode>('sport');
  const [clusterBg, setClusterBg] = useState<ClusterBackground>('none');
  
  // Refs for physics loop to avoid closure staleness
  const carRef = useRef(car);
  const themeRef = useRef(theme);
  const lastTimeRef = useRef<number>(0);
  const lastEventRef = useRef<GameEvent>(GameEvent.NONE);
  const laneOffsetRef = useRef<number>(0); // Used for lane drift calculation
  const driftWarningCooldownRef = useRef<number>(0);

  // Sync ref
  useEffect(() => {
    carRef.current = car;
  }, [car]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'sport') return 'race';
      if (prev === 'race') return 'eco';
      if (prev === 'eco') return 'retro';
      return 'sport';
    });
  };

  const toggleClusterBg = () => {
    setClusterBg(prev => {
      if (prev === 'none') return 'highway';
      if (prev === 'highway') return 'city';
      if (prev === 'city') return 'tunnel';
      return 'none';
    });
  };

  // Handle Inputs
  const handlePedalChange = (type: 'throttle' | 'brake' | 'clutch', value: number) => {
    setCar(prev => ({ ...prev, [`${type}Position`]: value }));
  };

  const handleGearChange = (newGear: number) => {
    setCar(prev => {
        // Allow shifting to Neutral always
        if (newGear === 0) {
           return { ...prev, gear: 0 };
        }

        // REQUIRE CLUTCH TO SHIFT INTO GEAR (Only in Manual Mode)
        // Clutch pedal must be pressed down (value > 0.8) to disengage engine from wheels
        const isClutchPressed = prev.clutchPosition > 0.8;
        
        // If engine is running and clutch is NOT pressed, GRIND gears and fail shift
        // If Automatic, we ignore this check as logic handles it
        if (!isClutchPressed && prev.isEngineRunning && prev.transmissionMode === 'MT') {
            lastEventRef.current = GameEvent.GRIND;
            return prev; // Return previous state (no gear change)
        }

        return { ...prev, gear: newGear };
    });
  };

  const toggleIgnition = () => {
    setCar(prev => {
      if (prev.fuel <= 0 && !prev.isEngineRunning) {
        lastEventRef.current = GameEvent.OUT_OF_FUEL;
        return prev;
      }
      
      const newState = !prev.isEngineRunning;
      if (newState) {
        engineAudio.init(); // Init audio context on user interaction
        lastEventRef.current = GameEvent.START_ENGINE;
        return { ...prev, isEngineRunning: true, isStalled: false, rpm: RS7_CONFIG.idleRpm };
      } else {
        lastEventRef.current = GameEvent.STOP_ENGINE;
        return { ...prev, isEngineRunning: false, rpm: 0 };
      }
    });
  };

  const handleRefuel = () => {
    setCar(prev => {
      if (Math.abs(prev.speed) > 1) return prev; // Cannot refuel while moving
      return { ...prev, fuel: 100 };
    });
  };

  const toggleLaneAssist = () => {
    setCar(prev => ({ ...prev, laneSystemActive: !prev.laneSystemActive }));
  };

  const toggleTransmission = () => {
    setCar(prev => {
        let next: CarState['transmissionMode'] = 'MT';
        if (prev.transmissionMode === 'MT') next = 'AT';
        else if (prev.transmissionMode === 'AT') next = 'DCT';
        else if (prev.transmissionMode === 'DCT') next = 'CVT';
        else next = 'MT';
        
        return { ...prev, transmissionMode: next };
    });
  }

  const startHorn = () => engineAudio.startHorn();
  const stopHorn = () => engineAudio.stopHorn();

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      // Gear shifting keys
      if (e.code === 'Digit1' || e.code === 'Numpad1') handleGearChange(1);
      else if (e.code === 'Digit2' || e.code === 'Numpad2') handleGearChange(2);
      else if (e.code === 'Digit3' || e.code === 'Numpad3') handleGearChange(3);
      else if (e.code === 'Digit4' || e.code === 'Numpad4') handleGearChange(4);
      else if (e.code === 'Digit5' || e.code === 'Numpad5') handleGearChange(5);
      else if (e.code === 'Digit6' || e.code === 'Numpad6') handleGearChange(6);
      else if (e.code === 'Digit7' || e.code === 'Numpad7') handleGearChange(7);
      else if (e.code === 'Digit8' || e.code === 'Numpad8') handleGearChange(8);
      else if (e.code === 'KeyR') handleGearChange(-1);
      else if (e.code === 'KeyN') handleGearChange(0);

      // Pedals (Instant press for keyboard)
      else if (e.code === 'ArrowUp') handlePedalChange('throttle', 1);
      else if (e.code === 'ArrowDown') handlePedalChange('brake', 1);
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') handlePedalChange('clutch', 1);
      
      // Horn
      else if (e.code === 'KeyH') startHorn();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowUp': handlePedalChange('throttle', 0); break;
        case 'ArrowDown': handlePedalChange('brake', 0); break;
        case 'ShiftLeft': case 'ShiftRight': handlePedalChange('clutch', 0); break;
        case 'KeyH': stopHorn(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Local Instructor Feedback Loop
  const checkInstructorFeedback = (currentState: CarState, event: GameEvent) => {
    if (event !== GameEvent.NONE) {
      const msg = getInstructorFeedback(currentState, event);
      setInstructorMsg(msg);
      lastEventRef.current = GameEvent.NONE;
    } 
  };

  // Physics Loop
  const updatePhysics = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const state = carRef.current;
    const currentTheme = themeRef.current;
    const isAuto = state.transmissionMode !== 'MT';
    
    // Clutch engagement: 1.0 (Pedal Up) to 0.0 (Pedal Down)
    let engagement = 1.0 - state.clutchPosition; 

    // Resistance
    const rollingResistance = 100;
    // Air Resistance tuned for top speed ~330 km/h
    const airResistance = (Math.abs(state.speed) * 1.5) + ((state.speed * state.speed) * 0.05);
    const totalDrag = rollingResistance + airResistance;

    // --- TRANSMISSION LOGIC SETUP ---
    let currentGearRatio = 0;
    const finalDrive = RS7_CONFIG.finalDrive;
    
    // For AT/DCT/MT, get standard ratio
    if (state.transmissionMode !== 'CVT' && state.gear !== 0) {
        // Fix: Use Index 0 for Reverse (-1), Index 1 for 1st, etc.
        // RS7_CONFIG.gearRatios: [3.2 (R), 4.71 (1), 3.14 (2), ...]
        const ratioIndex = state.gear === -1 ? 0 : state.gear;
        if (ratioIndex >= 0 && ratioIndex < RS7_CONFIG.gearRatios.length) {
             currentGearRatio = RS7_CONFIG.gearRatios[ratioIndex];
        } else {
             currentGearRatio = 1; // Fallback
        }
    }

    let newRpm = state.rpm;
    let newSpeed = state.speed;
    let newFuel = state.fuel;
    let newTemp = state.engineTemp;
    let engineRunning = state.isEngineRunning;
    let isDrifting = false;
    let newGear = state.gear;
    let newClutchPos = state.clutchPosition;
    let newLastShiftTime = state.lastShiftTime;

    // --- AUTOMATIC TRANSMISSION LOGIC (AT, DCT) ---
    if ((state.transmissionMode === 'AT' || state.transmissionMode === 'DCT') && engineRunning) {
        // Auto-Clutch with Smoothing (Fluid Coupling Simulation)
        if (state.gear !== 0) {
            
            const startSlipRpm = 800;
            const fullyEngagedRpm = 2200;
            
            if (newRpm <= startSlipRpm) {
                 newClutchPos = 1.0; 
            } else if (newRpm >= fullyEngagedRpm) {
                 newClutchPos = 0.0;
            } else {
                 const t = (newRpm - startSlipRpm) / (fullyEngagedRpm - startSlipRpm);
                 newClutchPos = 1.0 - t;
            }
            
            if (Math.abs(newSpeed) < 1 && state.brakePosition > 0.5) {
                newClutchPos = 1.0;
            }

            engagement = 1.0 - newClutchPos;
            
            // Shift Logic
            const shiftCooldown = state.transmissionMode === 'DCT' ? 200 : 500; 
            const timeSinceLastShift = time - state.lastShiftTime;

            if (timeSinceLastShift > shiftCooldown) {
                
                // --- MODE SPECIFIC SHIFT POINTS ---
                let upshiftRpm = 6000;
                let downshiftRpm = 3000;

                // Eco: Up @ 4000, Down @ 3000
                if (currentTheme === 'eco') { 
                    upshiftRpm = 4000; 
                    downshiftRpm = 3000; 
                } 
                // Sport: Up @ 6000, Down @ 4000
                else if (currentTheme === 'sport') { 
                    upshiftRpm = 6000; 
                    downshiftRpm = 4000; 
                } 
                // Race: Up @ Cutoff (Redline), Down @ 4500
                else if (currentTheme === 'race') { 
                    upshiftRpm = RS7_CONFIG.maxRpm - 50; 
                    downshiftRpm = 4500; 
                } 
                // Turbo (Retro): Up @ Cutoff (Redline), Down @ 5000
                else if (currentTheme === 'retro') { 
                    upshiftRpm = RS7_CONFIG.maxRpm - 50; 
                    downshiftRpm = 5000; 
                }
                
                // --- UPSHIFT LOGIC ---
                // Only upshift if we are not in the top gear (8)
                if (state.gear > 0 && state.gear < 8) {
                    if (newRpm >= upshiftRpm) {
                        newGear = state.gear + 1;
                        newLastShiftTime = time;
                        // Reduce RPM immediately to simulate the shift landing
                        // logic will catch up next frame but this prevents double-shifting or limiter bounce
                        const nextGearRatio = RS7_CONFIG.gearRatios[newGear];
                        newRpm = newRpm * (nextGearRatio / currentGearRatio);
                    }
                }
                
                // --- DOWNSHIFT LOGIC ---
                if (state.gear > 1) {
                     const nextGearRatio = RS7_CONFIG.gearRatios[state.gear - 1];
                     const predictedRpm = newRpm * (nextGearRatio / currentGearRatio);
                     
                     // Check if safe to downshift (prevent money shift) and check threshold
                     if (predictedRpm < RS7_CONFIG.maxRpm - 500 && newRpm < downshiftRpm) {
                        newGear = state.gear - 1;
                        newLastShiftTime = time;
                        newRpm = predictedRpm; // Snap RPM up
                     }
                }
            }
        }
    }

    // --- CVT LOGIC ---
    if (state.transmissionMode === 'CVT' && engineRunning) {
        if (state.gear !== 0) {
            newClutchPos = 0.0; 
            engagement = 1.0;
            const targetCvtRpm = Math.max(RS7_CONFIG.idleRpm, 800 + (state.throttlePosition * 6000));
            const rpmDiff = targetCvtRpm - state.rpm;
            newRpm += rpmDiff * dt * 2.0; 
            const speedMps = Math.max(1, Math.abs(state.speed) / 3.6);
            const wheelRpm = speedMps / (Math.PI * RS7_CONFIG.tireDiameter) * 60;
            let calculatedRatio = newRpm / (wheelRpm * finalDrive);
            calculatedRatio = Math.max(0.5, Math.min(5.0, calculatedRatio));
            currentGearRatio = calculatedRatio;
        }
    }


    // --- ACCELERATION TIMER (0-100 km/h) ---
    let newAccelTimer = state.accelTimer;
    let newIsTiming = state.isTimingAccel;
    let newLastTime = state.lastZeroToHundred;
    let newBestTime = state.bestZeroToHundred;

    if (Math.abs(newSpeed) < 2) {
        newAccelTimer = 0;
        newIsTiming = false;
    } else if (Math.abs(newSpeed) > 2 && !newIsTiming && newAccelTimer === 0) {
        newIsTiming = true;
    }

    if (newIsTiming) {
        newAccelTimer += dt;
        if (Math.abs(newSpeed) >= 100) {
            newIsTiming = false;
            newLastTime = newAccelTimer;
            if (newBestTime === null || newLastTime < newBestTime) {
                newBestTime = newLastTime;
            }
        }
    }

    // --- DRIVE MODES ---
    let powerMultiplier = 1.0;
    let audioVol = 1.0;

    if (currentTheme === 'eco') { powerMultiplier = 0.7; audioVol = 0.5; }
    else if (currentTheme === 'sport') { powerMultiplier = 1.0; audioVol = 0.8; }
    else if (currentTheme === 'race') { powerMultiplier = 1.3; audioVol = 1.2; }
    else if (currentTheme === 'retro') { powerMultiplier = 1.5; audioVol = 1.1; }

    // --- LANE ASSIST ---
    if (Math.abs(state.speed) > 30) {
        laneOffsetRef.current = Math.sin(time / 2000) * 1.2; 
        if (Math.abs(laneOffsetRef.current) > 0.8) {
            isDrifting = true;
            if (state.laneSystemActive && time - driftWarningCooldownRef.current > 1000) {
                engineAudio.playLaneDepartureBeep();
                driftWarningCooldownRef.current = time;
            }
        }
    }

    // --- ENGINE LOGIC ---
    let targetTemp = 90;
    let heatRate = 0.1;

    if (engineRunning) {
        targetTemp = 90 + Math.max(0, (state.rpm - 5000) / 100);
        heatRate = 0.5 + (state.throttlePosition * 1.0) + (state.rpm / 5000);
    }
    
    if (newTemp < targetTemp) newTemp += heatRate * dt * 2.0;
    else newTemp -= 0.2 * dt;

    if (!engineRunning) {
        newRpm = Math.max(0, state.rpm - (dt * 500));
    } else if (state.isStalled) {
        newRpm = 0;
    } else {
        const consumption = (0.01 + (state.throttlePosition * 0.1) + (state.rpm / 20000)) * dt;
        newFuel = Math.max(0, state.fuel - consumption);
        if (newFuel <= 0) {
          engineRunning = false;
          lastEventRef.current = GameEvent.OUT_OF_FUEL;
        }

        const nRpm = Math.max(0, state.rpm / RS7_CONFIG.maxRpm);
        const torqueCurve = 0.5 + (2 * nRpm) - (2 * nRpm * nRpm); 
        
        let engineTorqueBase = (state.throttlePosition * RS7_CONFIG.enginePower * 6500 * torqueCurve * powerMultiplier); 

        // Rev Limiter
        if (state.rpm >= RS7_CONFIG.maxRpm) {
            engineTorqueBase = -200; // Hard Cut
            lastEventRef.current = GameEvent.REDLINE;
        } else if (state.throttlePosition === 0 && state.rpm > RS7_CONFIG.idleRpm) {
             engineTorqueBase = -100; // Engine Braking
        }

        // Apply Torque Logic
        if (newGear === 0 || engagement < 0.05) {
            // Neutral / Clutch In
            let rpmTarget = state.throttlePosition > 0 ? RS7_CONFIG.maxRpm : RS7_CONFIG.idleRpm;
            let rpmChangeRate = state.throttlePosition > 0 ? (10000 * powerMultiplier) : 3000; 
            if (state.rpm < rpmTarget) newRpm = Math.min(rpmTarget, state.rpm + (rpmChangeRate * dt * state.throttlePosition));
            else newRpm = Math.max(rpmTarget, state.rpm - (rpmChangeRate * dt));
        } else {
            // In Gear
            const totalRatio = currentGearRatio * finalDrive;
            // Physical force
            const wheelTorque = engineTorqueBase * totalRatio;
            const tireRadius = RS7_CONFIG.tireDiameter / 2;
            let driveForce = wheelTorque / tireRadius;

            if (newGear === -1) driveForce = -driveForce;

            const direction = Math.sign(newSpeed);
            const dragForce = (direction === 0 ? 0 : direction) * totalDrag;

            const netDriveForce = driveForce - dragForce;
            const acceleration = netDriveForce / RS7_CONFIG.mass;
            newSpeed += acceleration * dt * 3.6;

            // CVT RPM is calculated differently (above), skip standard linking
            if (state.transmissionMode !== 'CVT') {
                const targetWheelRpm = Math.abs((newSpeed / 3.6) / (Math.PI * RS7_CONFIG.tireDiameter) * 60 * totalRatio);
                
                // Slip / Burnout Logic (Only for MT or hard launches)
                let effectiveEngagement = engagement;
                const rpmDelta = state.rpm - targetWheelRpm;

                // Simple slip model for launches
                if (state.transmissionMode === 'MT' && effectiveEngagement > 0.5 && rpmDelta > 2000 && state.throttlePosition > 0.7 && Math.abs(newGear) <= 2) {
                    effectiveEngagement = 0.05; 
                }

                const lockedRpm = (targetWheelRpm * effectiveEngagement) + (state.rpm * (1 - effectiveEngagement));
                
                if (effectiveEngagement < 0.95) {
                   const revUpRate = state.throttlePosition * 8000;
                   if (state.throttlePosition === 0) {
                       newRpm = Math.max(lockedRpm, state.rpm - (2500 * dt));
                   } else {
                       const flareTarget = Math.max(lockedRpm, state.rpm + (revUpRate * dt));
                       newRpm = (flareTarget * (1 - effectiveEngagement)) + (lockedRpm * effectiveEngagement);
                   }
                } else {
                    newRpm = lockedRpm;
                }

                // --- CRITICAL FIX: PHYSICAL SPEED LIMIT PER GEAR ---
                if (state.gear > 0 && effectiveEngagement > 0.9) {
                     const maxTheoreticalSpeed = (RS7_CONFIG.maxRpm * Math.PI * RS7_CONFIG.tireDiameter * 3.6) / (60 * currentGearRatio * finalDrive);
                     
                     if (Math.abs(newSpeed) > maxTheoreticalSpeed) {
                         newSpeed = Math.sign(newSpeed) * maxTheoreticalSpeed;
                         newRpm = RS7_CONFIG.maxRpm; 
                         lastEventRef.current = GameEvent.REDLINE;
                     }
                }
            }
        }
    }

    // --- BRAKING ---
    if (state.brakePosition > 0) {
        const brakeDecel = state.brakePosition * 40; 
        if (newSpeed > 0) {
            newSpeed -= brakeDecel * dt * 5; 
            if (newSpeed < 0) newSpeed = 0;
        } else if (newSpeed < 0) {
            newSpeed += brakeDecel * dt * 5;
            if (newSpeed > 0) newSpeed = 0;
        }
    } else if (!state.isEngineRunning && newGear === 0) {
         // Rolling resistance stop
         if (newSpeed > 0) newSpeed = Math.max(0, newSpeed - 1 * dt);
         if (newSpeed < 0) newSpeed = Math.min(0, newSpeed + 1 * dt);
    }

    // --- LIMITS & CLEANUP ---
    if (newRpm > RS7_CONFIG.maxRpm) {
        newRpm = RS7_CONFIG.maxRpm - (Math.random() * 50); 
    }
    
    // Global Limit increased to 330
    if (newSpeed > 330) newSpeed = 330;
    if (newSpeed < -60) newSpeed = -60;

    // Stall Logic (Disabled for Auto modes)
    let isStalled = state.isStalled;
    if (state.isEngineRunning && !state.isStalled && engagement > 0.8 && newGear !== 0 && state.transmissionMode === 'MT') {
        if (newRpm < 400 && Math.abs(newSpeed) < 5) {
             isStalled = true;
             lastEventRef.current = GameEvent.STALL;
             newRpm = 0;
             engineRunning = false;
        }
    }

    engineAudio.update(newRpm, state.throttlePosition, newSpeed, audioVol);

    const newState = {
        ...state,
        rpm: newRpm,
        speed: newSpeed,
        gear: newGear,
        clutchPosition: isAuto ? newClutchPos : state.clutchPosition,
        fuel: newFuel,
        engineTemp: newTemp,
        isStalled,
        isEngineRunning: engineRunning,
        distanceTraveled: state.distanceTraveled + (Math.abs(newSpeed) / 3.6 * dt),
        isDrifting,
        accelTimer: newAccelTimer,
        isTimingAccel: newIsTiming,
        lastZeroToHundred: newLastTime,
        bestZeroToHundred: newBestTime,
        lastShiftTime: newLastShiftTime
    };
    
    setCar(newState);
    
    if (Math.floor(time) % 20 === 0 || lastEventRef.current !== GameEvent.NONE) {
       checkInstructorFeedback(newState, lastEventRef.current);
    }
    
    requestAnimationFrame(updatePhysics);
  }, []);

  useEffect(() => {
    const rAF = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(rAF);
  }, [updatePhysics]);

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-between py-6 px-4 touch-none select-none">
      <Assistant message={instructorMsg} />
      
      {/* Windshield */}
      <div className="w-full max-w-5xl h-32 md:h-48 rounded-t-3xl bg-gradient-to-b from-sky-900 to-gray-800 relative overflow-hidden mb-[-20px] z-0 border-x-4 border-t-4 border-gray-800 opacity-80">
         <div className="absolute inset-0 flex justify-center items-end">
             <div className="w-20 h-full bg-gray-700 transform perspective-lg rotate-x-60 relative overflow-hidden">
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-2 bg-yellow-400 h-full"
                  style={{ 
                      backgroundImage: 'linear-gradient(to bottom, transparent 50%, #fbbf24 50%)',
                      backgroundSize: `100% ${Math.max(10, 200 - Math.abs(car.speed))}px`,
                      animation: car.speed !== 0 ? `moveRoad ${Math.max(0.1, 1000/Math.abs(car.speed || 1))}s linear infinite reverse` : 'none'
                  }}
                ></div>
             </div>
         </div>
         <div className="absolute top-1/2 w-full h-0.5 bg-black opacity-30"></div>
      </div>
      
      <div className="z-10 w-full flex justify-center">
         <Dashboard state={car} theme={theme} onToggleTheme={toggleTheme} clusterBg={clusterBg} onToggleClusterBg={toggleClusterBg} />
      </div>

      <Controls 
         throttle={car.throttlePosition} 
         brake={car.brakePosition} 
         clutch={car.clutchPosition} 
         gear={car.gear}
         fuel={car.fuel}
         laneActive={car.laneSystemActive}
         transmissionMode={car.transmissionMode}
         onPedalChange={handlePedalChange}
         onGearChange={handleGearChange}
         onIgnition={toggleIgnition}
         onRefuel={handleRefuel}
         onHornStart={startHorn}
         onHornStop={stopHorn}
         onToggleLaneAssist={toggleLaneAssist}
         onToggleTransmission={toggleTransmission}
         isEngineRunning={car.isEngineRunning}
         speed={car.speed}
      />
      
      <div className="text-gray-600 text-xs mt-4 font-mono text-center">
         <p>CONTROLS: MOUSE/TOUCH on Pedals | KEYBOARD: ARROWS (Gas/Brake) | SHIFT (Clutch) | 1-8 (Gears) | H (Horn)</p>
      </div>

      <style>{`
        @keyframes moveRoad {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
      `}</style>
    </div>
  );
};

export default App;
