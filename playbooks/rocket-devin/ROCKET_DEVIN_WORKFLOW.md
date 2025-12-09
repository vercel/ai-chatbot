# Rocket ⇄ Devin Workflow

This document describes the collaborative workflow between Rocket (AI Architect) and Devin (AI Developer) for the TiQology AI Chatbot project.

## Overview

This workflow enables asynchronous task delegation from Rocket to Devin, creating a seamless AI-to-AI collaboration pipeline for implementing features, fixing bugs, and maintaining the codebase.

## Workflow Steps

### 1. Rocket Writes Task

**Rocket's responsibilities:**
- Identify a task that needs implementation
- Fill out the `ROCKET_TASK_TEMPLATE.md` with complete details
- Copy the filled template into `ROCKET_INBOX.md` as a new task
- Set the status to `TODO`
- Include all necessary context, target files, and acceptance criteria

### 2. Devin Picks Up Task

**Devin's responsibilities:**
- Regularly monitor `ROCKET_INBOX.md` for new tasks
- When a `TODO` task is found:
  - Update status to `IN PROGRESS`
  - Create a feature branch following naming convention: `feature/<task-description>`
  - Fill in the branch name in the task

### 3. Devin Implements Solution

**Devin's responsibilities:**
- Read and understand the task requirements
- Analyze the codebase to identify affected areas
- Implement the solution following best practices
- Run any specified tests or validation commands
- Ensure code quality and consistency with existing patterns

### 4. Devin Opens Pull Request

**Devin's responsibilities:**
- Commit changes with clear, descriptive commit messages
- Open a pull request with:
  - Title that summarizes the change
  - Description that references the task
  - Link to the task in `ROCKET_INBOX.md`
- Run any CI/CD checks

### 5. Devin Updates Task Status

**Devin's responsibilities:**
- Update the task in `ROCKET_INBOX.md`:
  - Set status to `DONE`
  - Fill in the Result section with:
    - Summary of what was implemented
    - Link to the PR
    - Any notes, caveats, or decisions made
    - Any follow-up tasks identified

### 6. Human Review & Merge

**Human responsibilities:**
- Review the PR
- Provide feedback if needed
- Merge when approved
- Optionally archive completed tasks from inbox

## Task Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Rocket identifies need → Fills template → Adds to inbox   │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Status: TODO  │
              └────────┬───────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Devin picks up task         │
        │  Creates feature branch      │
        │  Status: IN PROGRESS         │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Devin implements solution   │
        │  Runs tests                  │
        │  Opens PR                    │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Devin updates task          │
        │  Status: DONE                │
        │  Adds PR link & notes        │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Human reviews & merges      │
        │  Optionally archives task    │
        └──────────────────────────────┘
```

## Branch Naming Conventions

- **Features**: `feature/<descriptive-name>`
- **Bug fixes**: `fix/<issue-description>`
- **Chores**: `chore/<task-description>`
- **Refactoring**: `refactor/<area-being-refactored>`

Examples:
- `feature/add-user-authentication`
- `fix/reasoning-display-gemini`
- `chore/update-dependencies`
- `refactor/message-components`

## Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add Google OAuth integration

Implemented Google OAuth login flow with proper session management.
Closes #123

fix(chat): resolve reasoning display for Gemini models

Updated middleware configuration to use Gemini's thinking model.
Addresses issue with extractReasoningMiddleware.
```

## Communication Protocol

### Rocket → Devin
- Use `ROCKET_INBOX.md` for all task assignments
- Provide complete context and clear acceptance criteria
- Reference relevant files, PRs, or issues
- Specify any commands that need to be run

### Devin → Rocket
- Update task status in real-time
- Document all decisions made during implementation
- Flag any blockers or questions in the Result section
- Provide PR links for review

### Devin → Human
- Open PRs with clear descriptions
- Link back to the task in `ROCKET_INBOX.md`
- Highlight any architectural decisions that need review

## Best Practices

### For Rocket (Task Creation)
1. ✅ Be specific about the problem being solved
2. ✅ Provide context and background
3. ✅ List target files or components
4. ✅ Define clear acceptance criteria
5. ✅ Include any relevant examples or references
6. ❌ Don't leave requirements ambiguous
7. ❌ Don't skip the template sections

### For Devin (Task Execution)
1. ✅ Read the entire task before starting
2. ✅ Ask for clarification if requirements are unclear
3. ✅ Follow existing code patterns and conventions
4. ✅ Test changes thoroughly
5. ✅ Update documentation when needed
6. ✅ Keep commits atomic and well-described
7. ❌ Don't make unnecessary changes outside scope
8. ❌ Don't skip tests or validation steps

## Handling Edge Cases

### Task is Unclear
- Devin updates task status to `BLOCKED`
- Adds questions in the Result section
- Waits for Rocket or human to clarify

### Task Requires Breaking Changes
- Devin notes this in the Result section
- Implements with feature flags if possible
- Documents migration path in PR

### Task Depends on Other Work
- Devin notes dependency in Result section
- Optionally creates a draft PR
- Waits for dependency to merge first

### Task is Too Large
- Devin breaks it into sub-tasks
- Creates multiple smaller PRs
- Updates original task to track progress

## Metrics & Success Criteria

Track these metrics to measure workflow effectiveness:
- Time from TODO → DONE
- Number of PR iterations before merge
- Task clarity score (subjective, based on back-and-forth)
- Code quality (based on review feedback)

## Archive Policy

Completed tasks should be moved to an archive file quarterly:
- Create `ROCKET_INBOX_ARCHIVE_<YYYY-QQ>.md`
- Move tasks with status `DONE` older than 30 days
- Keep active/recent tasks in main inbox

## Future Enhancements

Potential improvements to this workflow:
- [ ] Automated task notification system
- [ ] Integration with GitHub Issues/Projects
- [ ] Task priority/severity levels
- [ ] Automated testing requirements
- [ ] Performance benchmarks for tasks
- [ ] Template variations for different task types
