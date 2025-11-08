# Next Steps

This document outlines the next steps for deploying and improving the Zod Utils monorepo.

## 🚀 Immediate Actions (Required for Release)

### 1. Push to GitHub

```bash
# Review all changes
git status

# Stage all files
git add .

# Create initial commit
git commit -m "feat: complete monorepo setup with comprehensive tooling

- Add @zod-utils/core package with schema utilities
- Add @zod-utils/react-hook-form package with RHF integration
- Set up Biome for linting and formatting
- Add comprehensive test suite (113 tests)
- Configure GitHub Actions CI/CD
- Add i18n support (English + Japanese)
- Include complete documentation and templates"

# Push to GitHub
git push origin main
```

### 2. Configure GitHub Repository Settings

1. **Enable GitHub Discussions** (for community Q&A)
   - Settings → Features → Check "Discussions"

2. **Set up Branch Protection** (optional but recommended)
   - Settings → Branches → Add rule for `main`
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select: CI workflow checks

3. **Add Repository Secrets**
   - Settings → Secrets and variables → Actions → New repository secret
   - `NPM_TOKEN`: Create at https://www.npmjs.com/settings/[username]/tokens
     - Choose "Automation" token type
     - Add to GitHub secrets
   - `CODECOV_TOKEN` (optional): Sign up at https://codecov.io

### 3. Verify npm Scope Ownership (CRITICAL)

**⚠️ YOU MUST DO THIS BEFORE PUBLISHING ⚠️**

The packages use the `@zod-utils` npm scope. You need to verify you own this scope:

```bash
# Check who you're logged in as
npm whoami

# Check if you have access to the @zod-utils scope
npm access list collaborators @zod-utils/core

# If the scope doesn't exist, you have two options:

# Option 1: Create an npm organization for the scope
# Go to: https://www.npmjs.com/org/create
# Create organization named "zod-utils"

# Option 2: Use your personal scope instead
# Replace @zod-utils with @your-username in ALL package.json files:
# - packages/core/package.json
# - packages/react-hook-form/package.json
# - apps/demo/package.json (dependencies)
# - Root README.md (examples)
```

**If the scope is already taken by someone else**, you MUST:
1. Choose a different scope name (e.g., `@thu-san/zod-utils-core`)
2. Update ALL package.json files with the new scope
3. Update ALL documentation with the new scope

### 4. Publish Packages to npm

#### Option A: Manual First Release

```bash
# Build all packages
npm run build

# Verify builds
ls -la packages/core/dist
ls -la packages/react-hook-form/dist

# Login to npm (if not already)
npm login

# Publish packages
npm run publish:all
```

#### Option B: Automated Release via GitHub

```bash
# Create a version tag
git tag v0.1.0

# Push the tag (triggers GitHub Actions release workflow)
git push origin v0.1.0
```

### 4. Test Published Packages

Create a test project to verify the packages work:

```bash
mkdir test-zod-utils
cd test-zod-utils
npm init -y
npm install @zod-utils/core @zod-utils/react-hook-form zod react-hook-form

# Create test file and verify imports work
```

## 📋 Short-term Improvements (Recommended)

### 1. Add More Core Utilities

Create additional schema helper functions:

- `mergeSchemas()` - Merge multiple Zod schemas
- `pickSchema()` - Pick specific fields from schema
- `omitSchema()` - Omit fields from schema
- `partialSchema()` - Make all fields optional
- `deepPartialSchema()` - Make all nested fields optional

### 2. Bundle Size Monitoring

```bash
# Install size-limit
npm install --save-dev @size-limit/preset-small-lib

# Add to package.json
{
  "size-limit": [
    {
      "path": "packages/core/dist/index.js",
      "limit": "10 KB"
    },
    {
      "path": "packages/react-hook-form/dist/index.js",
      "limit": "15 KB"
    }
  ]
}
```

### 3. Set up Changesets for Versioning

```bash
# Install changesets
npm install --save-dev @changesets/cli

# Initialize
npx changeset init

# Add changeset workflow to .github/workflows/
```

### 4. Improve Documentation

- Add more usage examples to package READMEs
- Create API documentation site (e.g., with TypeDoc or Docusaurus)
- Add migration guides for major versions
- Create video tutorials or GIFs showing usage

### 5. Performance Optimizations

- Add benchmark tests
- Profile schema validation performance
- Optimize recursive functions in defaults.ts
- Consider memoization for frequently called functions

## 🔄 Medium-term Enhancements

### 1. Additional Packages

Consider creating:
- `@zod-utils/formik` - Formik integration
- `@zod-utils/tanstack-form` - TanStack Form integration
- `@zod-utils/testing` - Testing utilities for Zod schemas

### 2. Enhanced Type Safety

- Add stricter TypeScript configurations
- Improve type inference for utility functions
- Add type tests using `@ts-expect-error` patterns

### 3. Developer Experience

- Add VSCode extension recommendations (`.vscode/extensions.json`)
- Create code snippets for common patterns
- Add debug configurations
- Improve error messages with suggestions

### 4. Community Building

- Create Discord/Slack community
- Start a blog with usage tips
- Create Twitter/X account for updates
- Record video tutorials

## 🎯 Long-term Goals

### 1. Ecosystem Growth

- Partner with form libraries
- Create official integrations
- Build plugin system
- Support community contributions

### 2. Advanced Features

- Schema composition utilities
- Schema migration helpers
- Schema visualization tools
- Runtime schema introspection

### 3. Documentation Site

Build a full documentation site with:
- Interactive playground
- Live examples
- API reference
- Tutorial series
- Migration guides

## 📝 Maintenance Tasks

### Regular Updates

- [ ] Update dependencies monthly
- [ ] Review and merge community PRs
- [ ] Triage issues weekly
- [ ] Release patch versions for bugs
- [ ] Release minor versions for features
- [ ] Plan major versions carefully

### Quality Assurance

- [ ] Maintain test coverage above 80%
- [ ] Run security audits regularly
- [ ] Monitor bundle size
- [ ] Check accessibility
- [ ] Review performance metrics

## 🐛 Known Issues to Address

1. **Vite CJS Warning**: Upgrade to Vitest with ESM support when stable
2. **Array Index Key Warning**: Consider using error message as key instead
3. **Node Module Vulnerabilities**: Run `npm audit fix` and review

## 📚 Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Biome Documentation](https://biomejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## ❓ Need Help?

- Check [CONTRIBUTING.md](./CONTRIBUTING.md)
- Open a [Discussion](https://github.com/thu-san/zod-utils/discussions)
- File an [Issue](https://github.com/thu-san/zod-utils/issues)
