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

## 2. Documentation Updates

Review and update documentation as needed:
- Check if package READMEs need updates (`packages/*/README.md`)
- Check if CLAUDE.md needs updates
- Check if demo app examples need updates (`apps/demo/src/app/page.tsx`)
- Ensure all new features/changes are documented
- Verify code examples are accurate and up-to-date

## 3. Test Coverage

Ensure 100% test coverage is maintained:
- Identify any new/modified code that needs tests
- Add or update tests in the affected packages
- Ensure edge cases are covered
- Run `npm run test:coverage` to verify 100% coverage across all packages
- Fix any coverage gaps immediately

## 4. Build All Packages

Build all packages to ensure everything compiles:
- Run `npm run build` to build all packages
- Check for any TypeScript errors
- Verify build outputs are generated correctly

## 5. Run All Tests

Execute comprehensive test suite:
- Run `npm test` to run all tests across workspaces
- Ensure all tests pass
- Check test output for any warnings or issues

## 6. Linting & Type Checking

Run all code quality checks:
- Run `npm run lint` (Biome + ESLint + TypeScript)
- Fix any linting errors or warnings
- Ensure TypeScript strict mode compliance

## 7. Bundle Size Check

Verify bundle sizes are within limits:
- Run `npm run size`
- Ensure core package ≤ 10 KB
- Ensure react-hook-form package ≤ 10 KB
- Flag any size increases for review

## 8. Optional: Performance Benchmarks

If code changes affect performance:
- Run `npm run bench` to check for regressions
- Compare with baseline if significant changes were made

## 9. Final Verification

Before completing:
- Confirm all checks passed ✅
- Confirm 100% test coverage maintained ✅
- Confirm documentation updated ✅
- Confirm no linting errors ✅
- Confirm builds successful ✅
- List any issues found that need attention

## 10. Summary

Provide a concise summary:
- What changed
- What was updated (docs, tests)
- All check results (pass/fail)
- Whether the code is ready for release
- Any remaining action items

**Note:** If any check fails, stop and fix the issue before proceeding to the next step.
