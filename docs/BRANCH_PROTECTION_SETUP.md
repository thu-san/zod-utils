# Branch Protection Setup Guide

Step-by-step instructions for manually configuring branch protection rules via the GitHub UI.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Phase 1: Critical Protection Rules](#phase-1-critical-protection-rules)
- [Phase 2: Additional Security](#phase-2-additional-security)
- [Verification & Testing](#verification--testing)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Repository admin access** (required to change protection settings)
- ✅ **GitHub account** logged in
- ✅ **CI/CD workflows** running successfully (check Actions tab)
- ✅ **CODEOWNERS file** configured (already done: `.github/CODEOWNERS`)

**Check your access:**
1. Go to repository Settings
2. If you can see "Settings" tab → you have admin access ✅
3. If you cannot see "Settings" → request access from @thu-san ❌

**Verify CI is working:**
1. Go to "Actions" tab
2. Check recent workflow runs
3. Ensure `ci.yml`, `codeql.yml`, `dependency-review.yml` are passing
4. If failing, fix CI before enabling protection

---

## Phase 1: Critical Protection Rules

**Goal:** Prevent direct pushes and enforce CI checks
**Time:** ~15 minutes
**Priority:** 🔴 Critical - Implement immediately

### Step 1: Navigate to Branch Protection Settings

**Path:** Repository → Settings → Branches → Add rule

1. **Open your repository** in GitHub
   - URL: `https://github.com/thu-san/zod-utils`

2. **Click "Settings" tab** (top right, next to Insights)
   - If you don't see this, you don't have admin access

3. **Click "Branches"** in the left sidebar
   - Under "Code and automation" section

4. **Click "Add branch protection rule"** button
   - Or "Edit" if a rule already exists for `main`

5. **Enter branch name pattern**
   - Branch name pattern: `main`
   - This will protect the main branch specifically

---

### Step 2: Configure Pull Request Requirements

In the "Protect matching branches" section:

**A. Enable PR requirement:**
```
☑ Require a pull request before merging
```

**B. Configure PR settings (expand the section):**
```
☑ Require approvals
   Required number of approvals before merging: 1

☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require review from Code Owners
```

**What this does:**
- Forces all changes through PRs (no direct commits)
- Requires 1 maintainer approval
- Re-requests review if code changes after approval
- Enforces CODEOWNERS rules for critical files

**Screenshot guidance:**
- Look for checkboxes under "Require a pull request before merging"
- The section expands when you check the main checkbox
- Make sure all 3 sub-options are checked

---

### Step 3: Configure Status Check Requirements

**A. Enable status checks:**
```
☑ Require status checks to pass before merging
```

**B. Configure status check settings:**
```
☑ Require branches to be up to date before merging
```

**C. Add required status checks:**

Click "Search for status checks in the last week on this repository"

**Select these checks (type name to search):**

Required checks from CI workflow (`.github/workflows/ci.yml`):
- ✅ `lint`
- ✅ `security`
- ✅ `test`
- ✅ `build`

Required checks from CodeQL workflow (`.github/workflows/codeql.yml`):
- ✅ `analyze (TypeScript)` or just `analyze`

Required checks from Dependency Review (`.github/workflows/dependency-review.yml`):
- ✅ `dependency-review`

**Important notes:**
- Check names are **case-sensitive**
- Names must match **exactly** as they appear in workflow files
- If a check doesn't appear, run a PR first to populate the list
- You can verify check names by looking at recent PR status checks

**What this does:**
- Blocks merge if any CI check fails
- Ensures PR is updated with latest main
- Prevents "it worked on my branch" issues

**Screenshot guidance:**
- Type check name in search box
- Click the checkbox next to each required check
- Selected checks appear in a list above the search box
- Remove a check by clicking the X next to it

---

### Step 4: Configure Conversation & History Protection

**A. Require conversation resolution:**
```
☑ Require conversation resolution before merging
```

**B. Enable auto-merge (for Changesets bot):**
```
☑ Allow auto-merge
```

**C. Disable dangerous operations:**
```
☐ Allow force pushes (leave UNCHECKED)
   → Everyone: Disabled

☐ Allow deletions (leave UNCHECKED)
```

**What this does:**
- All review comments must be resolved
- Allows Changesets bot to auto-merge version bumps
- Prevents history rewriting on main
- Prevents accidental branch deletion

---

### Step 5: Enforce on Administrators

**Scroll down to the bottom:**

```
☑ Do not allow bypassing the above settings
```

**Alternative UI (older GitHub):**
```
☑ Include administrators
```

**What this does:**
- Even repository admins must follow the rules
- No bypass for anyone
- Prevents "I'm admin, I'll just push" mistakes

---

### Step 6: Save the Rule

**At the bottom of the page:**

1. **Click "Create"** (if new rule)
   - Or "Save changes" (if editing existing rule)

2. **Wait for confirmation**
   - Green banner: "Branch protection rule created"
   - Or "Branch protection rule updated"

3. **Verify the rule appears** in the list
   - You should see `main` in the branch protection rules list

**⚠️ Warning:** Once saved, these rules apply immediately. You cannot push directly to main anymore.

---

## Phase 2: Additional Security

**Goal:** Enhanced security with signed commits
**Time:** ~10 minutes
**Priority:** 🟡 High - Implement within 2 weeks
**Prerequisites:** Contributors need GPG/SSH keys configured

### Step 1: Require Signed Commits

**Edit the existing branch protection rule for `main`:**

1. Go to Settings → Branches
2. Click "Edit" on the `main` rule
3. Scroll to "Require signed commits"
4. Check the box:

```
☑ Require signed commits
```

5. Click "Save changes"

**What this does:**
- Requires commits to be signed with GPG or SSH key
- Provides cryptographic proof of commit authorship
- Prevents commit impersonation
- Enhanced security and audit trail

**Important:** Before enabling this:
1. Ensure maintainers have signing keys configured
2. Update CONTRIBUTING.md with key setup instructions
3. Test with a sample PR
4. Document troubleshooting for unsigned commits

**Setup guide for contributors:**
- GPG signing: https://docs.github.com/en/authentication/managing-commit-signature-verification
- SSH signing: https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#ssh-commit-signature-verification

---

### Step 2: Lock Branch (Optional - Extra Security)

**Only if you want to prevent ALL pushes (even via PR merge):**

```
☑ Lock branch
```

**⚠️ Warning:** This is very restrictive:
- Prevents all pushes, even through PRs
- Only use for archived/legacy branches
- **NOT recommended for active main branch**

**Recommended:** Leave unchecked for normal development

---

## Verification & Testing

After configuring branch protection, verify it's working correctly.

### Test 1: Attempt Direct Push (Should Fail)

**Goal:** Verify direct pushes are blocked

```bash
# On your local main branch
git checkout main
git pull origin main

# Try to make a commit and push directly
echo "test" >> README.md
git add README.md
git commit -m "test: verify branch protection"
git push origin main
```

**Expected result:**
```
! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs to 'github.com:thu-san/zod-utils.git'
```

**✅ If you see this error:** Branch protection is working!
**❌ If push succeeds:** Something is wrong, check settings

**Cleanup:**
```bash
git reset --hard HEAD~1  # undo the test commit
```

---

### Test 2: Create a Test PR

**Goal:** Verify PR workflow works correctly

1. **Create a test branch:**
   ```bash
   git checkout -b test/branch-protection
   echo "# Branch Protection Test" >> test.md
   git add test.md
   git commit -m "test: verify branch protection PR workflow"
   git push origin test/branch-protection
   ```

2. **Open PR on GitHub:**
   - Go to repository → Pull requests → New pull request
   - Base: `main`, Compare: `test/branch-protection`
   - Create pull request

3. **Verify CI checks run:**
   - Should see checks: lint, security, test, build, analyze, dependency-review
   - Wait for checks to complete

4. **Verify merge is blocked until checks pass:**
   - If checks are running: "Merging is blocked - checks must pass"
   - If checks pass: "Merge" button enabled

5. **Verify approval requirement:**
   - If you're not the code owner: "Review required from @thu-san"
   - If you are: You can approve your own PR (if settings allow)

6. **Test merge:**
   - Click "Merge pull request"
   - Choose merge method (squash, merge commit, or rebase)
   - Confirm merge
   - Should succeed ✅

7. **Cleanup:**
   ```bash
   git checkout main
   git pull origin main
   git branch -d test/branch-protection
   git push origin --delete test/branch-protection
   rm test.md  # if it still exists
   ```

---

### Test 3: Verify Code Owner Review

**Goal:** Ensure CODEOWNERS enforcement works

1. **Create a test branch:**
   ```bash
   git checkout -b test/codeowners
   echo "# test" >> SECURITY.md
   git add SECURITY.md
   git commit -m "test: verify CODEOWNERS requirement"
   git push origin test/codeowners
   ```

2. **Open PR on GitHub**

3. **Verify code owner is assigned:**
   - Check "Reviewers" section on PR
   - Should show: "@thu-san (Code owner)"

4. **Verify merge is blocked:**
   - Should see: "Review required from code owners"
   - Even if other approvals exist

5. **Get code owner approval:**
   - @thu-san must approve
   - Only then can merge proceed

6. **Cleanup:**
   ```bash
   git checkout main
   git pull origin main
   git branch -d test/codeowners
   git push origin --delete test/codeowners
   git checkout SECURITY.md  # restore original
   ```

---

### Test 4: Verify "Out of Date" Requirement

**Goal:** Ensure PRs must be updated with latest main

1. **Create two branches:**
   ```bash
   git checkout main
   git pull origin main

   # First branch
   git checkout -b test/first-pr
   echo "first" >> test1.md
   git add test1.md
   git commit -m "test: first PR"
   git push origin test/first-pr

   # Second branch
   git checkout main
   git checkout -b test/second-pr
   echo "second" >> test2.md
   git add test2.md
   git commit -m "test: second PR"
   git push origin test/second-pr
   ```

2. **Open both PRs on GitHub**

3. **Merge the first PR**
   - Wait for CI
   - Approve and merge

4. **Check the second PR:**
   - Should now show: "This branch is out-of-date with the base branch"
   - Merge button disabled

5. **Update second PR:**
   ```bash
   git checkout test/second-pr
   git fetch origin
   git merge origin/main
   git push origin test/second-pr
   ```

6. **Verify merge is now allowed:**
   - PR updated with latest main
   - CI runs again
   - Merge enabled after checks pass

7. **Cleanup:**
   - Merge or close second PR
   - Delete branches
   - Remove test files

---

## Troubleshooting

Common issues during setup and how to fix them.

### Issue: Status checks don't appear in the list

**Symptom:**
```
Search box shows: "No results"
Can't find required status checks
```

**Causes:**
1. CI workflows haven't run yet
2. Check names are misspelled
3. Workflows are disabled

**Solutions:**

**Option 1: Run a test PR first**
```bash
# Create a dummy PR to populate status checks
git checkout -b test/populate-checks
echo "test" >> README.md
git add README.md
git commit -m "test: populate status checks"
git push origin test/populate-checks
# Open PR, wait for checks to run
# Then go back to branch protection settings
```

**Option 2: Type check names manually**
- Expand workflow files in `.github/workflows/`
- Find job names (e.g., `jobs: lint:`, `jobs: test:`)
- Type exact names in status check search
- Names are case-sensitive

**Option 3: Check if workflows are enabled**
- Go to Actions tab
- Look for disabled workflows
- Enable any disabled workflows
- Run them manually

---

### Issue: "Include administrators" checkbox is missing

**Symptom:**
```
Can't find "Include administrators" option
```

**Cause:**
GitHub updated UI terminology

**Solution:**
Look for alternative wording:
- "Do not allow bypassing the above settings"
- "Apply rules to administrators"
- "Enforce all configured restrictions for administrators"

This is the same setting with different names in different GitHub UI versions.

---

### Issue: Can't save - "At least one status check is required"

**Symptom:**
```
Error when saving: Must select at least one status check
```

**Cause:**
- "Require status checks" is enabled
- But no checks are selected

**Solutions:**

**Option 1: Select status checks**
- Follow Step 3 to add required checks
- Ensure at least one check is selected

**Option 2: Disable status check requirement temporarily**
- Uncheck "Require status checks to pass before merging"
- Save the rule
- Run some PRs to populate checks
- Re-enable and add checks later

**Option 3: Use wildcards (advanced)**
- Some GitHub versions allow `*` to match any check
- Not recommended (too permissive)

---

### Issue: Changesets bot can't merge PRs

**Symptom:**
```
Changesets "Version Packages" PR can't merge automatically
```

**Causes:**
1. Auto-merge not enabled in branch protection
2. Bot doesn't have necessary permissions
3. Status checks are failing

**Solutions:**

**Check 1: Enable auto-merge**
```
☑ Allow auto-merge
```

**Check 2: Verify bot permissions**
- Go to Settings → Integrations → GitHub Apps
- Find "Changeset Release" app
- Ensure it has write permissions

**Check 3: Check status checks**
- Review CI logs on the PR
- Fix any failing checks
- Re-run checks if needed

**Check 4: Manual merge**
- If auto-merge fails, merge manually
- Doesn't affect functionality, just convenience

---

### Issue: Can't merge even though checks pass

**Symptom:**
```
✅ All checks passed
✅ Approved by code owner
❌ Merge button still disabled
```

**Possible causes:**

**Cause 1: Stale approval**
```
Solution: New commits pushed after approval
→ Request review again
```

**Cause 2: Branch not up to date**
```
Solution: "Update branch" button
→ Click to merge latest main
→ Wait for CI to re-run
```

**Cause 3: Conversations not resolved**
```
Solution: Review comments need resolution
→ Click "Resolve conversation" on each thread
→ Have reviewer verify and resolve
```

**Cause 4: Missing required review**
```
Solution: Code owner review required
→ Check "Reviewers" section
→ Request review from code owner
→ Wait for approval
```

---

### Issue: Force push accidentally enabled

**Symptom:**
```
Someone force pushed to main
History was rewritten
```

**Immediate actions:**

**Step 1: Verify the damage**
```bash
git checkout main
git log --oneline -20  # check recent history
git reflog  # check for lost commits
```

**Step 2: Restore lost commits (if needed)**
```bash
# Find the commit before force push in reflog
git reflog | grep "main"
# Reset to that commit
git reset --hard <commit-sha>
git push origin main --force  # restore correct history
```

**Step 3: Fix branch protection**
- Go to Settings → Branches → Edit `main` rule
- Ensure "Allow force pushes" is **UNCHECKED**
- Save changes

**Step 4: Investigate**
- Check GitHub audit log (Settings → Security → Audit log)
- Find who disabled protection
- Prevent future occurrences

---

## Maintenance

Keeping branch protection rules up to date.

### When to Review Settings

**Review branch protection every:**

✅ **3 months** - Regular audit
- Verify settings are still appropriate
- Check for new security features
- Update documentation

✅ **When adding new CI checks**
- Add new check to required status checks list
- Test with a PR
- Update this documentation

✅ **When workflows change**
- Update required check names if jobs are renamed
- Remove obsolete checks
- Verify all checks still run

✅ **When team changes**
- Update CODEOWNERS if ownership changes
- Verify reviewers have necessary access
- Review approval requirements

✅ **After security incidents**
- Analyze what went wrong
- Add additional protections if needed
- Update incident response procedures

---

### Updating Required Status Checks

**When to update:**
- New CI workflow added
- Workflow job renamed
- Check becomes redundant

**How to update:**

1. Go to Settings → Branches
2. Click "Edit" on `main` rule
3. Scroll to "Require status checks to pass before merging"
4. Click "X" next to checks to remove
5. Search for new checks to add
6. Click "Save changes"

**Test the changes:**
- Open a test PR
- Verify correct checks are required
- Confirm merge behavior is expected

---

### Monitoring Protection Effectiveness

**Metrics to track:**

📊 **PR merge rate**
- How many PRs are blocked vs. merged
- Indicates if rules are too strict

📊 **Failed CI checks**
- Which checks fail most often
- May indicate CI issues or code quality problems

📊 **Time to merge**
- How long from PR open to merge
- Indicates if review process is efficient

📊 **Protection violations**
- Any attempts to bypass protection
- Check audit logs for force push attempts

**Where to find data:**
- Insights → Pulse (PR activity)
- Insights → Code frequency (commit patterns)
- Settings → Audit log (protection changes)
- Actions tab (CI check history)

---

## Additional Resources

**Official GitHub Documentation:**
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [About status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

**Related Documentation:**
- [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) - Comprehensive reference
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](../SECURITY.md) - Security policy
- [NPM_SECURITY.md](./NPM_SECURITY.md) - NPM security practices

---

## Questions?

If you encounter issues not covered in this guide:

1. Check [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) for detailed explanations
2. Review GitHub's [official documentation](https://docs.github.com/)
3. Open a discussion on the repository
4. Contact @thu-san directly

---

**Last Updated:** 2025-11-15
**Maintained by:** @thu-san
**Setup completed:** ⬜ (update when implemented)
