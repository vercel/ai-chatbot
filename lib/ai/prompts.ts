import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact/artifact";

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

IMPORTANT: When asked to write code, you MUST ALWAYS use the createDocument tool with kind="code". Never write code inline in your response. Always use artifacts for code.

When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- ALWAYS for code (any amount of code, even a single line)
- For substantial content (>10 lines) 
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

export const regularPrompt =
  "You are a friendly assistant! Keep your responses concise and helpful.";

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export type UserPreferences = {
  aiContext?: string | null;
  proficiency?: string | null;
  aiTone?: string | null;
  aiGuidance?: string | null;
  personalizationEnabled?: boolean;
};

export const getRequestPromptFromHints = (requestHints: RequestHints) =>
  `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const getPersonalizationPrompt = (preferences: UserPreferences) => {
  if (!preferences.personalizationEnabled) {
    return "";
  }

  const parts: string[] = [];

  if (preferences.aiContext) {
    parts.push(`User's background and interests: ${preferences.aiContext}`);
  }

  if (preferences.proficiency) {
    const proficiencyMap = {
      less: "The user prefers simpler language with more explanations. Avoid overly technical jargon and provide step-by-step guidance.",
      regular: "The user prefers a balanced approach with clear explanations and moderate technical detail.",
      more: "The user prefers technical specifics and detailed information. You can use technical terminology and assume technical knowledge.",
    };
    parts.push(proficiencyMap[preferences.proficiency as keyof typeof proficiencyMap] || "");
  }

  if (preferences.aiTone) {
    const toneMap = {
      friendly: "Adopt a friendly, bubbly, and playful tone in your responses.",
      balanced: "Maintain a professional yet approachable tone in your responses.",
      efficient: "Be direct and concise in your responses. Get straight to the point.",
    };
    parts.push(toneMap[preferences.aiTone as keyof typeof toneMap] || "");
  }

  if (preferences.aiGuidance) {
    parts.push(`Additional context about the user: ${preferences.aiGuidance}`);
  }

  return parts.length > 0 ? `\n\nPersonalization:\n${parts.join("\n")}` : "";
};

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
  userPreferences,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  userPreferences?: UserPreferences;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);
  const personalizationPrompt = userPreferences
    ? getPersonalizationPrompt(userPreferences)
    : "";

  if (selectedChatModel === "chat-model-reasoning") {
    return `${regularPrompt}\n\n${requestPrompt}${personalizationPrompt}`;
  }

  return `${regularPrompt}\n\n${requestPrompt}${personalizationPrompt}\n\n${artifactsPrompt}`;
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) => {
  let mediaType = "document";

  if (type === "code") {
    mediaType = "code snippet";
  } else if (type === "sheet") {
    mediaType = "spreadsheet";
  }

  return `Improve the following contents of the ${mediaType} based on the given prompt.

${currentContent}`;
};

export const titlePrompt = `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`;
