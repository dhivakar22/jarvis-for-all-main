
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ConversationDisplayProps {
  messages: Message[];
  className?: string;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ 
  messages, 
  className 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={cn(
        "w-full h-full flex flex-col items-center justify-center p-4 text-center",
        className
      )}>
        <p className="text-lg text-indigo-300">
          Say "Hey Jarvis" to start a conversation
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full h-full flex flex-col p-4 overflow-y-auto space-y-4",
      className
    )}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "max-w-[80%] p-4 rounded-2xl shadow-md",
            message.sender === 'user' 
              ? "bg-indigo-800/40 text-white ml-auto rounded-tr-none border border-indigo-700/30" 
              : "bg-indigo-600/30 text-white mr-auto rounded-tl-none border border-indigo-500/30"
          )}
        >
          <p className="text-lg font-medium">{message.text}</p>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationDisplay;
