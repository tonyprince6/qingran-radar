#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
publish_dir="$(mktemp -d)"
trap 'rm -rf "$publish_dir"' EXIT

pnpm --dir "$project_dir" run build
cp -R "$project_dir/dist/." "$publish_dir/"
touch "$publish_dir/.nojekyll"

remote_url="$(git -C "$project_dir" remote get-url origin)"
author_name="$(git -C "$project_dir" config user.name)"
author_email="$(git -C "$project_dir" config user.email)"

git -C "$publish_dir" init -b gh-pages
git -C "$publish_dir" config user.name "$author_name"
git -C "$publish_dir" config user.email "$author_email"
git -C "$publish_dir" add .
git -C "$publish_dir" commit -m "Publish qingran radar"
git -C "$publish_dir" remote add origin "$remote_url"
git -C "$publish_dir" push --force origin gh-pages
