
import React from 'react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status,
  className 
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to assist';
      case 'listening':
        return 'Listening to your voice';
      case 'processing':
        return 'Processing your request';
      case 'speaking':
        return 'Speaking response';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'bg-blue-500';
      case 'listening':
        return 'bg-purple-500';
      case 'processing':
        return 'bg-blue-600';
      case 'speaking':
        return 'bg-blue-400';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusSize = () => {
    // Make indicator larger when active to improve visibility for low vision users
    return status !== 'idle' ? 'w-6 h-6' : 'w-4 h-4';
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-3 rounded-full bg-black/30 backdrop-blur-sm border border-blue-800/40",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn(
        "rounded-full animate-pulse transition-all duration-300",
        getStatusColor(),
        getStatusSize()
      )} 
      aria-hidden="true"
      />
      <span className="text-lg font-medium text-white" id="status-text">
        {getStatusText()}
      </span>
    </div>
  );
};

export default StatusIndicator;
