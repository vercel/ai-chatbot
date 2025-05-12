# LostMind AI - RooCode Orchestration

## Overview
This directory contains structured prompts for automating the LostMind AI chatbot implementation using the RooCode agent. Each prompt is designed to:

1. Provide complete project context
2. Specify clear technical requirements
3. Include implementation guidelines
4. Define verification steps

## Usage Instructions

### For RooCode Agent
1. Activate Orchestrator Mode in RooCode VSCode extension
2. Reference the main project structure at `/Users/sumitm1/Documents/myproject/Ongoing Projects/VERCEL/ai-chatbot/lostmind-ai-chatbot-vercel/`
3. Process tasks sequentially, starting with Phase 2 tasks
4. Implement according to provided instructions, respecting file paths and patterns

### Task Workflow
1. Read the task prompt completely before implementation
2. Review referenced files to understand context
3. Follow provided code patterns and implementation guidelines
4. Test against specified expected outcomes
5. Mark task as complete and move to next sequential task

## Prompt Structure
Each task prompt follows this standardized format:

```
# Task: [Task Name]

## Context
[Project overview and where this task fits]

## Objective
[Clear, specific goal for this task]

## Requirements
- [Specific feature/implementation requirements]
- [Technical specifications]
- [Brand guidelines to follow]

## File Locations
- Primary: `/path/to/file.tsx` - [what to modify]
- Secondary: `/path/to/other-file.ts` - [what to reference]

## Implementation Guidelines
[Specific code patterns to follow]
[Important API SDK references]
[Any warnings or pitfalls to avoid]

## Expected Outcome
[What the completed task should achieve]
[How to verify success]

## Related Documentation
- [Links to relevant API docs]
- [References to project documentation]
```

## Review Process
After RooCode completes each task:
1. Validate against expected outcomes
2. Test functionality in development environment
3. Check code quality and TypeScript compliance
4. Move completed task prompt to `/completed/` directory
5. Update task-tracker.md in the main project

## Project References
- Project Bible: `/docs/PROJECT_BIBLE.md`
- Task Tracker: `/Tasks/task-tracker.md`
- API Documentation: https://sdk.vercel.ai/docs/api-reference
