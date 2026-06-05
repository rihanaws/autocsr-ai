#!/bin/bash
# Auto-typecheck after .ts/.tsx file edits in apps/web
if [[ "$CLAUDE_TOOL_INPUT" == *"apps/web"* ]] && \
   [[ "$CLAUDE_TOOL_INPUT" == *".tsx"* || "$CLAUDE_TOOL_INPUT" == *".ts"* ]]; then
  cd /Users/rihan/all-coding-project/autocsr/apps/web
  result=$(bun run typecheck 2>&1)
  if echo "$result" | grep -q "error TS"; then
    echo "TYPECHECK FAILED:"
    echo "$result" | grep "error TS" | head -20
    exit 1
  fi
fi
