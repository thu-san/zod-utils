# Release Process

This project uses [Changesets](https://github.com/changesets/changesets) with automated GitHub Actions for releases.

## Quick Start

**For Contributors:**

```bash
# Add a changeset to your PR
npx changeset
```

**For Maintainers:**

1. Merge the automated "Version Packages" PR
2. GitHub Actions publishes to npm automatically ✨

---

## Automated Workflow (Recommended)

### How It Works

1. **Developer adds changeset** (in their PR)

   ```bash
   npx changeset
   # Follow prompts to select packages and bump type
   ```

2. **Changesets bot creates PR** (automatically)

   - When changeset files are pushed to `main`
   - PR titled "chore: version packages"
   - Contains version bumps and CHANGELOG updates

3. **Maintainer merges PR** (when ready to release)

   - Review the version bumps and changelogs
   - Merge the "Version Packages" PR

4. **GitHub Action publishes** (automatically)
   - Runs tests and builds
   - Publishes packages to npm
   - Creates GitHub release with tags

### Prerequisites

**npm Trusted Publishing (Provenance)** - No secrets needed! ✨

**⚠️ First-Time Setup Required:**

1. **Do your first manual publish** (packages must exist on npm first):

   ```bash
   npm login
   npm run build
   npm publish --workspace=packages/core --access public
   npm publish --workspace=packages/react-hook-form --access public
   ```

2. **Configure Trusted Publisher** (one-time per package):

   - Go to <https://www.npmjs.com/package/@zod-utils/core> → Settings tab
   - Scroll to "Trusted Publisher" section
   - Fill in:
     - Organization or user: `thu-san`
     - Repository: `zod-utils`
     - Workflow filename: `release.yml`
   - Click "Set up connection"
   - Repeat for `@zod-utils/react-hook-form`

3. **Future releases are automated** via GitHub Actions! ✨

**Why Trusted Publishing?**

- 🔒 More secure - no long-lived tokens
- 🎯 Automatic authentication via OIDC
- ✅ Provides provenance attestations
- 📦 Shows verified badge on npm

---

## Manual Release (Emergency Fallback)

Use only if automation fails or for first-time setup.

### Step 1: Create Changeset

```bash
npx changeset
# Select packages, bump type, add summary
```

### Step 2: Version Packages

```bash
npx changeset version
git add .
git commit -m "chore: version packages"
```

### Step 3: Build & Test

```bash
npm run build
npm test
```

### Step 4: Publish

```bash
npm login  # If needed
npm run publish:all
```

### Step 5: Tag & Push

```bash
VERSION=$(node -p "require('./packages/core/package.json').version")
git tag v$VERSION
git push && git push origin v$VERSION
```

---

## Version Bump Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **patch** (0.1.0 → 0.1.1): Bug fixes, docs, refactors
- **minor** (0.1.0 → 0.2.0): New features (backward compatible)
- **major** (0.1.0 → 1.0.0): Breaking changes

---

## Troubleshooting

### "You do not have permission to publish"

```bash
npm whoami
npm access list collaborators @zod-utils/core
```

### "Package already published"

```bash
# You forgot to version bump
npx changeset version
```

### Changesets bot not creating PR

- Ensure `.changeset/*.md` files exist (besides README.md and config.json)
- Check GitHub Actions logs for errors
- Verify `GITHUB_TOKEN` has correct permissions

### Trusted Publishing authentication failed

```bash
# First publish must be done manually to set up the link
npm login
npm publish --workspace=packages/core --access public --provenance
npm publish --workspace=packages/react-hook-form --access public --provenance

# Then configure automation in package settings on npmjs.com
```

---

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
