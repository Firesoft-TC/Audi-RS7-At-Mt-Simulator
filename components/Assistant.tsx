import React from 'react';

interface AssistantProps {
  message: string;
}

const Assistant: React.FC<AssistantProps> = ({ message }) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-black flex items-center justify-center border border-blue-500">
             <span className="text-white font-bold font-digital text-xs">SYS</span>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Digital Co-Pilot</h4>
            <div className="flex items-center space-x-1">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span className="text-xs text-gray-400">Active</span>
            </div>
          </div>
        </div>
        <div className="bg-black/50 rounded p-3 min-h-[60px] flex items-center">
           <p className="text-gray-200 text-sm font-mono leading-relaxed">
             "{message}"
           </p>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
