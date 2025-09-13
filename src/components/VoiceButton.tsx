
import React from 'react';
import { Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  className?: string;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  isListening, 
  onClick, 
  className 
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center",
        "rounded-full p-8 focus:outline-none focus:ring-4",
        "transition-all duration-200 ease-in-out",
        isListening 
          ? "bg-blue-600/70 text-white border-4 border-blue-400" 
          : "bg-indigo-600/60 text-white border-4 border-indigo-400",
        "shadow-xl hover:shadow-2xl active:scale-95",
        "focus:ring-blue-500/50",
        "backdrop-blur-sm",
        className
      )}
      aria-label={isListening ? "Stop listening" : "Start listening"}
      tabIndex={0}
      role="button"
    >
      {isListening ? (
        <>
          <Square className="w-12 h-12" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-400/80 animate-pulse-ring"></div>
          <span className="sr-only">Stop Listening</span>
        </>
      ) : (
        <>
          <Mic className="w-12 h-12" />
          <span className="sr-only">Start Listening</span>
        </>
      )}
    </button>
  );
};

export default VoiceButton;
