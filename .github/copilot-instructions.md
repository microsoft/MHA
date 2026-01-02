## Project Context

Message Header Analyzer (MHA) - Outlook add-in for analyzing email headers. See README.md for full feature list and usage.

**Development Workflow:**
- User runs `npm run dev-server` for local development - don't ask to build unless there are errors
- Webpack handles compilation and hot reload automatically
- Test in Outlook Desktop with Debug tasks when needed

## Development Principles

- **Zero tolerance for errors AND warnings**: ALL errors and warnings from ANY source (build, TypeScript, ESLint, tests) must be fixed - warnings are errors, don't introduce problems
- **Stop on unexpected errors**: Present options instead of chasing fixes wildly
- **Check in frequently**: Commit often for incremental testing
- **Minimal dependencies**: Discuss before adding new packages
- **No legacy code**: Remove old code completely when updating
- **No process comments**: Don't add "Phase 1", "TODO", or development process comments
- **Keep README current**: When adding features/commands/options, update README.md in the same change
- **Don't create markdown files**: Never create new .md files (README, TODO, etc.) without being asked
- **Let user commit**: Don't auto-commit changes - present what's done and let user commit when ready
- **Complete all planned work**: When outlining a multi-step plan, implement ALL parts - don't stop partway and declare "good enough". Only the user decides when work is complete.
- **Don't duplicate functionality**: Reuse existing code when possible - if unsure about options, ask first
- **Fix everything you find**: When user says "fix X", fix ALL instances of X everywhere. If you find related issues while fixing, fix those too. Don't say "this is for later" - either fix it now or explicitly offer to add it to TODO.md. The user will tell you if something should be deferred.
- **No deferring without permission**: Never skip fixing something because it seems hard or time-consuming. If you think something should be deferred, explicitly ask: "Should I add this to TODO.md or fix it now?"

## Code Standards

### TypeScript
- **Pure TypeScript**: No JavaScript files - everything must be .ts
- **Pure ES Modules**: `"type": "module"` in package.json, no CommonJS
- Strict mode with all safety flags enabled
- No implicit `any`
- **Never use `unknown` type** - use proper types or type assertions
- No unsafe operations
- Explicit return types required
- Use type assertions (`as Type`) when unavoidable

### HTML/CSS
- **No inline code or styles**: Keep JavaScript and CSS in separate files
- Use external TypeScript modules compiled to ES modules
- Use external CSS files linked in HTML

### ESLint
- Max complexity: 15 (only ignore for legitimately complex functions)
- Explicit function return types required
- No `any` types
- K&R brace style
- **No trailing whitespace**: ESLint will fail on any trailing spaces or extra blank lines - never add them
- Fix issues properly - **never disable rules to bypass problems**

### Error Handling
- Let errors propagate naturally with typed errors
- Use try/catch only when required by dependencies
- Provide meaningful error messages

## Common Patterns

### Type Assertions (when unavoidable)
```typescript
const data = JSON.parse(jsonString) as SomeType[];
const element = document.getElementById('id') as HTMLElement;
```

### Complexity Exceptions (use sparingly)
```typescript
// eslint-disable-next-line complexity
async function legitimatelyComplexFunction() { }
```

## Anti-Patterns to Avoid

❌ Disabling ESLint rules to bypass problems
❌ Using `any` or `unknown` without type assertions
❌ Adding TODO/Phase comments in code
❌ Keeping deprecated/legacy code
❌ Guessing at fixes - stop and ask instead

## Testing Requirements

- All tests must pass before committing
- Test failures are NEVER expected - if tests fail, fix the code or fix the tests
- Run `npm test` after any code changes
- Run `npm run lint` to verify no ESLint errors

### TDD Approach for Bug Fixes

When fixing bugs identified in code reviews or reported issues:

1. **Write failing test first**: Create a test that demonstrates the bug - it MUST FAIL with the current buggy code
2. **Apply the fix**: Implement the code changes to address the bug
3. **Verify test passes**: Run the test again - it should now PASS with the fixed code
4. **If test still fails**: Reconsider whether the fix is incorrect OR the test is incorrect
5. **If test was incorrect**: Fix the test, then retest with OLD buggy code to verify it fails there, then retest with NEW fixed code to verify it passes

This approach ensures:
- The bug actually exists and is reproducible
- The fix actually solves the problem
- We have regression protection going forward

## Workflow for Changes

**Development:**
- User runs `npm run dev-server` - don't ask to start it
- Webpack dev server handles compilation and hot reload
- Make code changes and test in browser/Outlook

**Testing:**
- `npm test` - Run tests
- `npm run lint` - ESLint check
- `npm run lint:fix` - Auto-fix ESLint issues
