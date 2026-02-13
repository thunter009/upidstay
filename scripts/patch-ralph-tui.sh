#!/usr/bin/env bash
# Patch ralph-tui beads-rust tracker for two bundling bugs:
#   1. getNextTask() doesn't pass --parent to `br ready`, so epic children never appear
#   2. getTemplate() resolves template.hbs relative to dist/ instead of plugin dir
#
# Run after: bun install -g ralph-tui
# Safe to re-run (idempotent via grep guards)

set -e

CLI_JS="$(readlink -f "$(which ralph-tui)")"

if [ ! -f "$CLI_JS" ]; then
  echo "ralph-tui cli.js not found at $CLI_JS"
  exit 1
fi

# Patch 1: Pass --parent to br ready instead of --type task (post-filter)
# The tracker runs `br ready --json --type task` then filters children client-side,
# but `br ready` without --parent excludes epic children by design.
if grep -q '"--type", "task"' "$CLI_JS"; then
  sed -i.bak 's/args\.push("--type", "task");/args.push("--parent", parentId, "--recursive");/' "$CLI_JS"
  echo "Patched: --parent flag for epic scoping"
else
  echo "Skip: --parent patch already applied (or source changed)"
fi

# Patch 2: Fix beads-rust template path (bundling flattens __dirname)
if grep -q 'join3(__dirname2, "template.hbs")' "$CLI_JS"; then
  sed -i.bak 's|join3(__dirname2, "template.hbs")|join3(__dirname2, "plugins", "trackers", "builtin", "beads-rust", "template.hbs")|' "$CLI_JS"
  echo "Patched: beads-rust template path"
else
  echo "Skip: template path patch already applied (or source changed)"
fi

# Cleanup backup
rm -f "${CLI_JS}.bak"

echo "Done. ralph-tui patched for beads-rust epic support."
