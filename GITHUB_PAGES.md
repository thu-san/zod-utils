# GitHub Pages Deployment Guide

This guide explains how to deploy the demo app to GitHub Pages.

## 🚀 Quick Start

The demo app is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

**Live Demo**: https://thu-san.github.io/zod-utils/

## ⚙️ One-Time Setup (Required)

You need to enable GitHub Pages in your repository settings:

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/thu-san/zod-utils
2. Click **Settings** (top navigation)
3. Click **Pages** (left sidebar)
4. Under **Source**, select:
   - Source: **GitHub Actions**
5. Click **Save**

That's it! The workflow will automatically deploy on the next push.

### Step 2: Verify Deployment

1. Go to the **Actions** tab in your repository
2. You should see a workflow run called "Deploy to GitHub Pages"
3. Wait for it to complete (usually 2-3 minutes)
4. Visit: https://thu-san.github.io/zod-utils/

## 📁 What Was Configured

### 1. Next.js Configuration (`apps/demo/next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  output: 'export',              // Static HTML export
  basePath: '/zod-utils',        // GitHub Pages path
  assetPrefix: '/zod-utils/',    // Asset URLs
  images: { unoptimized: true }, // Required for static export
};
```

### 2. GitHub Actions Workflow (`.github/workflows/deploy-pages.yml`)

- Triggers on pushes to `main` branch
- Builds packages first (core + react-hook-form)
- Builds demo app with production environment
- Deploys to GitHub Pages

### 3. Jekyll Bypass (`apps/demo/public/.nojekyll`)

- Prevents GitHub from processing files with Jekyll
- Allows Next.js files (like `_next/`) to work correctly

## 🔄 Deployment Process

### Automatic Deployment

Every time you push to `main` with changes in:
- `apps/demo/**`
- `packages/**`
- `.github/workflows/deploy-pages.yml`

The demo will automatically rebuild and redeploy!

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

## 🧪 Local Testing

To test the production build locally:

```bash
# Build packages first
npm run build:core
npm run build:rhf

# Build demo app
npm run build:demo

# The static site is in apps/demo/out/
# You can serve it locally:
npx serve apps/demo/out -p 3000

# Open http://localhost:3000
```

## 🛠️ Troubleshooting

### Deployment Failed

**Check the workflow logs**:
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Check the error messages

**Common issues**:
- Build errors: Fix TypeScript/linting errors
- Missing dependencies: Run `npm install` and commit package-lock.json
- Permission errors: Make sure GitHub Pages is enabled in settings

### 404 Errors on Deployed Site

**Issue**: Assets not loading or routes not working

**Solution**: Make sure `basePath` in `next.config.ts` matches your repository name:
```typescript
const repoName = 'zod-utils'; // Must match your repo name
```

### Images Not Loading

**Issue**: Next.js Image component requires optimization server

**Solution**: Already configured! We use `unoptimized: true` for static export.

## 📝 Customization

### Change Deployment Branch

Edit `.github/workflows/deploy-pages.yml`:

```yaml
on:
  push:
    branches:
      - main  # Change this to your preferred branch
```

### Change Repository Name

If you rename your repository, update `apps/demo/next.config.ts`:

```typescript
const repoName = 'new-repo-name'; // Update this
```

### Deploy to Custom Domain

1. Add a `CNAME` file to `apps/demo/public/`:
   ```
   your-domain.com
   ```

2. Configure DNS with your domain provider:
   - Add a CNAME record pointing to: `thu-san.github.io`

3. In GitHub repository settings > Pages:
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## 🔐 Security Notes

- GitHub Pages sites are always public
- Don't include sensitive data in the demo app
- Environment variables are not available in static sites
- All API keys must be public or proxied through a backend

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## ✅ Checklist

- [x] Configure Next.js for static export
- [x] Create GitHub Actions workflow
- [x] Add .nojekyll file
- [ ] Enable GitHub Pages in repository settings (YOU NEED TO DO THIS)
- [ ] Push to main branch
- [ ] Verify deployment in Actions tab
- [ ] Visit live site: https://thu-san.github.io/zod-utils/

---

**Need help?** Open an issue or check the GitHub Actions logs for detailed error messages.
