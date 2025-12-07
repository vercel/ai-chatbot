# Tool Result Passing: How LLM Gets Tool Results

## The Problem

When a tool is called, the LLM needs to receive the tool's result to continue generating a response. Currently, the Python implementation executes tools and yields results as SSE events, but **doesn't pass them back to the LLM**.

## How It Works in Next.js (Vercel AI SDK)

The Vercel AI SDK's `streamText` function **automatically handles tool calling**:

1. **LLM requests tool call**: When the LLM decides to call a tool, it returns `finish_reason: "tool_calls"` with tool call details
2. **SDK executes tool**: The SDK automatically executes the tool function
3. **SDK adds tool result to conversation**: The tool result is added as a message with `role: "tool"`
4. **SDK makes another API call**: The SDK automatically makes another API call to the LLM with the updated conversation (including tool result)
5. **LLM continues**: The LLM sees the tool result and continues generating a response
6. **Loop**: Steps 1-5 repeat if the LLM calls more tools (up to a limit)

This is handled **internally by the SDK** - you don't need to manually manage it.

## Current Python Implementation Issue

The current implementation in `backend/app/utils/stream.py`:

1. ✅ Detects tool calls when `finish_reason == "tool_calls"`
2. ✅ Executes tools and gets results
3. ✅ Yields tool results as SSE events
4. ❌ **MISSING**: Doesn't add tool results to conversation history
5. ❌ **MISSING**: Doesn't make another API call to continue conversation
6. ❌ **MISSING**: Doesn't loop for multiple tool calls

## The Fix: Multi-Turn Tool Calling

The `stream_text` function needs to be refactored to support **multi-turn conversations**:

```python
async def stream_text(...):
    # ... setup ...

    messages = list(chat_messages)  # Start with initial messages
    max_tool_turns = 5  # Prevent infinite loops

    for turn in range(max_tool_turns):
        # Make API call with current messages
        stream = client.chat.completions.create(
            model=model,
            messages=messages,  # Includes tool results from previous turns
            tools=tool_definitions,
            stream=True,
            # ... other params ...
        )

        # Process stream chunks
        tool_calls_to_execute = []
        for chunk in stream:
            # ... process chunks, detect tool calls ...
            if finish_reason == "tool_calls":
                # Collect tool calls
                tool_calls_to_execute.append(...)

        # If no tool calls, we're done
        if finish_reason != "tool_calls":
            break

        # Execute all tool calls
        tool_messages = []
        for tool_call in tool_calls_to_execute:
            tool_result = await execute_tool(tool_call)

            # Add tool result to conversation
            tool_messages.append({
                "role": "tool",
                "tool_call_id": tool_call["id"],
                "content": json.dumps(tool_result)  # Tool results must be JSON strings
            })

        # Add tool results to messages for next turn
        messages.extend(tool_messages)

    # Final response after all tool calls
    return final_response
```

## Implementation Steps

### Step 1: Refactor `stream_text` to Support Looping

```python
async def stream_text(
    client: OpenAI,
    model: str,
    messages: Sequence[ChatCompletionMessageParam],
    system: Optional[str] = None,
    tools: Optional[Mapping[str, Callable[..., Any]]] = None,
    tool_definitions: Optional[Sequence[Dict[str, Any]]] = None,
    temperature: float = 0.7,
    max_completion_tokens: Optional[int] = None,
    max_tool_turns: int = 5,  # NEW: Limit tool call iterations
    sse_event_callback: Optional[Callable[[str], None]] = None,
):
    """
    Stream text with multi-turn tool calling support.

    Args:
        max_tool_turns: Maximum number of tool call iterations (default: 5)
    """
    # ... setup ...

    conversation_messages = list(messages)
    if system:
        conversation_messages.insert(0, {"role": "system", "content": system})

    for turn in range(max_tool_turns):
        # Make API call
        stream = client.chat.completions.create(
            model=model,
            messages=conversation_messages,  # Updated with tool results
            tools=tool_definitions if tool_definitions else None,
            stream=True,
            temperature=temperature,
            max_completion_tokens=max_completion_tokens,
        )

        # Process stream and collect tool calls
        tool_calls_collected = []
        # ... process chunks, yield events, collect tool calls ...

        # If no tool calls, we're done
        if finish_reason != "tool_calls":
            break

        # Execute tools and add results to conversation
        tool_messages = []
        for tool_call_state in tool_calls_collected:
            tool_result = await execute_tool(tool_call_state, tools)

            # Add tool result message
            tool_messages.append({
                "role": "tool",
                "tool_call_id": tool_call_state["id"],
                "content": json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
            })

        # Add tool results to conversation for next turn
        conversation_messages.extend(tool_messages)

    # ... finish events ...
```

### Step 2: Collect Tool Calls During Streaming

```python
# During chunk processing
tool_calls_collected = []

for chunk in stream:
    # ... process text deltas ...

    # Collect tool calls
    if finish_reason == "tool_calls":
        for index in sorted(tool_calls_state.keys()):
            state = tool_calls_state[index]
            tool_calls_collected.append(state)
```

### Step 3: Execute Tools and Format Results

```python
async def execute_tool(
    tool_call_state: Dict[str, Any],
    tools: Mapping[str, Callable[..., Any]]
) -> Any:
    """Execute a tool and return its result."""
    tool_name = tool_call_state["name"]
    tool_call_id = tool_call_state["id"]
    arguments = tool_call_state["arguments"]

    # Parse arguments
    parsed_arguments = json.loads(arguments) if arguments else {}

    # Get tool function
    tool_function = tools.get(tool_name)
    if not tool_function:
        return {"error": f"Tool '{tool_name}' not found"}

    # Execute tool
    try:
        tool_result = await tool_function(**parsed_arguments)
        return tool_result
    except Exception as e:
        return {"error": str(e)}
```

### Step 4: Add Tool Results to Messages

```python
# After executing all tools
tool_messages = []
for tool_call_state in tool_calls_collected:
    tool_result = await execute_tool(tool_call_state, tools)

    # Format as tool message
    tool_messages.append({
        "role": "tool",
        "tool_call_id": tool_call_state["id"],
        "content": json.dumps(tool_result)  # Must be JSON string
    })

# Add to conversation
conversation_messages.extend(tool_messages)
```

## Important Notes

1. **Tool results must be JSON strings**: OpenAI API expects tool messages with `content` as a JSON string
2. **Tool call IDs must match**: The `tool_call_id` in the tool message must match the `id` from the tool call request
3. **Multiple tool calls**: The LLM can call multiple tools in one turn - collect all of them before executing
4. **Loop limit**: Use `max_tool_turns` to prevent infinite loops (default: 5)
5. **SSE events**: Still yield SSE events for frontend, but also add tool results to conversation

## Example Flow

```
Turn 1:
  User: "What's the weather in San Francisco?"
  LLM: [tool_call: getWeather(city="San Francisco")]
  → Execute tool → Result: {"temperature": 72, "city": "San Francisco"}
  → Add to messages: {role: "tool", tool_call_id: "call_123", content: '{"temperature": 72, ...}'}

Turn 2:
  Messages: [user message, assistant tool_call, tool result]
  LLM: "The weather in San Francisco is 72°F..."
  → Done (no more tool calls)
```

## Testing

After implementing:

1. Test single tool call
2. Test multiple tool calls in one turn
3. Test tool call chains (tool calls another tool)
4. Test tool errors (should still continue conversation)
5. Test max_tool_turns limit
