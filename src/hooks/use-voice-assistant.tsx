import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking';

const useVoiceAssistant = (wakeWord: string = 'jarvis') => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [model, setModel] = useState<string>('phi-3-mini');
  const [apiKey, setApiKey] = useState<string>('');
  const [initialGreetingPlayed, setInitialGreetingPlayed] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakAttemptRef = useRef(0);
  const continuousListeningRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const pendingRestartRef = useRef(false);
  const isResponseCompleteRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Increase timeout to allow for longer speaking time
      if (recognitionRef.current) {
        // @ts-ignore - maxAlternatives exists but TypeScript doesn't know about it
        recognitionRef.current.maxAlternatives = 1;
      }
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please try using Chrome or Edge.",
        variant: "destructive",
      });
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Pre-load voices
      if (synthRef.current) {
        if (synthRef.current.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            // This event fires when voices are ready
            synthRef.current = window.speechSynthesis;
          };
        }
      }
    } else {
      toast({
        title: "Speech Synthesis Not Supported",
        description: "Your browser doesn't support text-to-speech. Please try using Chrome or Edge.",
        variant: "destructive",
      });
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current && utteranceRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!initialGreetingPlayed && synthRef.current) {
      const initialGreeting = "I am Jarvis. How can I assist you today?";
      addMessage(initialGreeting, 'assistant');
      
      // Small delay to ensure everything is loaded properly
      setTimeout(() => {
        speakText(initialGreeting);
        setInitialGreetingPlayed(true);
      }, 1000);
    }
  }, [initialGreetingPlayed]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptValue = result[0].transcript.trim().toLowerCase();
      setTranscript(transcriptValue);
      
      // Handle wake word detection
      if (status === 'idle' && 
          (transcriptValue.includes(wakeWord.toLowerCase()) || 
           transcriptValue.includes('hey ' + wakeWord.toLowerCase()))) {
        
        setStatus('listening');
        setTranscript('');
        
        // Provide audio feedback for wake word detection
        const audio = new Audio();
        audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        audio.play();
        
        toast({
          title: "Listening active",
          description: "How can I help you?",
          variant: "default",
        });
        return;
      }
      
      // Handle stop command
      if (status !== 'idle' && (
          transcriptValue.includes('stop') ||
          transcriptValue.includes('exit') ||
          transcriptValue.includes('end') ||
          transcriptValue.includes('quit')
        )) {
        continuousListeningRef.current = false;
        setStatus('idle');
        setTranscript('');
        addMessage("Conversation ended. Say 'Hey Jarvis' to start again.", 'assistant');
        speakText("Conversation ended. Say Hey Jarvis to start again.");
        return;
      }
      
      // Process user input when a final result is available
      if (status === 'listening' && result.isFinal && transcriptValue !== '') {
        // Only process if previous response is complete
        if (isResponseCompleteRef.current) {
          processUserInput(transcriptValue);
        } else {
          console.log("Waiting for previous response to complete...");
        }
      }
    };
    
    recognitionRef.current.onend = () => {
      isRecognitionActiveRef.current = false;
      
      // Handle automatic restart if continuous mode is active
      if (continuousListeningRef.current) {
        if (!pendingRestartRef.current) {
          pendingRestartRef.current = true;
          setTimeout(() => {
            startListening();
            pendingRestartRef.current = false;
          }, 300);
        }
      } else {
        setIsListening(false);
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      
      if (event.error === 'no-speech') {
        if (continuousListeningRef.current) {
          if (!pendingRestartRef.current) {
            pendingRestartRef.current = true;
            setTimeout(() => {
              startListening();
              pendingRestartRef.current = false;
            }, 300);
          }
        }
      } else if (event.error === 'audio-capture') {
        toast({
          title: "Microphone Error",
          description: "Please check your microphone and try again.",
          variant: "destructive",
        });
        setIsListening(false);
        continuousListeningRef.current = false;
      } else if (event.error !== 'aborted') {
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
        setIsListening(false);
        continuousListeningRef.current = false;
      }
      
      isRecognitionActiveRef.current = false;
    };
  }, [status, wakeWord]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    // Only start listening if not already speaking
    if (isSpeaking) {
      console.log("Cannot start listening while speaking");
      return;
    }
    
    try {
      if (!isRecognitionActiveRef.current) {
        recognitionRef.current.start();
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        continuousListeningRef.current = true;
        
        if (status === 'idle') {
          setStatus('listening');
          // Play a subtle audio cue when listening starts
          if ('Audio' in window) {
            const audio = new Audio();
            audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
            audio.volume = 0.2;
            audio.play();
          }
        }
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      
      isRecognitionActiveRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      setTimeout(() => {
        if (continuousListeningRef.current) {
          startListening();
        }
      }, 500);
    }
  }, [status, isSpeaking]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    continuousListeningRef.current = false;
    pendingRestartRef.current = false;
    
    if (isRecognitionActiveRef.current) {
      recognitionRef.current.abort();
      isRecognitionActiveRef.current = false;
    }
    
    setIsListening(false);
    setStatus('idle');
    
    // Play a subtle audio cue when listening stops
    if ('Audio' in window) {
      const audio = new Audio();
      audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
      audio.volume = 0.2;
      audio.play();
    }
  }, []);

  const toggleListening = useCallback(() => {
    // Cancel any ongoing speech first
    if (isSpeaking) {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isSpeaking, startListening, stopListening]);

  const processUserInput = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;
    
    // Mark that we're starting a response cycle
    isResponseCompleteRef.current = false;
    
    setStatus('processing');
    addMessage(userInput, 'user');
    
    try {
      let response;
      
      if (apiKey) {
        response = await callHuggingFaceAPI(userInput, model, apiKey);
      } else {
        response = await mockAIResponse(userInput, model);
        toast({
          title: "Using demo responses",
          description: "Set your Hugging Face API key in settings for real AI responses.",
          variant: "default",
        });
      }
      
      // Don't allow interruptions during speaking
      continuousListeningRef.current = false;
      if (isRecognitionActiveRef.current && recognitionRef.current) {
        recognitionRef.current.abort();
        isRecognitionActiveRef.current = false;
      }
      
      setStatus('speaking');
      addMessage(response, 'assistant');
      await speakTextAsync(response);
      
      // Resume listening only after complete response
      continuousListeningRef.current = true;
      startListening();
      
    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        title: "Processing Error",
        description: "Sorry, I couldn't process your request. Please try again.",
        variant: "destructive",
      });
      setStatus('listening');
      isResponseCompleteRef.current = true;
    }
  }, [model, apiKey, startListening]);

  const callHuggingFaceAPI = async (input: string, modelName: string, key: string) => {
    try {
      let modelId;
      switch (modelName) {
        case 'phi-3-mini':
          modelId = 'microsoft/Phi-3-mini-4k-instruct';
          break;
        case 'mixtral-8x7b':
          modelId = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
          break;
        case 'llama-3-8b':
          modelId = 'meta-llama/Meta-Llama-3-8B-Instruct';
          break;
        case 'mistral-7b':
          modelId = 'mistralai/Mistral-7B-Instruct-v0.2';
          break;
        default:
          modelId = 'microsoft/Phi-3-mini-4k-instruct';
      }

      const systemInstruction = `
      [SYSTEM] Answer as Jarvis, a helpful AI assistant for visually impaired students.
      Keep conversation friendly, clear, and descriptive, assuming the user may have difficulty seeing.
      Describe visual elements clearly and be precise with directions.
      Keep answers comprehensive but not too lengthy.
      [USER] ${input}
      [JARVIS]`;

      const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: systemInstruction,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      let generatedText;
      if (Array.isArray(data) && data.length > 0) {
        generatedText = data[0].generated_text;
      } else if (typeof data === 'object' && data.generated_text) {
        generatedText = data.generated_text;
      } else {
        generatedText = String(data);
      }
      
      // Clean up the response if it contains any additional [USER] prompts
      const cleanResponse = generatedText.split('[USER]')[0].trim();
      
      return cleanResponse;
    } catch (error) {
      console.error('Hugging Face API error:', error);
      return `I'm having trouble connecting to my AI brain right now. ${await mockAIResponse(input, modelName)}`;
    }
  };

  const addMessage = useCallback((text: string, sender: 'user' | 'assistant') => {
    setMessages(prev => [
      ...prev, 
      {
        id: Date.now().toString(),
        text,
        sender,
        timestamp: new Date()
      }
    ]);
  }, []);

  // Promise-based version of speakText to allow await
  const speakTextAsync = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        console.log("Speech synthesis not available");
        isResponseCompleteRef.current = true;
        resolve();
        return;
      }
      
      // Function to handle speech completion
      const handleSpeechComplete = () => {
        setIsSpeaking(false);
        setStatus('listening');
        isResponseCompleteRef.current = true;
        console.log('Speech completed successfully');
        resolve();
      };
      
      // Cancel any ongoing speech first
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      
      setIsSpeaking(true);
      setStatus('speaking');
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Optimize speech parameters for clarity - slightly slower for better comprehension
      utterance.rate = 0.9; 
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Select an appropriate voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Daniel') || 
        voice.name.includes('Male')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Add event handlers for better tracking
      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatus('speaking');
        console.log('Speech started');
      };
      
      utterance.onend = () => {
        handleSpeechComplete();
        
        // Play a subtle audio cue when speech ends and returning to listening mode
        if ('Audio' in window) {
          const audio = new Audio();
          audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
          audio.volume = 0.2;
          audio.play();
        }
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        handleSpeechComplete();
      };
      
      // Handle the Chrome bug where speech gets cut off
      const handleChromeBug = () => {
        if (synthRef.current && utteranceRef.current && synthRef.current.speaking) {
          console.log('Checking Chrome bug fix');
          synthRef.current.pause();
          synthRef.current.resume();
          
          if (synthRef.current.speaking) {
            setTimeout(handleChromeBug, 5000);
          }
        }
      };
      
      // Start speaking with a small delay to ensure proper initialization
      setTimeout(() => {
        if (synthRef.current && utteranceRef.current) {
          console.log('Starting speech');
          synthRef.current.speak(utteranceRef.current);
          
          // Start Chrome bug fix monitoring
          setTimeout(handleChromeBug, 5000);
        } else {
          handleSpeechComplete();
        }
      }, 200);
    });
  };

  // Keep the original speakText for backward compatibility
  const speakText = useCallback((text: string) => {
    speakTextAsync(text).catch(error => {
      console.error('Error in speech synthesis:', error);
      isResponseCompleteRef.current = true;
    });
  }, []);

  const mockAIResponse = async (input: string, modelName: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Special response for visually impaired students
    if (input.includes('hello') || input.includes('hi ')) {
      return "Hello there! I'm Jarvis, your voice assistant. I'm here to help you with information and tasks. How can I assist you today?";
    } else if (input.includes('weather')) {
      return "I don't have access to real-time weather data yet, but I can help you find other information. Would you like me to help you with something else?";
    } else if (input.includes('name')) {
      return "I'm Jarvis, your personal voice assistant designed specifically to help students who are visually impaired. I can answer questions, provide information, and help with various tasks through voice commands.";
    } else if (input.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}.`;
    } else if (input.includes('joke')) {
      return "Here's a joke for you: Why don't scientists trust atoms? Because they make up everything! I hope that made you smile.";
    } else if (input.includes('thank')) {
      return "You're welcome! I'm always here to help. Is there anything else I can assist you with?";
    } else if (input.includes('help') || input.includes('assist')) {
      return "I can help you with information, answer questions, tell jokes, and more. Just ask me what you'd like to know or what you'd like me to do. For example, you can ask about the time, request a joke, or ask me to explain a concept.";
    } else if (input.includes('school') || input.includes('study') || input.includes('course')) {
      return "I can help with various school-related tasks. I can provide information on different subjects, help with research questions, or assist with scheduling and reminders. What specific school topic would you like help with?";
    } else {
      return `I heard your request about "${input}". As your assistant for visually impaired students, I'm designed to be as helpful as possible. In the future, I'll connect to a real AI model to provide better responses. How else can I assist you today?`;
    }
  };

  return {
    isListening,
    isSpeaking,
    messages,
    status,
    transcript,
    model,
    apiKey,
    startListening,
    stopListening,
    toggleListening,
    setModel,
    setApiKey,
  };
};

export default useVoiceAssistant;
