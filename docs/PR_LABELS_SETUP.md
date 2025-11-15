# PR Labels Setup Guide

This guide explains how to set up GitHub labels for automatic PR labeling.

## 📋 Table of Contents

- [Overview](#overview)
- [Required Labels](#required-labels)
- [Setup Methods](#setup-methods)
- [Label Categories](#label-categories)
- [Verification](#verification)

---

## Overview

The PR labeler workflow automatically applies labels to pull requests based on:
- **Files changed** (via `.github/labeler.yml`)
- **PR size** (lines changed)
- **PR title** (conventional commits format)
- **Breaking changes** detection

## Required Labels

### Size Labels

| Label | Description | Auto-applied when |
|-------|-------------|-------------------|
| `size: XS` | Extra small PR | ≤ 10 lines changed |
| `size: S` | Small PR | 11-100 lines changed |
| `size: M` | Medium PR | 101-500 lines changed |
| `size: L` | Large PR | 501-1000 lines changed |
| `size: XL` | Extra large PR | >1000 lines changed |

**Colors:** Use a gradient
- XS: `#0e8a16` (green)
- S: `#5cb85c` (light green)
- M: `#fbca04` (yellow)
- L: `#ff9800` (orange)
- XL: `#d73a4a` (red)

---

### Package Labels

| Label | Description | Color |
|-------|-------------|-------|
| `package: core` | Changes to @zod-utils/core | `#0366d6` |
| `package: react-hook-form` | Changes to @zod-utils/react-hook-form | `#0366d6` |
| `package: demo` | Changes to demo app | `#0366d6` |

---

### Type Labels

| Label | Description | Color |
|-------|-------------|-------|
| `type: feature` | New feature | `#a2eeef` |
| `type: fix` | Bug fix | `#d73a4a` |
| `type: documentation` | Documentation changes | `#0075ca` |
| `type: chore` | Maintenance tasks | `#fef2c0` |
| `type: test` | Test changes | `#0e8a16` |
| `type: performance` | Performance improvements | `#ff9800` |

---

### Area Labels

| Label | Description | Color |
|-------|-------------|-------|
| `dependencies` | Dependency updates | `#0366d6` |
| `documentation` | Documentation changes | `#0075ca` |
| `tests` | Test file changes | `#0e8a16` |
| `benchmarks` | Benchmark changes | `#ff9800` |
| `CI/CD` | Workflow changes | `#e99695` |
| `security` | Security-related changes | `#d73a4a` |
| `build` | Build configuration | `#fbca04` |
| `linting` | Linting/formatting config | `#fef2c0` |
| `git` | Git configuration | `#bfd4f2` |
| `github` | GitHub configuration | `#bfd4f2` |
| `codeowners` | CODEOWNERS changes | `#bfd4f2` |
| `changelog` | Changelog updates | `#0075ca` |
| `changesets` | Changeset files | `#0366d6` |
| `typescript` | TypeScript changes | `#3178c6` |
| `react` | React/UI changes | `#61dafb` |
| `styling` | CSS/styling changes | `#ff69b4` |

---

### Special Labels

| Label | Description | Color |
|-------|-------------|-------|
| `breaking change` | Contains breaking changes | `#b60205` |
| `WIP` | Work in progress | `#fbca04` |
| `needs rebase` | Needs rebase (auto by GitHub) | `#d73a4a` |

---

## Setup Methods

### Method 1: Using GitHub CLI (Recommended - Fast)

**Prerequisites:**
- Install GitHub CLI: `brew install gh` (macOS) or see [gh installation](https://cli.github.com/)
- Authenticate: `gh auth login`

**Run the setup script:**

```bash
#!/bin/bash
# Save this as scripts/setup-labels.sh

REPO="thu-san/zod-utils"

# Size labels
gh label create "size: XS" --color "0e8a16" --description "Extra small PR (≤10 lines)" --repo $REPO --force
gh label create "size: S" --color "5cb85c" --description "Small PR (11-100 lines)" --repo $REPO --force
gh label create "size: M" --color "fbca04" --description "Medium PR (101-500 lines)" --repo $REPO --force
gh label create "size: L" --color "ff9800" --description "Large PR (501-1000 lines)" --repo $REPO --force
gh label create "size: XL" --color "d73a4a" --description "Extra large PR (>1000 lines)" --repo $REPO --force

# Package labels
gh label create "package: core" --color "0366d6" --description "Changes to @zod-utils/core" --repo $REPO --force
gh label create "package: react-hook-form" --color "0366d6" --description "Changes to @zod-utils/react-hook-form" --repo $REPO --force
gh label create "package: demo" --color "0366d6" --description "Changes to demo app" --repo $REPO --force

# Type labels
gh label create "type: feature" --color "a2eeef" --description "New feature" --repo $REPO --force
gh label create "type: fix" --color "d73a4a" --description "Bug fix" --repo $REPO --force
gh label create "type: documentation" --color "0075ca" --description "Documentation changes" --repo $REPO --force
gh label create "type: chore" --color "fef2c0" --description "Maintenance tasks" --repo $REPO --force
gh label create "type: test" --color "0e8a16" --description "Test changes" --repo $REPO --force
gh label create "type: performance" --color "ff9800" --description "Performance improvements" --repo $REPO --force

# Area labels
gh label create "dependencies" --color "0366d6" --description "Dependency updates" --repo $REPO --force
gh label create "documentation" --color "0075ca" --description "Documentation changes" --repo $REPO --force
gh label create "tests" --color "0e8a16" --description "Test file changes" --repo $REPO --force
gh label create "benchmarks" --color "ff9800" --description "Benchmark changes" --repo $REPO --force
gh label create "CI/CD" --color "e99695" --description "Workflow changes" --repo $REPO --force
gh label create "security" --color "d73a4a" --description "Security-related changes" --repo $REPO --force
gh label create "build" --color "fbca04" --description "Build configuration" --repo $REPO --force
gh label create "linting" --color "fef2c0" --description "Linting/formatting config" --repo $REPO --force
gh label create "git" --color "bfd4f2" --description "Git configuration" --repo $REPO --force
gh label create "github" --color "bfd4f2" --description "GitHub configuration" --repo $REPO --force
gh label create "codeowners" --color "bfd4f2" --description "CODEOWNERS changes" --repo $REPO --force
gh label create "changelog" --color "0075ca" --description "Changelog updates" --repo $REPO --force
gh label create "changesets" --color "0366d6" --description "Changeset files" --repo $REPO --force
gh label create "typescript" --color "3178c6" --description "TypeScript changes" --repo $REPO --force
gh label create "react" --color "61dafb" --description "React/UI changes" --repo $REPO --force
gh label create "styling" --color "ff69b4" --description "CSS/styling changes" --repo $REPO --force

# Special labels
gh label create "breaking change" --color "b60205" --description "Contains breaking changes" --repo $REPO --force
gh label create "WIP" --color "fbca04" --description "Work in progress" --repo $REPO --force

echo "✅ All labels created successfully!"
```

**Run it:**
```bash
chmod +x scripts/setup-labels.sh
./scripts/setup-labels.sh
```

---

### Method 2: Using GitHub Web UI (Manual - Slower)

**Steps for each label:**

1. Go to `https://github.com/thu-san/zod-utils/labels`
2. Click "New label"
3. Enter:
   - **Label name:** (e.g., `size: XS`)
   - **Description:** (e.g., "Extra small PR (≤10 lines)")
   - **Color:** Click the color picker or enter hex code (e.g., `0e8a16`)
4. Click "Create label"
5. Repeat for all 31 labels

**Tip:** You can edit existing labels instead of creating new ones if they already exist.

---

### Method 3: Using GitHub API (Programmatic)

**For automation or CI/CD integration:**

```bash
#!/bin/bash
# Using curl and GitHub API

TOKEN="your_github_token_here"
REPO="thu-san/zod-utils"

create_label() {
  local name=$1
  local color=$2
  local description=$3

  curl -X POST \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$REPO/labels \
    -d "{\"name\":\"$name\",\"color\":\"$color\",\"description\":\"$description\"}"
}

# Example usage
create_label "size: XS" "0e8a16" "Extra small PR (≤10 lines)"
create_label "size: S" "5cb85c" "Small PR (11-100 lines)"
# ... repeat for all labels
```

---

## Label Categories

### How Labels Are Applied

#### Automatic (via workflow)

**By file changes** (`.github/labeler.yml`):
- Detects which files were modified
- Applies package labels (core, react-hook-form, demo)
- Applies area labels (dependencies, documentation, tests, etc.)

**By PR size** (lines changed):
- Counts total lines added + removed
- Ignores `package-lock.json`, `dist/`, `*.lock`
- Applies size label (XS, S, M, L, XL)

**By PR title** (conventional commits):
- Parses PR title for type (feat, fix, docs, etc.)
- Detects breaking changes (`!` or `BREAKING CHANGE`)
- Applies type labels

**By PR state**:
- Applies `WIP` if draft or title contains "WIP"
- Removes `WIP` when PR is ready for review

#### Manual (by maintainers)

**Labels that should be added manually:**
- `breaking change` (if not detected automatically)
- Priority labels (if you add them)
- Status labels (if you add them)

---

## Verification

### Test the Labeler

**Step 1: Create a test PR**

```bash
git checkout -b test/label-automation
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "docs: test label automation"
git push origin test/label-automation
```

**Step 2: Open PR on GitHub**

**Step 3: Verify labels are applied**

Should see:
- ✅ `size: XS` (small change)
- ✅ `documentation` (changed .md file)
- ✅ `type: documentation` (title starts with "docs:")

**Step 4: Test other scenarios**

**Test package labeling:**
```bash
git checkout -b test/core-package
echo "// test" >> packages/core/src/index.ts
git add packages/core/src/index.ts
git commit -m "feat: test core package labeling"
git push origin test/core-package
# Open PR - should get "package: core" label
```

**Test size labeling:**
```bash
# Create a large change
for i in {1..50}; do echo "export const test$i = () => {};" >> packages/core/src/test.ts; done
git add packages/core/src/test.ts
git commit -m "feat: large change for size testing"
git push
# Should get "size: M" or "size: L" label
```

**Test WIP:**
```bash
# Create draft PR or PR with WIP in title
# Title: "WIP: working on feature X"
# Should get "WIP" label
```

---

### Check Workflow Runs

1. Go to Actions tab
2. Find "PR Labeler" workflow
3. Check that all jobs passed:
   - ✅ Label by Files Changed
   - ✅ Label by PR Size
   - ✅ Label by PR Title
   - ✅ Label by Conventional Commits
   - ✅ Auto-assign Reviewers (if applicable)

---

### Troubleshooting

**Labels not appearing:**

1. Check workflow ran: Actions → PR Labeler
2. Check workflow permissions: Settings → Actions → General → Workflow permissions → Read and write
3. Verify labels exist in repository
4. Check labeler.yml syntax is valid YAML

**Wrong labels applied:**

1. Review `.github/labeler.yml` patterns
2. Check file paths match glob patterns
3. Test patterns with: https://globster.xyz/
4. Review workflow logs for details

**Size labels incorrect:**

1. Check what files are being counted
2. Verify `files_to_ignore` in workflow
3. Review PR Files tab for actual changes

**Type labels not applied:**

1. Check PR title follows conventional commit format
2. Format: `type(scope): description`
3. Valid types: feat, fix, docs, chore, test, refactor, perf, ci, build
4. Examples:
   - ✅ `feat: add new feature`
   - ✅ `fix(core): resolve bug`
   - ❌ `Add new feature` (no type prefix)

---

## Maintenance

### Adding New Labels

1. **Add to repository** (via GitHub UI or CLI)
2. **Update `.github/labeler.yml`** if file-based
3. **Update workflow** if logic-based
4. **Update this documentation**

### Removing Labels

1. **Remove from `.github/labeler.yml`**
2. **Update workflow** if referenced
3. **Optionally delete from repository** (Settings → Labels → Delete)
4. **Update this documentation**

### Best Practices

- Keep label names consistent
- Use `:` separator for categories (e.g., `type: feature`)
- Use descriptive colors (red for critical, green for good, yellow for caution)
- Document all labels in this file
- Test changes with a draft PR first

---

## Related Documentation

- [GitHub Labeler Action](https://github.com/actions/labeler)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Labels API](https://docs.github.com/en/rest/issues/labels)

---

**Last Updated:** 2025-11-15
**Maintained by:** @thu-san
