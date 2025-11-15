# NPM Security Guide

This guide covers security best practices for npm package management in the zod-utils monorepo.

## 📋 Table of Contents

- [Configuration](#configuration)
- [Publishing Security](#publishing-security)
- [Dependency Security](#dependency-security)
- [Best Practices](#best-practices)
- [CI/CD Security](#cicd-security)

---

## Configuration

### Root `.npmrc`

The root `.npmrc` file contains **safe, public configuration** that can be committed to git. It includes:

- ✅ Security settings (audit, strict-ssl, provenance)
- ✅ Registry configuration
- ✅ Publishing defaults
- ✅ Performance optimizations

**What it does NOT contain:**
- ❌ NPM tokens
- ❌ Auth credentials
- ❌ Private registry credentials

### Local User `.npmrc`

For publishing packages, maintainers should have a **local `~/.npmrc`** file with:

```ini
# User-specific .npmrc in home directory (~/.npmrc)
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

**Important:** Never commit files containing `_authToken` or `_password`.

---

## Publishing Security

### 1. Two-Factor Authentication (2FA)

All maintainers with publish access **must** enable 2FA:

```bash
npm profile enable-2fa auth-and-writes
```

This requires OTP codes for:
- Login
- Publishing packages
- Changing profile settings
- Managing team access

### 2. NPM Provenance

We enable **npm provenance** to create cryptographic proof of package origins:

```ini
# In .npmrc
provenance=true
```

This generates:
- Signed attestations
- Build environment details
- Source repository links
- Commit SHA references

**Verify provenance:**
```bash
npm audit signatures
```

### 3. Package Scope Security

The `@zod-utils` scope should be configured with:

```bash
# Check scope settings
npm access ls-packages

# Ensure 2FA is required for publishing
npm access set mfa=publish @zod-utils/core
npm access set mfa=publish @zod-utils/react-hook-form
```

### 4. Pre-Publish Checklist

Before publishing, verify:

- [ ] Version bump is correct (semver)
- [ ] CHANGELOG.md is updated
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No sensitive files in package (`npm pack --dry-run`)
- [ ] Package size is reasonable (`npm run size`)
- [ ] 2FA token is ready
- [ ] Git tag matches version

### 5. Package Contents Verification

Check what will be published:

```bash
# Dry run to see package contents
npm pack --dry-run

# Extract and inspect
npm pack
tar -xzf zod-utils-*.tgz
tree package/
rm -rf package/ zod-utils-*.tgz
```

**Files field in package.json:**
```json
{
  "files": [
    "dist",
    "!dist/**/*.test.*",
    "!dist/**/__tests__",
    "README.md"
  ]
}
```

---

## Dependency Security

### 1. Audit Configuration

We run security audits at different levels:

**Local development:**
```bash
npm audit --audit-level=moderate
```

**CI/CD:**
```bash
# In GitHub Actions
npm audit --audit-level=moderate
```

**Manual deep check:**
```bash
npm audit --audit-level=low
npm audit --json > audit-report.json
```

### 2. Dependency Review

We use multiple tools:

1. **GitHub Dependency Review** (automated in PRs)
2. **Renovate Bot** (automated updates)
3. **npm audit** (vulnerabilities)
4. **CodeQL** (code scanning)

### 3. Dependency Update Policy

**Automatic updates (via Renovate):**
- ✅ Patch versions (`1.0.x`)
- ✅ Minor versions (`1.x.0`) for dev dependencies
- ❌ Major versions (require manual review)

**Manual review required:**
- Major version updates
- Peer dependency changes
- Security vulnerabilities

### 4. License Compliance

We block licenses incompatible with MIT:

```yaml
# In dependency-review.yml
deny-licenses: GPL-3.0, AGPL-3.0
```

**Allowed licenses:**
- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- CC0-1.0

Check licenses:
```bash
npx license-checker --summary
```

---

## Best Practices

### 1. Use `npm ci` in CI/CD

**Always use `npm ci` in automated environments:**

```bash
# ✅ Good: Reproducible, uses package-lock.json exactly
npm ci

# ❌ Bad: Can update dependencies unexpectedly
npm install
```

**Benefits:**
- Faster (skips package resolution)
- Reproducible (respects package-lock exactly)
- Fails if out of sync
- Cleans node_modules first

### 2. Lock File Integrity

**Never modify `package-lock.json` manually.**

```bash
# If lock file is corrupted
rm -rf node_modules package-lock.json
npm install

# Verify integrity
npm install --package-lock-only
```

### 3. Workspace Security

In monorepos, ensure workspace dependencies are secure:

```bash
# Audit all workspaces
npm audit --workspaces

# Update all workspaces
npm update --workspaces
```

### 4. Script Execution

Be cautious with `postinstall` scripts:

```ini
# To disable all scripts (increases security but may break builds)
ignore-scripts=true
```

**If you need to disable scripts:**
1. Test thoroughly
2. Whitelist specific packages
3. Document exceptions

### 5. Registry Security

**Always use HTTPS:**
```ini
strict-ssl=true
registry=https://registry.npmjs.org/
```

**For private registries:**
```ini
# Scope-specific registry
@myorg:registry=https://npm.myorg.com/
```

---

## CI/CD Security

### 1. GitHub Actions

**Store NPM token as GitHub Secret:**

1. Generate npm token (automation type):
   ```bash
   npm token create --type=automation
   ```

2. Add to GitHub Secrets:
   - Go to Repository Settings → Secrets and variables → Actions
   - Create secret: `NPM_TOKEN`

3. Use in workflow:
   ```yaml
   - name: Publish to npm
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
     run: npm publish
   ```

### 2. Environment Variables

**Never hardcode credentials:**

```bash
# ❌ Bad
//registry.npmjs.org/:_authToken=npm_abc123

# ✅ Good
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### 3. Provenance in CI

GitHub Actions automatically provides provenance metadata:

```yaml
permissions:
  contents: read
  id-token: write  # Required for provenance

env:
  NPM_CONFIG_PROVENANCE: true
```

### 4. Audit on Every CI Run

```yaml
- name: Security audit
  run: npm audit --audit-level=moderate
  continue-on-error: false  # Fail build on vulnerabilities
```

### 5. Verify Published Package

After publishing, verify:

```bash
# Download and inspect published package
npm pack @zod-utils/core@latest
tar -xzf zod-utils-core-*.tgz
ls -la package/

# Check provenance
npm view @zod-utils/core --json | jq .dist
```

---

## Incident Response

### If Credentials are Leaked

**Immediate actions:**

1. **Revoke the token:**
   ```bash
   npm token revoke <token-id>
   npm token list
   ```

2. **Generate new token:**
   ```bash
   npm token create --type=automation
   ```

3. **Update GitHub Secrets**

4. **Check for unauthorized publishes:**
   ```bash
   npm view @zod-utils/core time
   npm view @zod-utils/react-hook-form time
   ```

5. **If unauthorized version was published:**
   ```bash
   # Deprecate malicious version
   npm deprecate @zod-utils/core@x.x.x "Security: Unauthorized publish"

   # If within 72 hours, unpublish
   npm unpublish @zod-utils/core@x.x.x
   ```

6. **Notify users:**
   - GitHub Security Advisory
   - npm security advisory
   - Update README

### If Vulnerability is Found

1. **Assess severity** (use CVSS score)
2. **Check if exploitable** in your use case
3. **Update dependency:**
   ```bash
   npm audit fix
   # or
   npm update <package>
   ```
4. **If no fix available:**
   - Consider alternatives
   - Implement workarounds
   - Document in SECURITY.md
5. **Publish patch release**
6. **Create security advisory**

---

## Resources

### Official Documentation
- [npm security best practices](https://docs.npmjs.com/security-best-practices)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub npm publishing](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)

### Security Tools
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Socket.dev](https://socket.dev/) - Dependency security
- [Snyk](https://snyk.io/) - Vulnerability scanning
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)

### Package Security
- [Can I take over an npm package?](https://github.com/azu/can-i-take-over-npm-package)
- [npm package provenance](https://github.blog/2023-04-19-introducing-npm-package-provenance/)
- [Trusted publishing](https://docs.pypi.org/trusted-publishers/)

---

## Questions?

If you have questions about npm security:
- Check this guide first
- Review [SECURITY.md](../SECURITY.md)
- Open a discussion on GitHub
- Contact maintainers

---

**Last Updated:** 2025-11-15
**Maintained by:** @thu-san
