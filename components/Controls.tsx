
import React, { useRef } from 'react';

interface ControlsProps {
  throttle: number;
  brake: number;
  clutch: number;
  gear: number;
  fuel: number;
  speed: number;
  laneActive: boolean;
  isAutomatic: boolean;
  onGearChange: (gear: number) => void;
  onPedalChange: (type: 'throttle' | 'brake' | 'clutch', value: number) => void;
  onIgnition: () => void;
  onRefuel: () => void;
  onHornStart: () => void;
  onHornStop: () => void;
  onToggleLaneAssist: () => void;
  onToggleTransmission: () => void;
  isEngineRunning: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  throttle, brake, clutch, gear, fuel, speed, laneActive, isAutomatic,
  onGearChange, onPedalChange, onIgnition, onRefuel, onHornStart, onHornStop, onToggleLaneAssist, onToggleTransmission,
  isEngineRunning 
}) => {
  
  const handleGearClick = (g: number) => {
    onGearChange(g);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 flex flex-col md:flex-row gap-8 items-end justify-center">
      
      {/* Shifter & Ignition */}
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col items-center w-full md:w-1/3">
        <h3 className="text-gray-400 mb-4 font-digital uppercase tracking-widest text-sm">Transmission</h3>
        <div className={`grid grid-cols-3 gap-3 w-full max-w-[200px] transition-opacity duration-300 ${isAutomatic ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <button 
             onClick={() => handleGearClick(-1)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === -1 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             R
          </button>
          <div className="col-span-1"></div>
          <button 
             onClick={() => handleGearClick(1)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 1 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             1
          </button>
          
          <button 
             onClick={() => handleGearClick(2)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 2 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             2
          </button>
          <button 
             onClick={() => handleGearClick(0)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 0 ? 'bg-green-900 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             N
          </button>
          <button 
             onClick={() => handleGearClick(3)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 3 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             3
          </button>

          <button 
             onClick={() => handleGearClick(4)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 4 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             4
          </button>
          <div className="col-span-1"></div>
          <button 
             onClick={() => handleGearClick(5)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 5 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             5
          </button>
           <button 
             onClick={() => handleGearClick(6)}
             className={`h-14 rounded font-bold border-2 transition-all ${gear === 6 ? 'bg-red-900 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
             6
          </button>
        </div>
        
        <button 
          onClick={onIgnition}
          className={`mt-6 w-full py-4 rounded-full font-bold uppercase tracking-widest transition-all ${isEngineRunning ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
        >
          {isEngineRunning ? 'Stop Engine' : 'Start Engine'}
        </button>

        {/* Extras Row */}
        <div className="flex gap-2 w-full mt-4">
             {/* Horn */}
            <button 
                onMouseDown={onHornStart}
                onMouseUp={onHornStop}
                onMouseLeave={onHornStop}
                className="flex-1 bg-gray-800 border border-gray-600 text-gray-300 py-2 rounded hover:bg-gray-700 active:bg-white active:text-black transition-colors font-bold text-[10px]"
            >
                HORN
            </button>
            {/* Lane Assist */}
             <button 
                onClick={onToggleLaneAssist}
                className={`flex-1 border text-gray-300 py-2 rounded transition-colors font-bold text-[10px] ${laneActive ? 'bg-green-900 border-green-500 text-green-100' : 'bg-gray-800 border-gray-600'}`}
            >
                RADAR
            </button>
             {/* Auto Toggle */}
             <button 
                onClick={onToggleTransmission}
                className={`flex-1 border text-gray-300 py-2 rounded transition-colors font-bold text-[10px] ${isAutomatic ? 'bg-blue-900 border-blue-500 text-blue-100' : 'bg-gray-800 border-gray-600'}`}
            >
                {isAutomatic ? 'AUTO' : 'MANUAL'}
            </button>
        </div>
        
        {fuel < 100 && Math.abs(speed) < 2 && (
             <button 
              onClick={onRefuel}
              className="mt-3 text-xs text-yellow-500 border border-yellow-500 rounded px-3 py-1 hover:bg-yellow-500 hover:text-black transition-colors"
            >
              Refuel Tank
            </button>
        )}
      </div>

      {/* Pedals */}
      <div className="flex-1 bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl w-full">
         <h3 className="text-gray-400 mb-8 font-digital uppercase tracking-widest text-sm text-center">Pedals</h3>
         <div className="flex justify-around items-end h-80 px-4 gap-4 select-none touch-none">
            
            {/* Clutch */}
            <div className={`flex flex-col items-center h-full w-24 group relative transition-opacity duration-300 ${isAutomatic ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="flex-1 w-full relative bg-gray-800 rounded-lg overflow-hidden border border-gray-600 mb-2">
                <div 
                   className="absolute bottom-0 w-full bg-blue-600 transition-transform duration-75 ease-linear rounded-t-sm"
                   style={{ height: '100%', transform: `translateY(${100 - (clutch * 100)}%)` }}
                ></div>
              </div>
              <input 
                 type="range" min="0" max="1" step="0.01" value={clutch}
                 onChange={(e) => onPedalChange('clutch', parseFloat(e.target.value))}
                 className="absolute inset-0 w-full h-[calc(100%-40px)] opacity-0 cursor-pointer z-10"
                 style={{ touchAction: 'none' }}
              />
              <span className="text-lg font-mono text-blue-400 font-bold">{Math.round(clutch * 100)}%</span>
              <span className="text-xs font-bold text-gray-400 group-hover:text-blue-400 transition-colors pointer-events-none">CLUTCH</span>
            </div>

            {/* Brake */}
            <div className="flex flex-col items-center h-full w-24 group relative">
               <div className="flex-1 w-full relative bg-gray-800 rounded-lg overflow-hidden border border-gray-600 mb-2">
                <div 
                   className="absolute bottom-0 w-full bg-red-600 transition-transform duration-75 ease-linear rounded-t-sm"
                   style={{ height: '100%', transform: `translateY(${100 - (brake * 100)}%)` }}
                ></div>
              </div>
              <input 
                 type="range" min="0" max="1" step="0.01" value={brake}
                 onChange={(e) => onPedalChange('brake', parseFloat(e.target.value))}
                 className="absolute inset-0 w-full h-[calc(100%-40px)] opacity-0 cursor-pointer z-10"
                 style={{ touchAction: 'none' }}
              />
              <span className="text-lg font-mono text-red-400 font-bold">{Math.round(brake * 100)}%</span>
              <span className="text-xs font-bold text-gray-400 group-hover:text-red-400 transition-colors pointer-events-none">BRAKE</span>
            </div>

            {/* Throttle */}
            <div className="flex flex-col items-center h-full w-24 group relative">
               <div className="flex-1 w-full relative bg-gray-800 rounded-lg overflow-hidden border border-gray-600 mb-2">
                <div 
                   className="absolute bottom-0 w-full bg-green-500 transition-transform duration-75 ease-linear rounded-t-sm"
                   style={{ height: '100%', transform: `translateY(${100 - (throttle * 100)}%)` }}
                ></div>
              </div>
              <input 
                 type="range" min="0" max="1" step="0.01" value={throttle}
                 onChange={(e) => onPedalChange('throttle', parseFloat(e.target.value))}
                 className="absolute inset-0 w-full h-[calc(100%-40px)] opacity-0 cursor-pointer z-10"
                 style={{ touchAction: 'none' }}
              />
              <span className="text-lg font-mono text-green-400 font-bold">{Math.round(throttle * 100)}%</span>
              <span className="text-xs font-bold text-gray-400 group-hover:text-green-400 transition-colors pointer-events-none">GAS</span>
            </div>

         </div>
      </div>
    </div>
  );
};

export default Controls;