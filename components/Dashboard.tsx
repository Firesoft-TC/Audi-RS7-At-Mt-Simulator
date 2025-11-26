
import React from 'react';
import { CarState, ThemeMode, ClusterBackground } from '../types';

interface DashboardProps {
  state: CarState;
  theme: ThemeMode;
  clusterBg: ClusterBackground;
  onToggleTheme: () => void;
  onToggleClusterBg: () => void;
}

const WarningIcon: React.FC<{ active: boolean; color: string; path: string; label?: string; blink?: boolean }> = ({ active, color, path, blink }) => (
    <div className={`w-8 h-8 flex items-center justify-center transition-opacity duration-300 ${active ? `opacity-100 ${color} ${blink ? 'animate-pulse' : ''}` : 'opacity-10'}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full fill-current drop-shadow-[0_0_5px_currentColor]">
            <path d={path} />
        </svg>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ state, theme, clusterBg, onToggleTheme, onToggleClusterBg }) => {
  // --- TACHOMETER MATH ---
  const sweepAngle = 270;
  
  // Needle Rotation:
  // Visual range: -135deg (0 RPM) to +135deg (Max RPM)
  const rpmRatio = Math.min(state.rpm / 8000, 1);
  const needleAngle = -135 + (rpmRatio * sweepAngle);

  // Helper to create arc path
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // The colored RPM bar should go from -135 to needleAngle
  const arcPath = describeArc(50, 50, 42, -135, needleAngle);

  // --- GENERATE TICKS & NUMBERS ---
  // We want numbers 0 to 8 spaced evenly around the 270 degree arc
  const renderTicks = () => {
    const ticks = [];
    const totalTicks = 9; // 0 to 8
    
    for (let i = 0; i < totalTicks; i++) {
      // Angle in degrees relative to the needle's coordinate system (-135 to 135)
      const tickAngleDeg = -135 + (i / (totalTicks - 1)) * 270;
      const tickAngleRad = (tickAngleDeg - 90) * (Math.PI / 180);

      // Position for the Number
      const textRadius = 34; // Closer to center than the edge
      const tx = 50 + textRadius * Math.cos(tickAngleRad);
      const ty = 50 + textRadius * Math.sin(tickAngleRad);

      // Position for the Tick Mark
      const innerR = 40;
      const outerR = 45;
      const x1 = 50 + innerR * Math.cos(tickAngleRad);
      const y1 = 50 + innerR * Math.sin(tickAngleRad);
      const x2 = 50 + outerR * Math.cos(tickAngleRad);
      const y2 = 50 + outerR * Math.sin(tickAngleRad);

      ticks.push(
        <g key={i}>
          {/* Tick Line */}
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={themeStyles[theme].tickColor} strokeWidth="2" />
          {/* Number */}
          <text 
            x={tx} y={ty} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            fill={themeStyles[theme].numberColor}
            className={`text-[6px] font-bold ${themeStyles[theme].font}`}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            {i}
          </text>
        </g>
      );
    }
    return ticks;
  };

  // --- THEME STYLES ---
  const themeStyles = {
    sport: {
      bg: "bg-black",
      border: "border-gray-800",
      accent: "text-red-600",
      accentStroke: "#dc2626",
      needle: "bg-red-600",
      needleShadow: "shadow-[0_0_8px_rgba(220,38,38,1)]",
      font: "font-digital",
      numberColor: "#fff",
      tickColor: "#555",
      texture: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
      gridOpacity: "opacity-10"
    },
    race: {
      bg: "bg-slate-900",
      border: "border-yellow-600",
      accent: "text-yellow-400",
      accentStroke: "#facc15",
      needle: "bg-yellow-400",
      needleShadow: "shadow-[0_0_8px_rgba(250,204,21,0.8)]",
      font: "font-mono",
      numberColor: "#fbbf24",
      tickColor: "#fbbf24",
      texture: "",
      gridOpacity: "opacity-20"
    },
    eco: {
      bg: "bg-gray-900",
      border: "border-cyan-500",
      accent: "text-cyan-400",
      accentStroke: "#22d3ee",
      needle: "bg-cyan-400",
      needleShadow: "shadow-[0_0_10px_rgba(34,211,238,0.8)]",
      font: "font-sans",
      numberColor: "#a5f3fc",
      tickColor: "#0891b2",
      texture: "",
      gridOpacity: "opacity-5"
    },
    retro: {
      bg: "bg-[#1a0b2e]",
      border: "border-purple-500",
      accent: "text-purple-400",
      accentStroke: "#c026d3",
      needle: "bg-orange-500",
      needleShadow: "shadow-[0_0_10px_rgba(249,115,22,1)]",
      font: "font-digital",
      numberColor: "#f97316",
      tickColor: "#d946ef",
      texture: "url('https://www.transparenttextures.com/patterns/diagmonds-light.png')",
      gridOpacity: "opacity-30"
    }
  };

  const bgImages: Record<string, string> = {
    highway: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop', // Open, scenic highway
    city: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1920&auto=format&fit=crop', // Dark cyberpunk-ish city
    tunnel: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1920&auto=format&fit=crop' // Modern light tunnel
  };

  const currentStyle = themeStyles[theme];
  
  // Warning Light Logic
  const showBulbCheck = !state.isEngineRunning || state.isStalled;

  // Gear Display Logic
  let gearDisplay = '';
  if (state.gear === 0) gearDisplay = 'N';
  else if (state.gear === -1) gearDisplay = 'R';
  else {
      // Forward gears
      if (state.transmissionMode === 'CVT') {
          gearDisplay = 'D';
      } else {
          gearDisplay = state.gear.toString();
      }
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${currentStyle.bg} rounded-3xl border-4 ${currentStyle.border} shadow-2xl relative overflow-hidden aspect-[2.5/1] transition-colors duration-500`}>
      
      {/* Background Image Layer */}
      {clusterBg !== 'none' && (
         <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
                src={bgImages[clusterBg]} 
                alt="background" 
                className="w-full h-full object-cover opacity-60 mix-blend-overlay blur-[2px] scale-105" 
            />
            <div className="absolute inset-0 bg-black/50"></div>
         </div>
      )}

      {/* Controls: Mode & BG Toggle */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
         <button 
           onClick={onToggleClusterBg}
           className="text-[10px] uppercase tracking-widest border border-gray-600 text-gray-400 px-2 py-1 rounded hover:bg-white hover:text-black transition-colors bg-black/50 backdrop-blur-md"
         >
           BG: {clusterBg}
         </button>
         <button 
           onClick={onToggleTheme}
           className="text-[10px] uppercase tracking-widest border border-gray-600 text-gray-400 px-2 py-1 rounded hover:bg-white hover:text-black transition-colors bg-black/50 backdrop-blur-md"
         >
           Mode: {theme}
         </button>
      </div>

      {/* Background Grid Pattern (Only if no custom bg) */}
      {clusterBg === 'none' && (
        <div className={`absolute inset-0 ${currentStyle.gridOpacity} pointer-events-none`} 
             style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      )}
      
      {/* Texture overlay (Only if no custom bg) */}
      {clusterBg === 'none' && currentStyle.texture && (
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: currentStyle.texture }}></div>
      )}

      {/* Warning Lights Cluster */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-6 z-40 bg-black/40 px-6 py-1 rounded-full border border-white/5 backdrop-blur-sm shadow-lg">
         {/* Check Engine */}
         <WarningIcon 
            active={showBulbCheck} 
            color="text-yellow-500" 
            path="M3 3v18h18V3H3zm9 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3-3 3zm4.5-8h-9V8h9v2z" // Simplified Engine Block
         />
         {/* Battery */}
         <WarningIcon 
            active={showBulbCheck} 
            color="text-red-500" 
            path="M16 2h-2v2h-4V2H8v2H5v18h14V4h-3V2zM7 16H6v-2h1v2zm0-4H6v-2h1v2zm10 4h-1v-2h1v2zm0-4h-1v-2h1v2z" 
         />
         {/* Oil */}
         <WarningIcon 
            active={showBulbCheck || (state.isEngineRunning && state.rpm < 400)} 
            color="text-red-500" 
            path="M20 2H4v2h16V2zM4 18v2h16v-2c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4zm4-9h8c1.66 0 3-1.34 3-3s-1.34-3-3-3H8c-1.66 0-3 1.34-3 3s1.34 3 3 3z"
         />
         {/* Brake / Parking Brake */}
         <WarningIcon 
            active={showBulbCheck || state.brakePosition > 0.9} 
            color="text-red-500" 
            path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" // Exclamation Circle
         />
         {/* ABS */}
         <WarningIcon 
            active={state.isEngineRunning && state.brakePosition > 0.8 && Math.abs(state.speed) > 10} 
            color="text-yellow-500" 
            blink={true}
            path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" 
         />
         {/* ESP / Traction */}
         <WarningIcon 
            active={state.isDrifting} 
            color="text-yellow-500" 
            blink={true}
            path="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" 
         />
      </div>


      <div className="relative z-10 flex justify-between items-center h-full px-8">
        
        {/* Tachometer (Left) */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          
          <svg className="absolute w-full h-full" viewBox="0 0 100 100">
             {/* Render Ticks and Numbers */}
             {renderTicks()}
             
             {/* Dynamic Theme Bar (Follows needle) */}
             <path 
               d={arcPath} 
               fill="none" 
               stroke={currentStyle.accentStroke}
               strokeWidth="3"
               strokeOpacity="0.8"
               strokeLinecap="round"
             />
          </svg>

          {/* Center Info */}
          <div className="text-center z-20 mt-8">
            <div className={`text-6xl ${currentStyle.font} font-bold text-white tracking-tighter shadow-black drop-shadow-md`}>
              {gearDisplay}
            </div>
            
            {/* Auto/Manual Indicator */}
            <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${state.transmissionMode !== 'MT' ? 'text-blue-400' : 'text-gray-500'}`}>
                {state.transmissionMode !== 'MT' ? `${state.transmissionMode} D` : 'MANUAL'}
            </div>
             
             {/* Numeric RPM */}
            <div className={`text-lg font-mono font-bold mt-2 ${currentStyle.accent}`}>
                {Math.round(state.rpm)}
            </div>
          </div>
          
          {/* Needle */}
          <div 
            className="absolute w-full h-full rounded-full transition-transform duration-75 ease-out pointer-events-none"
            style={{ transform: `rotate(${needleAngle}deg)` }}
          >
             {/* Needle Shape */}
             <div className={`w-1 h-28 ${currentStyle.needle} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full origin-bottom ${currentStyle.needleShadow} rounded-full`}></div>
             {/* Center Cap */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-black border-2 border-gray-600 rounded-full z-30"></div>
          </div>

          <div className="absolute bottom-8 font-bold text-[10px] text-gray-500">x1000 RPM</div>
        </div>

        {/* Center Digital Readout */}
        <div className="flex flex-col items-center justify-center w-64 space-y-2">
            <div className={`${currentStyle.accent} font-bold text-lg tracking-widest uppercase`}>{theme === 'eco' ? 'ECO-MODE' : theme === 'retro' ? 'TURBO' : theme === 'race' ? 'TRACK' : 'RS7 SPORT'}</div>
            <div className={`text-8xl ${currentStyle.font} text-white font-black tracking-tighter shadow-glow drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`}>
              {Math.abs(Math.round(state.speed))}
            </div>
            <div className="text-xl text-gray-400 font-medium">km/h</div>
            
            {/* Odometer / Trip */}
            <div className="flex space-x-4 text-xs text-gray-500 mt-4 font-mono">
               <span>TRIP: {(state.distanceTraveled / 1000).toFixed(1)} km</span>
               <span className={state.fuel <= 0 ? 'text-red-500 animate-pulse' : ''}>{state.isEngineRunning ? 'READY' : 'OFF'}</span>
            </div>
        </div>

        {/* Right Gauge (Fuel & Temp) */}
        <div className="relative w-64 h-64 flex items-center justify-center">
             
             {/* Fuel Bar (Outer Right) */}
             <div className={`absolute right-10 top-1/2 -translate-y-1/2 h-32 w-2 bg-gray-800 rounded-full overflow-hidden border ${theme === 'retro' ? 'border-purple-500' : 'border-gray-700'} flex flex-col justify-end`}>
                <div 
                  className={`w-full transition-all duration-500 ${state.fuel < 20 ? 'bg-red-500 animate-pulse' : theme === 'retro' ? 'bg-purple-500' : theme === 'eco' ? 'bg-green-400' : theme === 'race' ? 'bg-yellow-400' : 'bg-white'}`}
                  style={{ height: `${state.fuel}%` }}
                ></div>
             </div>
             <div className="absolute right-14 top-1/2 -translate-y-1/2 text-right">
                {state.fuel < 15 && <div className="text-yellow-500 mb-1 animate-pulse">⚠️</div>}
                <div className="text-[9px] text-gray-500 font-bold">FUEL</div>
             </div>

             {/* Engine Temp Bar (Inner Right) */}
             <div className={`absolute right-24 top-1/2 -translate-y-1/2 h-24 w-2 bg-gray-800 rounded-full overflow-hidden border ${theme === 'retro' ? 'border-purple-500' : 'border-gray-700'} flex flex-col justify-end`}>
                <div 
                  className={`w-full transition-all duration-500 ${state.engineTemp > 110 ? 'bg-red-500 animate-pulse' : theme === 'retro' ? 'bg-pink-500' : theme === 'eco' ? 'bg-blue-400' : theme === 'race' ? 'bg-orange-400' : 'bg-white'}`}
                  style={{ height: `${Math.min(100, (state.engineTemp / 130) * 100)}%` }}
                ></div>
             </div>
             <div className="absolute right-28 top-1/2 -translate-y-1/2 text-right">
                {state.engineTemp > 110 && <div className="text-red-500 mb-1 animate-pulse">⚠️</div>}
                <div className="text-[9px] text-gray-500 font-bold">TMP</div>
                <div className={`text-sm ${currentStyle.font} text-white`}>{Math.round(state.engineTemp)}°</div>
             </div>
             
             {/* Lane Assist Indicator */}
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-left flex flex-col items-center">
                 <div className="text-[10px] text-gray-500 font-bold mb-1">RADAR</div>
                 <div className={`w-10 h-10 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                     !state.laneSystemActive 
                        ? 'border-gray-700 text-gray-700' 
                        : state.isDrifting 
                            ? 'border-red-500 bg-red-900/50 text-red-500 animate-pulse' 
                            : 'border-green-500 text-green-500'
                 }`}>
                    {/* Car Icon with Lines */}
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                       <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
                       {/* Lines */}
                       <path d="M1 17h2v2H1zm0-4h2v2H1zm0-4h2v2H1zm20 8h2v2h-2zm0-4h2v2h-2zm0-4h2v2h-2z"/> 
                    </svg>
                 </div>
                 <span className={`text-[9px] mt-1 font-bold ${state.laneSystemActive ? (state.isDrifting ? 'text-red-500' : 'text-green-500') : 'text-gray-700'}`}>
                     {state.laneSystemActive ? (state.isDrifting ? 'WARNING' : 'ACTIVE') : 'OFF'}
                 </span>
             </div>

             {/* ACCEL TIMER - Re-positioned to Right Gauge Cluster (Bottom) */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center w-24">
                <div className="text-[9px] text-gray-500 font-bold mb-1">0-100 KM/H</div>
                <div className={`text-xl font-mono ${state.isTimingAccel ? 'text-white' : 'text-gray-400'}`}>
                    {state.isTimingAccel ? state.accelTimer.toFixed(1) : state.lastZeroToHundred ? state.lastZeroToHundred.toFixed(1) : '--.-'}
                    <span className="text-xs ml-1 text-gray-600">s</span>
                </div>
                <div className="text-[9px] text-yellow-500 font-bold">BEST: {state.bestZeroToHundred ? state.bestZeroToHundred.toFixed(1) + 's' : '--'}</div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
