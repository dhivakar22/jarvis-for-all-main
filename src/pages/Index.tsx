
import React, { useEffect, useCallback } from 'react';
import useVoiceAssistant from '@/hooks/use-voice-assistant';
import VoiceButton from '@/components/VoiceButton';
import VoiceVisualization from '@/components/VoiceVisualization';
import StatusIndicator from '@/components/StatusIndicator';
import ConversationDisplay from '@/components/ConversationDisplay';
import VoiceAssistantSettings from '@/components/VoiceAssistantSettings';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const {
    isListening,
    isSpeaking,
    messages,
    status,
    model,
    apiKey,
    toggleListening,
    setModel,
    setApiKey,
  } = useVoiceAssistant();

  // Check for saved API key on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('hf_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [setApiKey]);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('hf_api_key', apiKey);
    }
  }, [apiKey]);

  // Set up keyboard shortcut for toggle listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName || '')) {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  useEffect(() => {
    // Check for microphone permissions on component mount
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          // Permission granted
          toast({
            title: 'Microphone Access Granted',
            description: 'Your voice assistant is ready to use.',
          });
          
          // Announce accessibility info
          setTimeout(() => {
            const announcement = new SpeechSynthesisUtterance(
              "Voice assistant for visually impaired students is ready."
            );
            window.speechSynthesis.speak(announcement);
          }, 1000);
        })
        .catch((err) => {
          console.error('Error accessing microphone:', err);
          toast({
            title: 'Microphone Access Denied',
            description: 'Please enable microphone access to use the voice assistant.',
            variant: 'destructive',
          });
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black">
      <div className="max-w-6xl mx-auto pb-10 px-4 sm:px-6">
        <header className="pt-6 flex items-center justify-between">
          <div 
            className="flex items-center gap-2"
            tabIndex={0}
            aria-label="Jarvis Voice Assistant for Students"
          >
            <h1 className="text-3xl font-bold text-white">Jarvis</h1>
            <p className="text-sm text-indigo-300">Voice Assistant for Visually Impaired Students</p>
          </div>
          <VoiceAssistantSettings
            model={model}
            apiKey={apiKey}
            onModelChange={setModel}
            onApiKeyChange={setApiKey}
          />
        </header>

        <main className="mt-8 flex flex-col md:flex-row gap-8 items-start" role="main">
          {/* Voice Assistant Interaction Area */}
          <div 
            className="w-full md:w-1/2 bg-black/40 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden h-[65vh] flex flex-col border border-blue-900/50"
            aria-label="Voice Assistant Interaction Area"
          >
            <div className="flex-1 overflow-hidden relative">
              <ConversationDisplay messages={messages} className="h-full" />
            </div>

            <div className="p-6 border-t border-blue-900/30 bg-black/30">
              <StatusIndicator status={status} className="mb-6 text-blue-200" />
              <div className="relative h-[150px]">
                <VoiceVisualization 
                  isListening={isListening} 
                  isSpeaking={isSpeaking} 
                  className="mb-4" 
                />
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <VoiceButton 
                    isListening={isListening} 
                    onClick={toggleListening}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Transcript Column for Low Vision Users */}
          <div 
            className="w-full md:w-1/2 bg-black/40 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden h-[65vh] flex flex-col border border-blue-900/50"
            aria-label="Text Transcript for Low Vision"
          >
            <div className="p-4 border-b border-blue-900/30 bg-black/50">
              <h2 className="text-xl font-bold text-white">Text Transcript</h2>
              <p className="text-sm text-indigo-300">High contrast text for low vision users</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xl text-indigo-200 text-center font-bold">
                    Conversation will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {messages.map((message) => (
                    <div key={message.id} className="text-transcript-item">
                      <h3 className="text-lg font-bold mb-2 text-indigo-300">
                        {message.sender === 'user' ? 'You' : 'Jarvis'}:
                      </h3>
                      <p className="text-xl font-semibold text-white leading-relaxed">
                        {message.text}
                      </p>
                      <p className="text-xs text-indigo-400 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <div className="mt-10 text-center max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-white mb-3" tabIndex={0}>How to use your voice assistant</h2>
          <ul 
            className="space-y-3 text-left text-indigo-200/90 bg-black/30 p-6 rounded-lg backdrop-blur-sm border border-blue-900/30"
            aria-label="Voice assistant instructions"
          >
            <li tabIndex={0}>1. Jarvis will greet you when the page loads</li>
            <li tabIndex={0}>2. Speak your question clearly after the greeting</li>
            <li tabIndex={0}>3. Wait for Jarvis to respond completely</li>
            <li tabIndex={0}>4. Jarvis will listen for your next question when ready</li>
            <li tabIndex={0}>5. Say "Stop" or "Exit" when you're finished</li>
          </ul>
          
          <p className="mt-6 text-sm text-indigo-300/80" tabIndex={0}>
            Keyboard Shortcut: Press <kbd className="px-2 py-1 bg-black/30 rounded border border-blue-900/30">Space</kbd> to toggle listening
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
