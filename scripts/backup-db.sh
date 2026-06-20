#!/usr/bin/env bash
# Recruit DB backup — runs nightly via cron.
# Dumps the Postgres database to a gzipped pg_dump custom format file,
# applies a rotation policy, and logs the result.
#
# Rotation:
#   - keep all dumps from the last 7 days
#   - keep one weekly dump (Sunday) for the last 4 weeks
#   - keep one monthly dump (1st of month) indefinitely (manual prune)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/recruit}"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:5433/recruit}"
LOG_FILE="${BACKUP_LOG:-/var/log/recruit-backup.log}"
RETAIN_DAILY_DAYS=7
RETAIN_WEEKLY_WEEKS=4

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"
touch "$LOG_FILE"

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$LOG_FILE"
}

timestamp=$(date -u '+%Y%m%d-%H%M%S')
dump_file="$BACKUP_DIR/daily/recruit-${timestamp}.dump.gz"

log "Starting backup → $dump_file"

# pg_dump custom format (-Fc) is compressed and supports selective restore.
# We pipe through gzip again for extra reduction; pg_dump -Fc is already
# zlib-compressed but the gz wrapper makes it easier to spot-check size.
if pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" | gzip -9 > "$dump_file.tmp"; then
  mv "$dump_file.tmp" "$dump_file"
  size=$(du -h "$dump_file" | cut -f1)
  log "OK — wrote $dump_file ($size)"
else
  rm -f "$dump_file.tmp"
  log "FAIL — pg_dump failed"
  exit 1
fi

# Promote to weekly on Sundays
if [ "$(date -u +%u)" = "7" ]; then
  cp "$dump_file" "$BACKUP_DIR/weekly/recruit-week-${timestamp}.dump.gz"
  log "Promoted to weekly"
fi

# Promote to monthly on the 1st of the month
if [ "$(date -u +%d)" = "01" ]; then
  cp "$dump_file" "$BACKUP_DIR/monthly/recruit-month-${timestamp}.dump.gz"
  log "Promoted to monthly"
fi

# Rotation
find "$BACKUP_DIR/daily" -name "recruit-*.dump.gz" -mtime "+$RETAIN_DAILY_DAYS" -delete
find "$BACKUP_DIR/weekly" -name "recruit-week-*.dump.gz" -mtime "+$((RETAIN_WEEKLY_WEEKS * 7))" -delete

log "Done. Daily count: $(ls "$BACKUP_DIR/daily" 2>/dev/null | wc -l), weekly: $(ls "$BACKUP_DIR/weekly" 2>/dev/null | wc -l), monthly: $(ls "$BACKUP_DIR/monthly" 2>/dev/null | wc -l)"
