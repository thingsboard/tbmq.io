#!/usr/bin/env bash
# base-format.sh <file>… — was each file already off Prettier's style on the base branch (docs/tbmq-lite-beta)?
# Run from the worktree root. Tells apart formatting this branch broke from formatting it inherited.
tmp=$(mktemp)
for f in "$@"; do
	git show "docs/tbmq-lite-beta:$f" > "$tmp" 2>/dev/null || { echo "new-on-branch      $f"; continue; }
	if npx prettier --stdin-filepath "$f" < "$tmp" 2>/dev/null | cmp -s - "$tmp"; then
		echo "clean-at-base      $f"
	else
		echo "unformatted-at-base $f"
	fi
done
rm -f "$tmp"
