
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import ModelSelector from './ModelSelector';
import ApiKeyInput from './ApiKeyInput';
import { toast } from '@/hooks/use-toast';

interface VoiceAssistantSettingsProps {
  model: string;
  apiKey: string;
  onModelChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
}

const VoiceAssistantSettings: React.FC<VoiceAssistantSettingsProps> = ({
  model,
  apiKey,
  onModelChange,
  onApiKeyChange,
}) => {
  // Set the API key when component mounts if not already set
  useEffect(() => {
    const savedApiKey = localStorage.getItem('hf_api_key');
    const providedKey = '';
    
    if (!apiKey && !savedApiKey && providedKey) {
      onApiKeyChange(providedKey);
      localStorage.setItem('hf_api_key', providedKey);
      toast({
        title: "API Key Set",
        description: "Your Hugging Face API key has been set successfully.",
        variant: "default",
      });
    }
  }, [apiKey, onApiKeyChange]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[350px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Voice Assistant Settings</SheetTitle>
          <SheetDescription>
            Configure your voice assistant's behavior and appearance.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">AI Model</h3>
            <p className="text-sm text-muted-foreground">
              Select which AI model to use for generating responses.
            </p>
            <ModelSelector model={model} onModelChange={onModelChange} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">API Credentials</h3>
            <p className="text-sm text-muted-foreground">
              Enter your Hugging Face API key to use for AI responses.
              {!apiKey && (
                <span className="block mt-1 text-amber-500">
                  Currently using demo mode with mock responses. Add your API key for real AI responses.
                </span>
              )}
              {apiKey && (
                <span className="block mt-1 text-green-500">
                  API key is set! You're now using the Hugging Face API for real AI responses.
                </span>
              )}
            </p>
            <ApiKeyInput apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
            <div className="mt-2">
              <a 
                href="https://huggingface.co/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
                Get your Hugging Face API key
              </a>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Accessibility Features</h3>
            <p className="text-sm text-muted-foreground">
              This voice assistant is designed for visually impaired users with:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>High contrast visual elements</li>
              <li>Keyboard navigation support</li>
              <li>Screen reader compatible UI</li>
              <li>Wake word detection ("Hey Jarvis")</li>
              <li>Continuous conversation flow</li>
            </ul>
          </div>
        </div>
        <SheetFooter className="mt-4 text-xs text-muted-foreground">
          Note: Your API key is stored only in your browser's local storage and is never sent to our servers.
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default VoiceAssistantSettings;
