# Rocket Task Template

**Instructions for Rocket:**
Copy this entire template, fill out all sections, and paste it into `ROCKET_INBOX.md` as a new task. Increment the task number and set the initial status to `TODO`.

---

## Task [NUMBER] – [Short Descriptive Title]

**Status:** `TODO`

**Branch:** _(Devin will fill this in)_

### Summary
_1-2 sentences describing what needs to be done and why._

### Context / Problem
_Detailed explanation of the context, background, and the specific problem this task addresses. Include:_
- Why this task is needed
- What currently exists (if anything)
- What the desired end state looks like
- Any relevant background information or decisions already made

### Target Files / Areas
_List the specific files, directories, or components that will likely need to be modified:_
- `path/to/file1.ts`
- `path/to/file2.tsx`
- `path/to/directory/`
- Or describe the area: "Authentication flow", "Chat components", etc.

### Acceptance Criteria / Definition of Done
_Clear, testable criteria that define when this task is complete. Use checkboxes:_
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] Tests pass
- [ ] Documentation updated (if needed)
- [ ] No new errors or warnings introduced

### Commands to Run
_Specify any commands Devin should run for validation:_
```bash
# Install dependencies (if needed)
pnpm install

# Run tests
pnpm test

# Run linter
pnpm lint

# Start dev server for manual testing
pnpm dev

# Build for production
pnpm build
```

### Additional Context
_(Optional) Include any of the following if relevant:_

**Related Issues/PRs:**
- #123
- PR #456

**Reference Documentation:**
- Link to external docs
- Link to relevant examples
- API documentation

**Examples:**
```typescript
// Example of desired behavior or code structure
```

**Constraints:**
- Must maintain backward compatibility
- Cannot modify X because Y
- Performance requirement: Must load in < 100ms

**Nice to Have (Optional):**
- Additional features that would be nice but not required
- Future enhancements to consider

### Result
_(Devin will fill this section after completing the task)_

**What was implemented:**

**PR Link:**

**Decisions Made:**

**Notes/Caveats:**

**Follow-up Tasks:**

---

## Template Usage Example

Below is an example of how Rocket should fill out this template:

---

## Task 2 – Add Dark Mode Toggle to Settings

**Status:** `TODO`

**Branch:** _(Devin will fill this in)_

### Summary
Add a dark mode toggle switch to the user settings page that persists the user's theme preference.

### Context / Problem
Users have requested the ability to manually switch between light and dark modes. Currently, the app only respects the system theme preference. We need to add a toggle in the settings that allows users to override this with their explicit choice, and persist that preference across sessions.

The app already uses `next-themes` for theme management, so we should integrate with that existing system rather than building something new.

### Target Files / Areas
- `app/(auth)/settings/page.tsx` - Add the toggle UI
- `components/theme-toggle.tsx` - Create new component (or reuse existing)
- `components/theme-provider.tsx` - Ensure proper theme context
- `lib/db/schema.ts` - May need to add user preference column
- `app/(auth)/settings/actions.ts` - Server action to save preference

### Acceptance Criteria / Definition of Done
- [ ] Toggle switch appears in settings page
- [ ] Clicking toggle switches between light/dark mode immediately
- [ ] Theme preference is saved to database
- [ ] Preference persists across page reloads
- [ ] Preference persists across sessions (after logout/login)
- [ ] UI clearly shows current theme selection
- [ ] Works with next-themes system
- [ ] Responsive and accessible (keyboard navigation, ARIA labels)
- [ ] No console errors or warnings
- [ ] Tests pass

### Commands to Run
```bash
# Install dependencies
pnpm install

# Run dev server for manual testing
pnpm dev

# Run tests
pnpm test

# Check for type errors
pnpm tsc --noEmit

# Lint
pnpm lint
```

### Additional Context

**Reference Documentation:**
- [next-themes documentation](https://github.com/pacocoursey/next-themes)
- Existing theme provider: `components/theme-provider.tsx`

**Examples:**
```tsx
// Desired UI might look like:
<div className="flex items-center justify-between">
  <label htmlFor="theme-toggle">Dark Mode</label>
  <Switch id="theme-toggle" checked={isDark} onCheckedChange={handleToggle} />
</div>
```

**Constraints:**
- Must use existing `next-themes` library
- Must persist to database, not just localStorage
- Must work for both authenticated and guest users

**Nice to Have (Optional):**
- Add "System" option alongside Light/Dark
- Animated transition when switching themes
- Preview of theme before applying

### Result
_(Devin will fill this in)_
