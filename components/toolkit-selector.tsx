'use client';

import * as React from 'react';
import { Wrench, Check, CheckSquare, Square } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { getAuthProviderByToolkitId } from '@/lib/arcade/auth-providers';
import useSWR from 'swr';
import { Badge } from './ui/badge';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ToolkitSelector() {
  const [selectedToolkits, setSelectedToolkits] = useLocalStorage<string[]>(
    'selected-toolkits',
    [],
  );
  const [open, setOpen] = React.useState(false);

  const { data: toolkitIds, isLoading } = useSWR<string[]>(
    '/api/toolkits',
    fetcher,
  );

  React.useEffect(() => {
    if (toolkitIds) {
      // Filter out any selected toolkits that are no longer in the list
      const validToolkits = selectedToolkits.filter((id) =>
        toolkitIds.includes(id),
      );
      if (validToolkits.length !== selectedToolkits.length) {
        setSelectedToolkits(validToolkits);
      }
    }
  }, [
    toolkitIds,
    selectedToolkits.length,
    setSelectedToolkits,
    selectedToolkits,
  ]);

  const toolkits =
    toolkitIds?.map((id) => {
      const provider = getAuthProviderByToolkitId(id.toLowerCase());
      return {
        id,
        name: provider?.name || id,
        icon: provider?.icon ? (
          <provider.icon className="size-4" />
        ) : (
          <Wrench className="size-4" />
        ),
      };
    }) || [];

  const handleToolkitChange = (toolkitId: string) => {
    setSelectedToolkits((prev) =>
      prev.includes(toolkitId)
        ? prev.filter((id) => id !== toolkitId)
        : [...prev, toolkitId],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-md h-8 bg-transparent border-input flex items-center gap-3 hover:bg-accent hover:text-accent-foreground transition-colors px-3"
          aria-label={`Toolkits: ${selectedToolkits.length === 0 ? 'All' : `${selectedToolkits.length} selected`}`}
        >
          <Wrench className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium ">Toolkits</span>
          {selectedToolkits.length > 0 ? (
            <Badge className="ml-1 size-4 px-1.5 flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground">
              {selectedToolkits.length}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="ml-1 py-0.5 px-2 flex items-center justify-center text-xs font-medium"
            >
              All
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search toolkits..." />
          <CommandList>
            <CommandEmpty>No toolkits found.</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-2">
                  Loading toolkits...
                </div>
              ) : (
                <>
                  <CommandItem
                    onSelect={() => {
                      if (selectedToolkits.length === toolkitIds?.length) {
                        setSelectedToolkits([]);
                      } else {
                        setSelectedToolkits(toolkitIds || []);
                      }
                    }}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      {selectedToolkits.length === toolkitIds?.length ? (
                        <CheckSquare className="size-4" />
                      ) : (
                        <Square className="size-4" />
                      )}
                      <span>
                        {selectedToolkits.length === toolkitIds?.length
                          ? 'Unselect All'
                          : 'Select All'}
                      </span>
                    </div>
                  </CommandItem>
                  <div className="h-px bg-border my-1" />
                  {toolkits.map((toolkit) => (
                    <CommandItem
                      key={toolkit.id}
                      value={toolkit.id}
                      onSelect={() => handleToolkitChange(toolkit.id)}
                    >
                      <div className="flex items-center gap-2">
                        {toolkit.icon}
                        <span>{toolkit.name}</span>
                      </div>
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedToolkits.includes(toolkit.id)
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
