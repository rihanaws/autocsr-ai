#!/usr/bin/env bash
# Codex worktree setup — runs automatically when Codex app creates a new worktree.
# Worktrees only inherit git-tracked files, so this copies untracked env files
# from the main checkout and installs dependencies.
set -euo pipefail

# Main checkout = first entry in `git worktree list`
MAIN="$(git worktree list --porcelain | head -1 | sed 's/^worktree //')"
HERE="$(pwd)"

if [ "$MAIN" = "$HERE" ]; then
  echo "Running in main checkout — skipping env copy."
else
  echo "Copying untracked env files from $MAIN"
  # Copy every .env* that exists in main but is gitignored (never committed)
  for f in .env .env.local apps/web/.env apps/web/.env.local apps/inference/.env; do
    if [ -f "$MAIN/$f" ] && [ ! -f "$HERE/$f" ]; then
      mkdir -p "$(dirname "$HERE/$f")"
      cp "$MAIN/$f" "$HERE/$f"
      echo "  copied $f"
    fi
  done
fi

# Always bun (repo rule)
echo "Installing dependencies..."
bun install --frozen-lockfile || bun install

# Generate Prisma client (untracked, required for typecheck/build)
echo "Generating Prisma client..."
(cd apps/web && bunx prisma generate)

echo "Worktree ready."
