<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Directives & Cleanliness Protocols

### Patch & Scratch Script Lifecycle:
1. **Auto-clean one-off patches:** Whenever a temporary patch or migration script is created, execute it, validate that the changes were applied to target files, and then **immediately delete the patch script**.
2. **Never pollute project root:** Do not leave temporary `patch_*.js`, `fix_*.js`, `test_*.js`, or scratch scripts in the project root.
3. **Reusable utilities:** Any persistent scripts must be stored in `scripts/` (e.g., `scripts/wipe-qa-data.js`).

