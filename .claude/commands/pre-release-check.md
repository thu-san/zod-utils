---
description: Comprehensive pre-release check - reviews changes, updates docs/tests, runs all validations
---

# Pre-Release Check

Perform a comprehensive pre-release check for the zod-utils monorepo. Follow these steps systematically:

## 1. Review Current Changes

Check what's been changed:
- Run `git status` to see modified files
- Run `git diff --cached` for staged changes
- Run `git diff` for unstaged changes
- Summarize the changes and their scope

## 2. Code Consistency Checks

**IMPORTANT:** These checks prevent common oversights. Do NOT skip them.

### Renaming/Refactoring
When any function, type, or variable is renamed:
- **Search for ALL occurrences** of the old name using Grep (including JSDoc examples, comments, README files)
- Verify JSDoc `@example` blocks use the correct/current API names
- Check that code examples in comments match the actual implementation

### Import Style Consistency
Before adding new imports:
- Check how existing files in the same package import the same module
- Use the same import style (e.g., `import type { z } from 'zod'` vs `import type z from 'zod'`)
- Run: `grep -r "import.*from 'module-name'" packages/*/src/*.ts` to see existing patterns

### Export Verification
When adding new exports:
- Verify they are properly exported from the package's `index.ts`
- Check the built `.d.ts` file to confirm exports are included

## 3. Documentation Updates

Review and update documentation as needed:
- Check if package READMEs need updates (`packages/*/README.md`)
- Check if CLAUDE.md needs updates
- Check if demo app examples need updates (`apps/demo/src/app/page.tsx`)
- Ensure all new features/changes are documented
- Verify code examples are accurate and up-to-date

## 4. Test Coverage

**REQUIRED:** Always run coverage check - do NOT skip this step.

1. **Run coverage check first:**
   ```bash
   npm run test:coverage
   ```

2. **Verify 100% coverage is maintained:**
   - Check that all packages show 100% line coverage
   - If coverage drops below 100%, identify and fix gaps immediately
   - Do NOT proceed until coverage is restored to 100%

3. **If new code was added:**
   - Identify any new/modified code that needs tests
   - Add or update tests in the affected packages
   - Ensure edge cases are covered
   - Re-run `npm run test:coverage` to confirm 100%

## 5. Build All Packages

Build all packages to ensure everything compiles:
- Run `npm run build` to build all packages
- Check for any TypeScript errors
- Verify build outputs are generated correctly

## 6. Run All Tests

Execute comprehensive test suite:
- Run `npm test` to run all tests across workspaces
- Ensure all tests pass
- Check test output for any warnings or issues

## 7. Linting & Type Checking

Run all code quality checks:
- Run `npm run lint` (Biome + ESLint + TypeScript)
- Fix any linting errors or warnings
- Ensure TypeScript strict mode compliance

## 8. Bundle Size Check

Verify bundle sizes are within limits:
- Run `npm run size`
- Ensure core package ≤ 10 KB
- Ensure react-hook-form package ≤ 10 KB
- Flag any size increases for review

## 9. Optional: Performance Benchmarks

If code changes affect performance:
- Run `npm run bench` to check for regressions
- Compare with baseline if significant changes were made

## 10. Changeset

Create a changeset file for version bumping:

1. **Determine version bump type** based on changes:
   - `patch`: Bug fixes, documentation updates, internal refactors
   - `minor`: New features, new exports, backward-compatible additions
   - `major`: Breaking changes (API changes, removed exports)

2. **IMPORTANT:** Both `@zod-utils/core` and `@zod-utils/react-hook-form` must have the same version - **always include both packages in the changeset**, even if only one package has changes.

3. **Create the changeset file** directly (since `npx changeset` is interactive):
   - Generate a random filename: `.changeset/<random-word>-<random-word>-<random-word>.md`
   - Use the Write tool to create the file with this format:
   ```markdown
   ---
   "@zod-utils/core": <patch|minor|major>
   "@zod-utils/react-hook-form": <patch|minor|major>
   ---

   <Brief summary of what changed and why it matters to users>
   ```

4. **Example changeset file** (`.changeset/friendly-pandas-smile.md`):
   ```markdown
   ---
   "@zod-utils/core": minor
   "@zod-utils/react-hook-form": minor
   ---

   Add transform support to getSchemaDefaults and extractFieldFromSchema
   ```

5. **Commit the changeset file** along with other changes

## 11. Final Verification

Before completing:
- Confirm all checks passed ✅
- Confirm 100% test coverage maintained ✅
- Confirm documentation updated ✅
- Confirm no linting errors ✅
- Confirm builds successful ✅
- Confirm changeset description provided ✅
- List any issues found that need attention

## 12. Summary

Provide a concise summary:
- What changed
- What was updated (docs, tests)
- All check results (pass/fail)
- Whether the code is ready for release
- Any remaining action items

**Note:** If any check fails, stop and fix the issue before proceeding to the next step.
