# Branch Protection Rules

This document defines the branch protection strategy for the zod-utils monorepo, including recommended settings, rationale, and security considerations.

## 📋 Table of Contents

- [Overview](#overview)
- [Protected Branches](#protected-branches)
- [Protection Rules for Main Branch](#protection-rules-for-main-branch)
- [Required Status Checks](#required-status-checks)
- [Integration with CODEOWNERS](#integration-with-codeowners)
- [Special Handling: Changesets Bot](#special-handling-changesets-bot)
- [Security Impact](#security-impact)
- [Future Enhancements](#future-enhancements)
- [Troubleshooting](#troubleshooting)

---

## Overview

Branch protection rules enforce code quality, security, and review standards by controlling how code can be merged into protected branches. These rules work in conjunction with CODEOWNERS and CI/CD workflows to maintain repository integrity.

### Key Principles

1. **Prevent accidents**: No direct pushes to main, all changes via PRs
2. **Ensure quality**: All CI checks must pass before merge
3. **Require review**: Maintainer approval needed for all changes
4. **Maintain security**: Critical files require code owner review
5. **Preserve history**: No force pushes or branch deletions

---

## Protected Branches

### Main Branch (`main`)

**Protection Level:** ⛔ Maximum
**Purpose:** Production-ready code, npm releases
**Protection Status:** 🔒 Fully Protected

The `main` branch contains stable, production-ready code. All npm releases are published from this branch via automated workflows.

**Why protect main:**
- Prevents breaking changes from bypassing review
- Ensures all code meets quality standards
- Maintains clean, auditable git history
- Protects against accidental or malicious commits
- Enforces security scanning before merge

---

## Protection Rules for Main Branch

### Complete Settings Matrix

| Rule | Setting | Rationale |
|------|---------|-----------|
| **Require pull request reviews** | ✅ Required (1 approval) | Ensures peer review catches issues |
| **Require review from code owners** | ✅ Required | Critical files get maintainer oversight |
| **Require status checks to pass** | ✅ Required | All CI must be green before merge |
| **Require branches be up to date** | ✅ Required | Tests run against latest main |
| **Require conversation resolution** | ✅ Required | All review comments addressed |
| **Dismiss stale PR approvals** | ✅ Enabled | Force re-review after new commits |
| **Allow auto-merge** | ✅ Enabled | Convenience for Changesets bot |
| **Require signed commits** | 🔮 Future | Enhanced security (Phase 2) |
| **Include administrators** | ✅ Enabled | No bypass, even for maintainers |
| **Allow force pushes** | ❌ Disabled | Preserve git history |
| **Allow deletions** | ❌ Disabled | Prevent accidental branch removal |

### 1. Pull Request Review Requirements

```yaml
Require pull request reviews before merging: YES
Required approving reviews: 1
Dismiss stale pull request approvals when new commits are pushed: YES
Require review from Code Owners: YES
```

**What this means:**
- Every change to main must go through a PR
- At least 1 maintainer must approve the PR
- If you push new commits after approval, approval is dismissed (must re-review)
- Changes to critical files (workflows, security configs) require code owner (@thu-san) approval

**Example workflow:**
1. Developer creates PR with bug fix
2. CI runs automatically (lint, test, build, security)
3. Code owner reviews and approves
4. Developer can merge after CI passes

### 2. Status Check Requirements

```yaml
Require status checks to pass before merging: YES
Require branches to be up to date before merging: YES
Status checks that are required: (see below)
```

**Required status checks** (must all pass):
- ✅ `lint` - Code quality and formatting
- ✅ `security` - npm audit (moderate severity)
- ✅ `test` - All tests on Node 18, 20, 22, 24
- ✅ `build` - Package builds and bundle sizes
- ✅ `analyze (TypeScript)` - CodeQL security scanning
- ✅ `dependency-review` - Dependency security & licenses

**What this means:**
- PR cannot be merged if any check fails
- Branch must be updated with latest main before merge
- All security scans must pass
- No vulnerabilities with moderate+ severity
- No GPL/AGPL licensed dependencies

**Example of blocked merge:**
```
❌ Cannot merge: Required checks failed
   ✅ lint - passed
   ✅ security - passed
   ❌ test - failed (1 test failing on Node 24)
   ✅ build - passed
   ✅ analyze - passed
   ✅ dependency-review - passed

Action required: Fix failing test before merge
```

### 3. Branch Update Requirements

```yaml
Require branches to be up to date before merging: YES
```

**What this means:**
- Before merging, PR branch must include latest commits from main
- Prevents "I merged but it broke main" scenarios
- Ensures CI tested the exact code that will be in main

**Example scenario:**
1. You create PR with changes to `packages/core`
2. Someone else merges a change to `packages/core`
3. Your PR is now "out of date"
4. You must update your branch (merge/rebase main) before merging
5. CI runs again with your changes + their changes
6. Only then can you merge

### 4. Conversation Resolution

```yaml
Require conversation resolution before merging: YES
```

**What this means:**
- All review comments must be marked as "resolved"
- Prevents forgotten feedback
- Ensures reviewer confirmed their concerns were addressed

**Best practice:**
- Don't resolve your own comments
- Let the reviewer resolve after verifying the fix
- Use "Request review" to notify reviewer of updates

### 5. Administrator Enforcement

```yaml
Include administrators: YES
```

**What this means:**
- Repository admins (@thu-san) are also subject to these rules
- No bypass, no shortcuts
- Ensures consistency and prevents accidents

**Why this matters:**
- Prevents "I'm the admin, I'll just push directly" mistakes
- Maintains audit trail even for urgent fixes
- Builds good habits

---

## Required Status Checks

These CI/CD checks must pass before any PR can be merged.

### 1. Lint (`lint` job)

**Workflow:** `.github/workflows/ci.yml`
**Purpose:** Code quality and formatting
**Tools:** Biome, ESLint, TypeScript compiler

**What it checks:**
- ✅ Biome formatting rules
- ✅ ESLint code quality rules
- ✅ TypeScript type checking (strict mode)
- ✅ No TypeScript compiler errors

**Common failures:**
- Formatting issues (run `npm run lint:fix`)
- TypeScript errors (check with `npm run lint:typescript`)
- ESLint violations (run `npm run lint:eslint:fix`)

**Fix command:**
```bash
npm run lint:fix && npm run lint
```

### 2. Security (`security` job)

**Workflow:** `.github/workflows/ci.yml`
**Purpose:** Dependency vulnerability scanning
**Tools:** npm audit

**What it checks:**
- ✅ No moderate+ severity vulnerabilities
- ✅ All dependencies scanned
- ✅ Package-lock.json integrity

**Common failures:**
- Vulnerable dependency detected
- Outdated dependency with security issue

**Fix command:**
```bash
npm audit fix
# or if breaking:
npm audit  # review manually
npm update <package>  # update specific package
```

### 3. Test (`test` job - Matrix)

**Workflow:** `.github/workflows/ci.yml`
**Purpose:** Ensure code works across Node versions
**Versions:** Node 18, 20, 22, 24

**What it checks:**
- ✅ All unit tests pass on each Node version
- ✅ Code coverage meets thresholds (80%)
- ✅ No flaky tests

**Common failures:**
- Test failing on specific Node version
- Code coverage decreased
- Async test timing issues

**Fix command:**
```bash
npm test
npm run test:coverage  # check coverage
```

### 4. Build (`build` job)

**Workflow:** `.github/workflows/ci.yml`
**Purpose:** Verify packages build successfully
**Tools:** tsup, size-limit

**What it checks:**
- ✅ `@zod-utils/core` builds without errors
- ✅ `@zod-utils/react-hook-form` builds without errors
- ✅ Bundle sizes within limits (10KB each)
- ✅ Type declarations generated correctly

**Common failures:**
- Build errors (TypeScript compilation)
- Bundle size exceeded
- Missing exports

**Fix command:**
```bash
npm run build
npm run size  # check bundle sizes
```

### 5. CodeQL Analysis (`analyze` job)

**Workflow:** `.github/workflows/codeql.yml`
**Purpose:** Security vulnerability scanning
**Language:** TypeScript

**What it checks:**
- ✅ No security vulnerabilities in code
- ✅ No SQL injection risks
- ✅ No XSS vulnerabilities
- ✅ No command injection risks
- ✅ Follows security best practices

**Common failures:**
- Potential security vulnerability detected
- Unsafe data handling
- Unvalidated user input

**Fix approach:**
- Review CodeQL findings carefully
- Apply recommended fixes
- Validate input properly
- Use safe APIs

### 6. Dependency Review (`dependency-review` job)

**Workflow:** `.github/workflows/dependency-review.yml`
**Purpose:** Scan new dependencies for issues
**Runs:** Only on PRs (compares to main)

**What it checks:**
- ✅ No new moderate+ vulnerabilities
- ✅ No GPL-3.0 or AGPL-3.0 licenses
- ✅ License compatibility with MIT
- ✅ No suspicious packages

**Common failures:**
- New dependency has vulnerability
- Dependency uses incompatible license
- Dependency adds too many transitive deps

**Fix approach:**
- Choose different package
- Wait for vulnerability fix
- Contact package maintainer
- Use alternative implementation

---

## Integration with CODEOWNERS

Branch protection works seamlessly with the CODEOWNERS file to enforce review requirements.

### How They Work Together

**CODEOWNERS (`.github/CODEOWNERS`):**
- Automatically assigns reviewers based on files changed
- Defines who "owns" different parts of the codebase
- Suggests who should review

**Branch Protection:**
- Enforces that code owner approval is required
- Blocks merge without owner approval
- Ensures critical files get proper review

### Protected File Categories

When a PR touches these files, code owner review is **required**:

**Critical Security Files:**
- `SECURITY.md`
- `docs/NPM_SECURITY.md`
- `.github/workflows/*` (can execute code, access secrets)
- `.npmrc` (publishing configuration)

**Configuration Files:**
- `package.json` (affects entire monorepo)
- `package-lock.json` (dependency integrity)
- `tsconfig*.json` (TypeScript configuration)
- `biome.json`, `eslint.config.mjs` (code quality)

**Monorepo Structure:**
- `/packages/core/*` (core package code)
- `/packages/react-hook-form/*` (React Hook Form package)

**Example Flow:**

```
PR modifies: .github/workflows/ci.yml

1. CODEOWNERS: Assigns @thu-san as reviewer
2. Branch Protection: Requires @thu-san approval before merge
3. Status Checks: All CI must pass
4. Result: Cannot merge until both approvals + CI pass
```

---

## Special Handling: Changesets Bot

The Changesets workflow requires special consideration in branch protection rules.

### Changesets Workflow Overview

**What Changesets does:**
1. Collects changeset files from merged PRs
2. Creates "Version Packages" PR on `changeset-release/main` branch
3. PR updates versions in `package.json` files
4. PR updates `CHANGELOG.md` files
5. When merged, GitHub Actions publishes to npm

### Branch Protection Compatibility

**Settings that work with Changesets:**

✅ **Allow auto-merge: YES**
- Changesets PR can auto-merge after CI passes
- Speeds up release process
- Still requires approval + CI

✅ **Require status checks: YES**
- Version bump PR must pass CI
- Ensures changes don't break build
- Tests run with new versions

✅ **Require 1 approval: YES**
- Maintainer reviews version bumps
- Verifies changelog is correct
- Confirms versions follow semver

**Settings that conflict with Changesets:**

❌ **Require multiple approvals**
- Slows down releases unnecessarily
- 1 approval is sufficient for version bumps

❌ **Disable auto-merge**
- Requires manual merge every time
- No benefit, just friction

### Recommended Changesets PR Workflow

1. **Changesets bot creates PR** automatically
   - Title: "Version Packages"
   - Branch: `changeset-release/main`
   - Content: Version bumps + changelog updates

2. **CI runs automatically**
   - lint, test, build, security all run
   - Must pass before merge

3. **Maintainer reviews** (manual step)
   - Check version bumps are correct (semver)
   - Review CHANGELOG.md updates
   - Verify no unexpected changes
   - Approve PR

4. **Auto-merge (optional)** or manual merge
   - If auto-merge enabled: PR merges automatically after approval + CI
   - If manual: Maintainer clicks "Merge" button

5. **Release workflow runs** (automatic)
   - Publishes packages to npm
   - Creates GitHub release
   - Generates release notes

**Example Changesets PR approval:**
```
Version Packages PR

Changes:
- @zod-utils/core: 0.6.0 → 0.7.0 (minor bump - new feature)
- @zod-utils/react-hook-form: 0.6.0 → 0.7.0 (minor bump)

Changelog updates: ✅
Semver correct: ✅
Tests pass: ✅
No unexpected changes: ✅

Action: Approve and merge ✅
```

---

## Security Impact

Branch protection rules provide multiple layers of security defense.

### Threats Mitigated

| Threat | How Protection Helps | Severity |
|--------|---------------------|----------|
| **Accidental direct push** | Prevents commits to main without PR | High |
| **Malicious code injection** | Requires review + CI before merge | Critical |
| **Vulnerable dependencies** | Dependency review + audit block merge | High |
| **Breaking changes** | Tests + builds must pass | Medium |
| **Security vulnerabilities** | CodeQL + audit scan all PRs | Critical |
| **License violations** | Dependency review blocks incompatible licenses | Medium |
| **Force push overwrites** | Force push disabled on main | High |
| **Untested code** | All tests must pass on multiple Node versions | High |
| **Unreviewed critical files** | CODEOWNERS + protection enforce review | Critical |

### Defense in Depth

**Layer 1: Pre-commit hooks** (`.husky/pre-commit`)
- Runs tests locally before commit
- Catches issues early

**Layer 2: CI/CD checks** (GitHub Actions)
- Automated testing, linting, security scans
- Runs on every PR

**Layer 3: Code review** (CODEOWNERS + Protection)
- Human review catches logic issues
- Security expertise applied

**Layer 4: Branch protection** (GitHub Settings)
- Enforces layers 1-3
- No bypass possible

**Layer 5: Dependency scanning** (Dependency Review)
- Blocks vulnerable/incompatible dependencies
- License compliance

### Security Score Impact

**Before branch protection:**
- Security Score: 7/10
- Manual enforcement only
- Possible to bypass accidentally

**After branch protection:**
- Security Score: 9/10
- Automated enforcement
- No bypass for anyone
- Audit trail for all changes

---

## Future Enhancements

These improvements will be implemented in future phases.

### Phase 2: Enhanced Security

**1. Require Signed Commits**

```yaml
Require signed commits: YES
```

**Benefits:**
- Cryptographic proof of commit author
- Prevents commit impersonation
- Stronger audit trail
- Industry best practice

**Implementation:**
- Enable in branch protection settings
- Document GPG/SSH key setup in CONTRIBUTING.md
- Add pre-commit hook to verify signatures
- Guide contributors through setup

**Estimated timeline:** 2-4 weeks

---

**2. Increase Security Audit Threshold**

```yaml
Current: npm audit --audit-level=moderate
Future: npm audit --audit-level=high
```

**Benefits:**
- Stricter vulnerability detection
- Faster security patch adoption
- Better security posture

**Implementation:**
- Update `.github/workflows/ci.yml`
- Test with current dependencies
- May require dependency updates

**Estimated timeline:** 1-2 weeks

---

**3. Secrets Scanning**

**New workflow:** `.github/workflows/secrets-scan.yml`

**What it does:**
- Scans commits for accidentally committed secrets
- Checks API keys, tokens, passwords
- Blocks PRs with detected secrets

**Tools:**
- Gitleaks or TruffleHog
- GitHub Advanced Security (if available)

**Implementation:**
- Add workflow file
- Configure as required status check
- Add to branch protection

**Estimated timeline:** 1-2 weeks

---

### Phase 3: Advanced Workflows

**1. SBOM Generation**

**What:** Software Bill of Materials for each release

**Benefits:**
- Supply chain transparency
- Vulnerability tracking
- Compliance requirements

**Implementation:**
- Add SBOM generation to release workflow
- Use CycloneDX or SPDX format
- Publish as release artifact

---

**2. Performance Regression Detection**

**What:** Block PRs that significantly degrade performance

**Benefits:**
- Maintain performance standards
- Catch regressions early
- Automated benchmarking

**Implementation:**
- Compare benchmark results PR vs main
- Fail CI if performance degrades >10%
- Add as required status check

---

**3. Visual Regression Testing**

**What:** Detect unintended UI changes in demo app

**Benefits:**
- Catch visual bugs
- Ensure consistent design
- Prevent accidental changes

**Tools:**
- Percy, Chromatic, or Lost Pixel
- Screenshot comparison

---

## Troubleshooting

Common issues and solutions when working with branch protection.

### Issue: "This branch is out of date"

**Symptom:**
```
❌ This branch is out-of-date with the base branch
   Merge the latest changes from main before merging
```

**Solution:**
```bash
git checkout your-branch
git fetch origin
git merge origin/main  # or git rebase origin/main
git push
```

**Prevention:**
- Regularly sync your branch with main
- Enable auto-merge if PR is ready

---

### Issue: "Required status check is failing"

**Symptom:**
```
❌ test — Node 24 tests failing
   1 test failed
```

**Solution:**
1. Check the CI logs for the failure
2. Reproduce locally: `npm test`
3. Fix the issue
4. Push fix
5. CI runs automatically

**Common causes:**
- Test is flaky (timing issues)
- Breaking change in dependency
- Node version-specific issue

---

### Issue: "Code owner approval required"

**Symptom:**
```
⏳ Waiting for review from @thu-san
   Code owner review required for:
   - .github/workflows/ci.yml
```

**Solution:**
- Wait for code owner to review
- Address any feedback
- Request re-review if needed

**Why this happens:**
- Your PR modifies critical files
- CODEOWNERS specifies owner for those files
- Protection enforces owner approval

---

### Issue: "Stale approval was dismissed"

**Symptom:**
```
❌ Approval from @thu-san was dismissed
   Reason: New commits pushed since approval
```

**Solution:**
- Expected behavior (security feature)
- Code changed since review, needs re-review
- Request review again after pushing fixes

**Prevention:**
- Get review after all changes are done
- Avoid pushing commits after approval

---

### Issue: "Merge conflict with main"

**Symptom:**
```
❌ This branch has conflicts that must be resolved
```

**Solution:**
```bash
git checkout your-branch
git fetch origin
git merge origin/main
# Resolve conflicts in your editor
git add .
git commit
git push
```

**Prevention:**
- Sync with main frequently
- Keep PRs small and focused
- Merge quickly after approval

---

### Issue: "Cannot enable auto-merge"

**Symptom:**
```
Auto-merge option is disabled
```

**Possible causes:**
1. Required status checks not defined
2. Branch protection not configured
3. Not enough permissions

**Solution:**
- Verify branch protection is enabled
- Check status checks are specified
- Ensure you have write access

---

## Questions?

For questions about branch protection:
- Review this documentation
- Check [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) for manual setup
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for PR workflow
- Open a discussion on GitHub

---

**Last Updated:** 2025-11-15
**Maintained by:** @thu-san
**Related Documents:**
- [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) - Manual setup guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](../SECURITY.md) - Security policy
- [NPM_SECURITY.md](./NPM_SECURITY.md) - NPM security practices
