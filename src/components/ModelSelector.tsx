
import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const models = [
  {
    value: "phi-3-mini",
    label: "Phi-3 Mini",
  },
  {
    value: "mixtral-8x7b",
    label: "Mixtral 8x7B",
  },
  {
    value: "llama-3-8b",
    label: "Llama 3 8B",
  },
  {
    value: "mistral-7b",
    label: "Mistral 7B",
  },
];

interface ModelSelectorProps {
  model: string;
  onModelChange: (value: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, onModelChange }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {model
            ? models.find((m) => m.value === model)?.label
            : "Select model..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." className="h-9" />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup>
            {models.map((m) => (
              <CommandItem
                key={m.value}
                value={m.value}
                onSelect={(currentValue) => {
                  onModelChange(currentValue);
                  setOpen(false);
                }}
              >
                {m.label}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    model === m.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelector;
