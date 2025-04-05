#!/bin/bash
cd "$(dirname "$0")"
echo "Current branch: $(git branch --show-current)"
echo "===================="
echo "Last 10 commits:"
git log -10 --pretty=format:"%h - %an, %ar : %s"
echo ""
echo "===================="
echo "Uncommitted changes:"
git status -s
echo "===================="
echo "Outstanding commits not pushed to origin:"
for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
  ahead=$(git rev-list --count origin/$branch..$branch 2>/dev/null || echo "?")
  if [ "$ahead" != "0" ] && [ "$ahead" != "?" ]; then
    echo "Branch $branch is ahead of origin/$branch by $ahead commit(s)"
  fi
done
