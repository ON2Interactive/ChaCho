#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/kistudioultra/Documents/Clients/ChaCho"
BACKUP_DIR="$ROOT/Docs/backups/dashboard-ui-20260313-085133"

cp "$BACKUP_DIR/ConfiguratorClient.tsx" "$ROOT/apps/dashboard/app/app/ConfiguratorClient.tsx"
cp "$BACKUP_DIR/globals.css" "$ROOT/apps/dashboard/app/globals.css"
cp "$BACKUP_DIR/app-page.tsx" "$ROOT/apps/dashboard/app/app/page.tsx"

echo "ChaCho dashboard UI restored from $BACKUP_DIR"
