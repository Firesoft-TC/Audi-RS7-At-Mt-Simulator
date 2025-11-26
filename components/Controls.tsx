
import React, { useRef } from 'react';

interface ControlsProps {
  throttle: number;
  brake: number;
  clutch: number;
  gear: number;
  fuel: number;
  speed: number;
  laneActive: boolean;
  transmissionMode: 'MT' | 'AT' | 'DCT' | 'CVT';
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

// Reusable Pedal Component for precise Touch/Mouse control
const Pedal: React.FC<{
  type: 'throttle' | 'brake' | 'clutch';
  value: number;
  color: string;
  label: string;
  disabled?: boolean;
  onChange: (type: 'throttle' | 'brake' | 'clutch', val: number) => void;
}> = ({ type, value, color, label, disabled, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);

  const calculateValue = (clientY: number) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    // Calculate percentage based on height. 
    // Bottom of box is 0.0, Top of box is 1.0 (Visualizing "Pressing Forward")
    let percentage = (rect.bottom - clientY) / rect.height;
    return Math.max(0, Math.min(1, percentage));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    // Capture pointer to track movement even outside the element
    e.currentTarget.setPointerCapture(e.pointerId);
    const newVal = calculateValue(e.clientY);
    onChange(type, newVal);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const newVal = calculateValue(e.clientY);
    onChange(type, newVal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      // Optional: Reset if needed, but for pedals we typically leave them where they are 
      // or user lets go. Real pedals snap back, simulated ones might sticky or snap back depending on preference.
      // Here we assume "foot off pedal" = 0, except maybe for throttle cruising. 
      // For now, let's auto-return to 0 for simplicity if user lifts finger, mimicking a real spring.
      if (!disabled) {
          onChange(type, 0);
      }
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
  };

  // Determine colors based on type
  const barColor = type === 'clutch' ? 'bg-blue-600' : type === 'brake' ? 'bg-red-600' : 'bg-green-500';
  const textColor = type === 'clutch' ? 'text-blue-400' : type === 'brake' ? 'text-red-400' : 'text-green-400';
  const borderColor = type === 'clutch' ? 'group-active:border-blue-500' : type === 'brake' ? 'group-active:border-red-500' : 'group-active:border-green-500';

  return (
    <div 
      ref={ref}
      className={`relative flex flex-col items-center h-full w-24 group select-none touch-none ${disabled ? 'opacity-20 grayscale pointer-events-none' : 'cursor-pointer'}`}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Safety release
    >
      <div className={`flex-1 w-full relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 mb-2 transition-colors ${borderColor}`}>
        {/* Fill Bar */}
        <div 
           className={`absolute bottom-0 w-full ${barColor} transition-transform duration-75 ease-out rounded-t-sm`}
           style={{ height: '100%', transform: `translateY(${100 - (value * 100)}%)` }}
        ></div>
        
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
      </div>
      
      {/* Numeric Display */}
      <span className={`text-lg font-mono font-bold ${textColor}`}>{Math.round(value * 100)}%</span>
      <span className={`text-xs font-bold text-gray-400 group-hover:text-white transition-colors`}>{label}</span>
    </div>
  );
};

const Controls: React.FC<ControlsProps> = ({ 
  throttle, brake, clutch, gear, fuel, speed, laneActive, transmissionMode,
  onGearChange, onPedalChange, onIgnition, onRefuel, onHornStart, onHornStop, onToggleLaneAssist, onToggleTransmission,
  isEngineRunning 
}) => {
  
  const handleGearClick = (g: number) => {
    onGearChange(g);
  };

  const isAuto = transmissionMode !== 'MT';
  
  // Helper for gear button styling
  const getGearBtnClass = (g: number) => {
      const isActive = gear === g;
      let base = "h-12 rounded font-bold border-2 transition-all flex items-center justify-center text-lg ";
      if (isActive) {
          if (g === 0) return base + "bg-green-900 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]";
          if (g === -1) return base + "bg-red-900 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]";
          return base + "bg-blue-900 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]";
      }
      return base + "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white";
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 flex flex-col md:flex-row gap-8 items-end justify-center pb-8">
      
      {/* Shifter & Ignition */}
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col items-center w-full md:w-1/3">
        <h3 className="text-gray-400 mb-4 font-digital uppercase tracking-widest text-sm">Transmission</h3>
        
        {/* Shifter Grid */}
        <div className={`grid grid-cols-3 gap-2 w-full transition-opacity duration-300 ${isAuto ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
           {/* Row 1 */}
           <button onClick={() => handleGearClick(1)} className={getGearBtnClass(1)}>1</button>
           <button onClick={() => handleGearClick(2)} className={getGearBtnClass(2)}>2</button>
           <button onClick={() => handleGearClick(3)} className={getGearBtnClass(3)}>3</button>

           {/* Row 2 */}
           <button onClick={() => handleGearClick(4)} className={getGearBtnClass(4)}>4</button>
           <button onClick={() => handleGearClick(5)} className={getGearBtnClass(5)}>5</button>
           <button onClick={() => handleGearClick(6)} className={getGearBtnClass(6)}>6</button>

           {/* Row 3 */}
           <button onClick={() => handleGearClick(7)} className={getGearBtnClass(7)}>7</button>
           <button onClick={() => handleGearClick(8)} className={getGearBtnClass(8)}>8</button>
           <button onClick={() => handleGearClick(-1)} className={getGearBtnClass(-1)}>R</button>
           
           {/* Row 4 */}
           <button onClick={() => handleGearClick(0)} className={`col-span-3 ${getGearBtnClass(0)}`}>N</button>
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
                onTouchStart={onHornStart}
                onTouchEnd={onHornStop}
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
                className={`flex-1 border text-gray-300 py-2 rounded transition-colors font-bold text-[10px] ${transmissionMode !== 'MT' ? 'bg-blue-900 border-blue-500 text-blue-100' : 'bg-gray-800 border-gray-600'}`}
            >
                {transmissionMode}
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
         <div className="flex justify-around items-end h-80 px-4 gap-4">
            
            {/* Clutch */}
            <Pedal 
              type="clutch" 
              value={clutch} 
              color="bg-blue-600" 
              label="CLUTCH"
              disabled={isAuto} 
              onChange={onPedalChange}
            />

            {/* Brake */}
            <Pedal 
              type="brake" 
              value={brake} 
              color="bg-red-600" 
              label="BRAKE"
              onChange={onPedalChange}
            />

            {/* Throttle */}
            <Pedal 
              type="throttle" 
              value={throttle} 
              color="bg-green-500" 
              label="GAS"
              onChange={onPedalChange}
            />

         </div>
      </div>
    </div>
  );
};

export default Controls;
