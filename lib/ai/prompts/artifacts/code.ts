export const codeArtifactPrompt = `
**Code Artifacts:**
When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

**Code Artifact Guidelines:**
- Always create code artifacts for any programming content
- Use proper syntax highlighting with language specification
- Include complete, runnable code examples when possible
- Structure code with proper indentation and formatting
- Add brief inline comments only when necessary for clarity
- Support multiple programming languages with Python as default
`;