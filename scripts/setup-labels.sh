#!/bin/bash
# GitHub Labels Setup Script
# Automatically creates all required labels for PR automation

set -e  # Exit on error

REPO="thu-san/zod-utils"

echo "🏷️  Setting up GitHub labels for PR automation..."
echo "Repository: $REPO"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh (macOS) or see https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Function to create/update label
create_label() {
    local name=$1
    local color=$2
    local description=$3

    echo "Creating label: $name"
    gh label create "$name" \
        --color "$color" \
        --description "$description" \
        --repo "$REPO" \
        --force 2>/dev/null || true
}

echo "📦 Creating Size Labels..."
create_label "size: XS" "0e8a16" "Extra small PR (≤10 lines)"
create_label "size: S" "5cb85c" "Small PR (11-100 lines)"
create_label "size: M" "fbca04" "Medium PR (101-500 lines)"
create_label "size: L" "ff9800" "Large PR (501-1000 lines)"
create_label "size: XL" "d73a4a" "Extra large PR (>1000 lines)"
echo ""

echo "📦 Creating Package Labels..."
create_label "package: core" "0366d6" "Changes to @zod-utils/core"
create_label "package: react-hook-form" "0366d6" "Changes to @zod-utils/react-hook-form"
create_label "package: demo" "0366d6" "Changes to demo app"
echo ""

echo "🏷️  Creating Type Labels..."
create_label "type: feature" "a2eeef" "New feature"
create_label "type: fix" "d73a4a" "Bug fix"
create_label "type: documentation" "0075ca" "Documentation changes"
create_label "type: chore" "fef2c0" "Maintenance tasks"
create_label "type: test" "0e8a16" "Test changes"
create_label "type: performance" "ff9800" "Performance improvements"
echo ""

echo "🗂️  Creating Area Labels..."
create_label "dependencies" "0366d6" "Dependency updates"
create_label "documentation" "0075ca" "Documentation changes"
create_label "tests" "0e8a16" "Test file changes"
create_label "benchmarks" "ff9800" "Benchmark changes"
create_label "CI/CD" "e99695" "Workflow changes"
create_label "security" "d73a4a" "Security-related changes"
create_label "build" "fbca04" "Build configuration"
create_label "linting" "fef2c0" "Linting/formatting config"
create_label "git" "bfd4f2" "Git configuration"
create_label "github" "bfd4f2" "GitHub configuration"
create_label "codeowners" "bfd4f2" "CODEOWNERS changes"
create_label "changelog" "0075ca" "Changelog updates"
create_label "changesets" "0366d6" "Changeset files"
create_label "typescript" "3178c6" "TypeScript changes"
create_label "react" "61dafb" "React/UI changes"
create_label "styling" "ff69b4" "CSS/styling changes"
echo ""

echo "⚠️  Creating Special Labels..."
create_label "breaking change" "b60205" "Contains breaking changes"
create_label "WIP" "fbca04" "Work in progress"
echo ""

echo "✅ All labels created successfully!"
echo ""
echo "Next steps:"
echo "1. Test the labeler by creating a test PR"
echo "2. Verify labels are applied automatically"
echo "3. Check workflow runs in Actions tab"
echo ""
echo "See docs/PR_LABELS_SETUP.md for verification steps"
