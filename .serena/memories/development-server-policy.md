# Development Server Policy

## Important Rule

**Claude should NEVER start the dev server automatically.**

### Rationale
- Dev servers run in the background and can cause lock file conflicts
- Multiple instances can attempt to bind to the same port
- The user should control when the dev server runs
- Background processes are hard to track and clean up

### What to Do Instead
- Only start the dev server if the user explicitly requests it
- When checking for errors, use build commands or TypeScript compiler checks instead
- Suggest that the user start the dev server themselves if needed
- If a dev server is accidentally started, offer to stop it immediately

### Stopping Dev Servers
If dev servers are running in the background, use:
```bash
pkill -f "next dev"  # Kill Next.js dev servers
```

Or use `KillShell` with the appropriate shell ID.
