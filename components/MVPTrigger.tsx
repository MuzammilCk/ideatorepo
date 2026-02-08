import React from 'react';

interface MVPTriggerProps {
  onActivate: () => void;
}

const MVPTrigger: React.FC<MVPTriggerProps> = ({ onActivate }) => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-16 animate-fade-in-up flex flex-col items-center">
      <div className="relative group cursor-pointer" onClick={onActivate}>
         {/* Glowing aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-electricBlue via-deepBlue to-electricBlue rounded-lg opacity-30 blur-xl group-hover:opacity-80 transition duration-500 animate-pulse"></div>
        
        <button
          className="relative px-16 py-6 font-black text-xl uppercase tracking-[0.2em] transition-all duration-200 skew-x-[-10deg] bg-electricBlue text-black hover:bg-white hover:text-electricBlue hover:shadow-blue-glow border-none"
        >
          <span className="flex items-center gap-4 skew-x-[10deg]">
            <span className="animate-bounce">✨</span>
            <span>Generate MVP Plan</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>✨</span>
          </span>
        </button>
      </div>
      
      <div className="flex justify-between items-center mt-6 w-full px-12 opacity-70">
         <p className="text-electricBlue/60 font-mono text-[10px] uppercase tracking-widest">
            // Analyze {5} Data Streams
         </p>
         <p className="text-electricBlue/60 font-mono text-[10px] uppercase tracking-widest">
            // Awaiting Authorization
         </p>
      </div>
    </div>
  );
};

export default MVPTrigger;