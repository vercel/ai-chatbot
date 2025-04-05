#!/bin/bash
cd "$(dirname "$0")"
git status
echo "======================"
echo "CURRENT BRANCH:"
git branch --show-current
echo "======================"
echo "UNCOMMITTED CHANGES:"
git diff --stat
echo "======================"
echo "RECENT COMMITS:"
git log -5 --oneline
echo "======================"
echo "ALL BRANCHES:"
git branch -a
echo "======================"
