# Contributing to Zod Utils

Thank you for your interest in contributing to Zod Utils! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 24.x (see `.nvmrc` - currently 24.11.0)
- npm 10.x or higher

### Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/thu-san/zod-utils.git
   cd zod-utils
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run tests to ensure everything is working:

   ```bash
   npm test
   ```

## Project Structure

This is a monorepo using npm workspaces:

```sh
zod-utils/
├── packages/
│   ├── core/              # Core utilities for Zod schemas
│   └── react-hook-form/   # React Hook Form integration
└── apps/
    └── demo/              # Demo Next.js application
```

## Development Workflow

### Making Changes

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Add tests for your changes:

   ```bash
   npm test
   ```

4. Ensure code quality:

   ```bash
   npm run check:fix    # Format and lint with Biome
   npm run build        # Build all packages
   ```

### Coding Standards

- **Code Style**: We use [Biome](https://biomejs.dev/) for formatting and linting

  - Run `npm run check:fix` to auto-fix issues
  - Use single quotes, 2-space indentation, semicolons
  - Trailing commas on multi-line structures

- **TypeScript**: All code must be properly typed

  - Avoid using `any` when possible
  - Add JSDoc comments for public APIs
  - Run `npm run type-check` in each package

- **Testing**: All new features must include tests

  - Write unit tests using Vitest
  - Aim for high coverage on public APIs
  - Test both success and error cases

- **Commits**: Write clear, descriptive commit messages
  - Use conventional commit format: `feat:`, `fix:`, `docs:`, `chore:`, etc.
  - Keep commits focused on a single change
  - Reference issues in commit messages: `fixes #123`

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Building Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:rhf
```

### Working on Specific Packages

```bash
# Core package
cd packages/core
npm run dev        # Watch mode
npm run build      # Build
npm run test       # Test

# React Hook Form package
cd packages/react-hook-form
npm run dev        # Watch mode
npm run build      # Build
npm run test       # Test
```

## Documentation

- Update README files when adding features
- Add JSDoc comments to all public functions
- Include code examples in documentation
- Update TypeScript types in exported APIs

### JSDoc Format

````typescript
/**
 * Brief description of what the function does
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @example
 * ```ts
 * const result = myFunction(input);
 * ```
 */
export function myFunction(paramName: string): ReturnType {
  // implementation
}
````

## Automated Dependency Management

This project uses **Renovate** for automated dependency updates. You generally don't need to manually update dependencies.

### How It Works

- **Renovate bot** automatically creates PRs for dependency updates
- Updates are grouped intelligently:
  - Dev dependencies grouped together
  - TypeScript packages grouped together
  - Testing packages grouped together
  - Build tools grouped together
- Minor and patch updates are **auto-merged** after CI passes
- Major updates require manual review

### What This Means for Contributors

- **Don't manually update dependencies** unless specifically needed for your feature
- If you see Renovate PRs, they'll be handled by maintainers
- Focus on your feature work - dependency updates happen automatically
- Security vulnerabilities are patched automatically with high priority

### Dependency Update PRs

If you need to add a new dependency:

1. Add it to the appropriate `package.json`
2. Run `npm install` to update `package-lock.json`
3. Include the dependency change in your PR
4. Renovate will manage future updates automatically

### Security Scans

All PRs are automatically scanned for:

- **Vulnerable dependencies** (via npm audit)
- **License compliance** (GPL/AGPL licenses are blocked)
- **Dependency security** (via GitHub Dependency Review)

If your PR introduces a vulnerability or incompatible license, CI will fail and provide details.

## Pull Request Process

1. **Create a Pull Request**

   - Use the PR template
   - Fill out all sections completely
   - Link related issues

2. **PR Requirements**

   - All tests must pass
   - Code must be formatted with Biome
   - No TypeScript errors
   - Documentation updated if needed
   - At least one approval required

3. **CI Checks**
   All PRs must pass:

   - Biome linting/formatting
   - Unit tests on Node 18, 20, 22 & 24
   - Build verification
   - TypeScript type checking
   - npm security audit
   - Dependency review (security & license checks)
   - Performance benchmarks

4. **Review Process**
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Once approved, maintainers will merge

## Reporting Bugs

- Use the bug report template
- Include minimal reproduction
- Provide environment details
- Check existing issues first

## Suggesting Features

- Use the feature request template
- Explain the use case clearly
- Show example API if possible
- Discuss in issues before implementing large features

## Release Process

We use **automated releases** with Changesets and GitHub Actions.

### For Contributors

Add a changeset to your PR:

```bash
npx changeset
```

The changeset describes what changed and will be used for version bumps and changelogs.

### For Maintainers

Releases are automated via GitHub Actions:

1. **Changesets bot creates a "Version Packages" PR** (automatic)

   - Triggered when changeset files are merged to main
   - Contains version bumps and CHANGELOG updates

2. **Merge the PR when ready to release** (manual approval)

   - Review the changes
   - Merge to trigger automatic publishing

3. **GitHub Actions publishes to npm** (automatic)
   - Runs tests and builds
   - Publishes packages
   - Creates GitHub release

For detailed instructions and manual fallback, see [RELEASING.md](./RELEASING.md).

**Note:** Only maintainers with npm publish access can release packages.

## Questions?

- Open a [Discussion](https://github.com/thu-san/zod-utils/discussions)
- Check existing [Issues](https://github.com/thu-san/zod-utils/issues)
- Read the [Documentation](./README.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
