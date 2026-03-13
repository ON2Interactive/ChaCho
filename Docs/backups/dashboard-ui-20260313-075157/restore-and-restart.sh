#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/kistudioultra/Documents/Clients/ChaCho"
BACKUP_DIR="$ROOT/Docs/backups/dashboard-ui-20260313-075157"

cp "$BACKUP_DIR/ConfiguratorClient.tsx" "$ROOT/apps/dashboard/app/app/ConfiguratorClient.tsx"
cp "$BACKUP_DIR/globals.css" "$ROOT/apps/dashboard/app/globals.css"
cp "$BACKUP_DIR/app-page.tsx" "$ROOT/apps/dashboard/app/app/page.tsx"

cd "$ROOT"
npm run build -w dashboard

if lsof -ti tcp:3000 >/dev/null 2>&1; then
  kill "$(lsof -ti tcp:3000)"
fi

npm run start -w dashboard -- --port 3000
