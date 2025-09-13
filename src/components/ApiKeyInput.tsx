
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveApiKey = () => {
    onApiKeyChange(inputKey);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <KeyRound className="h-4 w-4" />
          {apiKey ? "API Key Set" : "Set API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter your Hugging Face API Key</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowApiKey(!showApiKey)}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" onClick={handleSaveApiKey}>
              Save
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API key will be stored in your browser's local storage and used
            only for making requests. Make sure to keep it confidential.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyInput;
