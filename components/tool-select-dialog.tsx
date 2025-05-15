import React, {
  type ChangeEvent,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CircleHelp, Terminal } from 'lucide-react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Tooltip } from './ui/tooltip';
import { TooltipContent, TooltipTrigger } from '@radix-ui/react-tooltip';
import { useChatSetting } from './chat-setting-provider';

interface McpCommand {
  id: string;
  description: string;
  parameters: any;
}

interface ToolSelectDialogProps extends PropsWithChildren {
  // @FIXME: will be deprecated
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  children: React.ReactNode;
}

function getParameterDescription(parameters: any) {
  if (!parameters || !parameters.jsonSchema) {
    return [];
  }

  const { properties, required } = parameters.jsonSchema;
  if (!properties) {
    return [];
  }

  const args = Object.keys(properties).map((key) => {
    const arg = properties[key];
    const description = arg.description || '';
    const requiredFlag = required ? (required.includes(key) ? '(*)' : '') : '';
    return {
      name: key,
      description,
      required: requiredFlag,
    };
  });

  return args.map((arg) => {
    return `${arg.name}${arg.required}`;
  });
}

export const ToolSelectDialog: React.FC<ToolSelectDialogProps> = ({
  textareaRef,
  input,
  setInput,
  children,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showToolSuggestions, setShowToolSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const { tools } = useChatSetting();

  const mcpCommands: McpCommand[] = useMemo(
    () =>
      tools
        ? Object.keys(tools).map((tool) => {
            return {
              id: tool,
              description: tools[tool].description,
              parameters: tools[tool].parameters,
            };
          })
        : [],
    [tools],
  );

  const filteredSuggestions = mcpCommands.filter((tool) =>
    tool.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getSuggestionPosition = () => {
    if (!textareaRef.current) {
      return { top: 0, left: 0 };
    }

    // Get text up to cursor
    const textUpToCursor = input.substring(0, cursorPosition);

    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.font = getComputedStyle(textareaRef.current).font;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';

    // Get the current line text
    const currentLineText = textUpToCursor.split('\n').pop() || '';
    span.textContent = currentLineText;

    document.body.appendChild(span);
    const textWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);

    const suggestionsHeight = Math.min(
      filteredSuggestions.length * 56 + 60, // 35px per item + 60px for header
      360, // Max height
    );

    return {
      top: -suggestionsHeight,
      left: Math.min(textWidth, textareaRef.current.clientWidth - 200),
    };
  };

  // Calculate position of the suggestion box
  const { top, left } = getSuggestionPosition();

  // Handle input change and show suggestions
  const handleInput = (event: ChangeEvent | Event) => {
    const target = event.target as HTMLTextAreaElement;
    const newValue = target.value;
    const newPosition = target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, newPosition);
    const toolMatch = textBeforeCursor.match(/@(\w*)$/);

    setCursorPosition(newPosition);

    if (!toolMatch) {
      setShowToolSuggestions(false);
      return;
    }

    setShowToolSuggestions(true);
    setSearchTerm(toolMatch[1] || '');
    setSelectedIndex(0);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (index: number) => {
    if (index < 0 || index >= filteredSuggestions.length) {
      return;
    }

    const selected = filteredSuggestions[index];

    // For tool selection, replace @prefix with @toolname
    const textBeforeTrigger = input
      .substring(0, cursorPosition)
      .replace(/@\w*$/, '');
    const selectedTool = selected;
    const insertText = `@${selectedTool.id}`;
    const newValue =
      textBeforeTrigger + insertText + input.substring(cursorPosition);
    const newCursorPos = textBeforeTrigger.length + insertText.length;

    setInput(newValue);
    setShowToolSuggestions(false);

    // Set focus back to input and position cursor
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
    }
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (showToolSuggestions && filteredSuggestions.length > 0) {
      const selectedElement = document.getElementById(
        `suggestion-item-${selectedIndex}`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, showToolSuggestions, filteredSuggestions.length]);

  // Handle keyboard navigation
  const handleToolSuggestionsKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        event.preventDefault();
        handleSelectSuggestion(selectedIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setShowToolSuggestions(false);
        break;
      case '?':
        if (event.shiftKey) {
          event.preventDefault();
          console.log(
            'Tool help shortcut triggered',
            filteredSuggestions[selectedIndex],
          );
          break;
        }
    }
  };

  return (
    <div className="relative w-full">
      {children && React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            onKeyDown: (event: React.KeyboardEvent) => {
              if (showToolSuggestions) {
                handleToolSuggestionsKeyDown(event as unknown as KeyboardEvent);
              } else {
                if ((children as React.ReactElement<any>).props.onKeyDown) {
                  (children as React.ReactElement<any>).props.onKeyDown(event);
                }
              }
            },
            onChange: (event: React.ChangeEvent) => {
              handleInput(event as unknown as KeyboardEvent);
              if ((children as React.ReactElement<any>).props.onChange) {
                (children as React.ReactElement<any>).props.onChange(event);
              }
            },
          })
        : children}
      {showToolSuggestions && filteredSuggestions.length > 0 && (
        <div
          className={`absolute z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md`}
          style={{
            top: `${top}px`,
            left: `${left}px`,
          }}
        >
          <div className="flex bg-black rounded-t-md items-center gap-2 px-3 py-2 text-xs font-medium">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-white">Select Tools For Chat</span>
          </div>
          <div className="p-1 py-2 max-w-64 min-w-64">
            <div
              className="max-h-[300px] overflow-y-auto no-scrollbar"
              style={{
                top: `${-Math.max(15 * 35, 400)}px`,
                left: `${left}px`,
              }}
            >
              {filteredSuggestions.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  id={`suggestion-item-${index}`}
                  tabIndex={-1}
                  className={`flex flex-col items-start w-[100%] text-left text-ellipsis gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleSelectSuggestion(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex flex-1 w-[100%] items-center justify-between">
                    <div className="font-medium font-mono overflow-hidden max-w-52 text-left text-ellipsis">
                      {item.id}
                    </div>
                    <div className="w-4 h-4 flex items-center justify-center relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleHelp
                            className={`h-4 w-4 text-muted-foreground transition-opacity duration-800 ${
                              index === selectedIndex
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="absolute -top-2 left-6 z-50 w-56 bg-black text-white rounded-md p-2 text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Terminal className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                Arguments (* required)
                              </span>
                            </div>
                            <div className="text-xs/4 text-muted-foreground">
                              {getParameterDescription(item.parameters).join(
                                ' / ',
                              )}
                            </div>
                            <div className="flex items-center gap-1 mb-1 mt-4">
                              <Terminal className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Description</span>
                            </div>
                            <div className="text-xs/4 text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="text-xs/4 text-muted-foreground max-h-20 truncate max-w-56">
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolSelectDialog;
