#!/bin/zsh
# Double-click or run from Terminal to open the Mac desktop Study Desk.
cd "$(dirname "$0")"
if [[ ! -d node_modules/electron ]]; then
  echo "Installing desktop dependencies (one-time)…"
  npm install
fi
npm start
