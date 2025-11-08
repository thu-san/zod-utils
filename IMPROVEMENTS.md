# Recommended Improvements

This document outlines specific improvements identified during the repository audit.

## 🔴 Critical (Fix Before Release)

### 1. Fix Demo App TypeScript Error

**Location:** `apps/demo/src/app/page.tsx:313`

**Problem:**
```typescript
// Current issue: title is optional in schema but required in handler
const formSchema = z.object({
  title: z.string().optional(), // ❌ Optional here
  // ...
});

const onSubmit = (data: { title: string; ... }) => {
  // ❌ But required here - type mismatch
};
```

**Solution A - Make title required:**
```typescript
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  age: z.number(),
  description: z.string(),
  email: z.string().email().optional(),
});
```

**Solution B - Handle optional in handler:**
```typescript
const onSubmit = (data: z.infer<typeof formSchema>) => {
  if (!data.title) {
    toast.error('Title is required');
    return;
  }
  // Now data.title is narrowed to string
  console.log('Form submitted:', data);
};
```

---

## 🟡 Recommended (Should Fix Soon)

### 2. Fix Array Index Key Warning

**Location:** `apps/demo/src/components/ui/field.tsx:235`

**Current:**
```tsx
{uniqueErrors.map((error, index) =>
  error?.message && <li key={index}>{error.message}</li>
)}
```

**Better:**
```tsx
{uniqueErrors.map((error) =>
  error?.message && <li key={error.message}>{error.message}</li>
)}
```

**Why:** Using index as key can cause React reconciliation issues if the array order changes.

---

### 3. Add Author Information

Update both package.json files:

**packages/core/package.json:**
```json
{
  "author": "thu-san <your-email@example.com>",
  "contributors": []
}
```

**packages/react-hook-form/package.json:**
```json
{
  "author": "thu-san <your-email@example.com>",
  "contributors": []
}
```

---

### 4. Add Test Coverage Thresholds

**Create: packages/core/vitest.config.ts update:**
```typescript
export default defineConfig({
  test: {
    // ... existing config
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.config.*', '**/dist/**', '**/*.test.*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

---

## ⚪ Optional Enhancements

### 5. Add VS Code Workspace Settings

**Create: .vscode/settings.json:**
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Create: .vscode/extensions.json:**
```json
{
  "recommendations": [
    "biomejs.biome",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

---

### 6. Add More JSDoc Comments

**Example for core package:**
```typescript
/**
 * Extracts default values from a Zod schema while skipping fields without defaults.
 *
 * This function recursively traverses the schema and collects all fields that have
 * explicit default values defined. Fields without defaults are excluded from the result.
 *
 * @template T - The Zod object schema type
 * @param schema - The Zod object schema to extract defaults from
 * @returns A partial object containing only fields with default values
 *
 * @example
 * Basic usage
 * ```typescript
 * const schema = z.object({
 *   name: z.string().default('John'),
 *   age: z.number(), // no default - will be skipped
 *   email: z.string().email().optional(),
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { name: 'John' }
 * ```
 *
 * @example
 * Nested objects
 * ```typescript
 * const schema = z.object({
 *   user: z.object({
 *     profile: z.object({
 *       avatar: z.string().default('/default.png'),
 *     }),
 *   }),
 * });
 *
 * const defaults = getSchemaDefaults(schema);
 * // Result: { user: { profile: { avatar: '/default.png' } } }
 * ```
 *
 * @see {@link extractDefault} for extracting defaults from individual fields
 * @since 0.1.0
 */
export function getSchemaDefaults<T extends z.ZodObject<any>>(
  schema: T,
): Partial<z.infer<T>> {
  // implementation
}
```

---

### 7. Add Bundle Size Limits

**Install:**
```bash
npm install --save-dev @size-limit/preset-small-lib
```

**Add to root package.json:**
```json
{
  "scripts": {
    "size": "size-limit"
  },
  "size-limit": [
    {
      "name": "@zod-utils/core",
      "path": "packages/core/dist/index.js",
      "limit": "10 KB"
    },
    {
      "name": "@zod-utils/react-hook-form",
      "path": "packages/react-hook-form/dist/index.js",
      "limit": "15 KB"
    }
  ]
}
```

---

### 8. Add SECURITY.md

**Create: SECURITY.md:**
```markdown
# Security Policy

## Supported Versions

Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please email thu-san@example.com

Please do NOT open a public issue for security vulnerabilities.

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

When using these packages:
1. Always validate user input with Zod schemas
2. Keep dependencies up to date
3. Review error messages for sensitive data exposure
4. Use TypeScript strict mode
```

---

### 9. Add Changesets for Versioning

**Install:**
```bash
npm install --save-dev @changesets/cli
npx changeset init
```

**Create: .github/workflows/release.yml update:**
```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: npm run publish:all
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

### 10. Add More Utilities to Core Package

**File: packages/core/src/merge.ts:**
```typescript
import * as z from 'zod';

/**
 * Merges two Zod object schemas
 */
export function mergeSchemas<
  A extends z.ZodRawShape,
  B extends z.ZodRawShape,
>(
  schemaA: z.ZodObject<A>,
  schemaB: z.ZodObject<B>,
): z.ZodObject<A & B> {
  return schemaA.merge(schemaB);
}
```

**File: packages/core/src/pick.ts:**
```typescript
import * as z from 'zod';

/**
 * Creates a new schema with only the specified keys
 */
export function pickSchema<
  T extends z.ZodRawShape,
  K extends keyof T,
>(
  schema: z.ZodObject<T>,
  keys: K[],
): z.ZodObject<Pick<T, K>> {
  return schema.pick(
    keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<K, true>),
  );
}
```

**File: packages/core/src/omit.ts:**
```typescript
import * as z from 'zod';

/**
 * Creates a new schema without the specified keys
 */
export function omitSchema<
  T extends z.ZodRawShape,
  K extends keyof T,
>(
  schema: z.ZodObject<T>,
  keys: K[],
): z.ZodObject<Omit<T, K>> {
  return schema.omit(
    keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<K, true>),
  );
}
```

---

## 📊 Priority Order

1. **Critical** (Before v0.1.0 release)
   - Fix demo app TypeScript error

2. **High Priority** (v0.1.1)
   - Add author information
   - Fix array index key warning
   - Add test coverage thresholds

3. **Medium Priority** (v0.2.0)
   - Add VS Code settings
   - Add more JSDoc comments
   - Add bundle size limits
   - Add SECURITY.md

4. **Low Priority** (v0.3.0+)
   - Set up Changesets
   - Add more core utilities
   - Create additional locales

---

## 🎯 Implementation Timeline

**Week 1:**
- Fix critical issues
- Release v0.1.0

**Week 2-3:**
- Implement high priority items
- Release v0.1.1

**Month 2:**
- Work on medium priority items
- Plan v0.2.0 release

**Quarter 2:**
- Low priority enhancements
- Community-driven features

---

## 📝 Notes

- All improvements are optional except the critical ones
- Prioritize based on community feedback after release
- Consider creating issues for each improvement
- Tag issues with appropriate labels (enhancement, documentation, etc.)
