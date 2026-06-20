# Recruit DB — Backup & Restore

## What runs

Nightly at 03:15 UTC, `/etc/cron.d/recruit-backup` runs `scripts/backup-db.sh`.
Backups land in `/var/backups/recruit/`:

```
/var/backups/recruit/
  daily/    # last 7 days
  weekly/   # Sunday dumps, last 4 weeks
  monthly/  # 1st-of-month dumps, kept indefinitely (manual prune)
```

Logs: `/var/log/recruit-backup.log`

## Run a backup manually

```bash
/path/to/recruit/scripts/backup-db.sh
```

## Restore (full DB rollback)

**Warning:** restore is destructive — it drops and recreates the target database.

```bash
# 1. Stop the app so no writes happen during restore
pm2 stop recruit

# 2. Drop and recreate the DB
psql -h 127.0.0.1 -p 5433 -U postgres -c "DROP DATABASE recruit;"
psql -h 127.0.0.1 -p 5433 -U postgres -c "CREATE DATABASE recruit;"

# 3. Restore from a dump (gunzip + pg_restore)
gunzip -c /var/backups/recruit/daily/recruit-YYYYMMDD-HHMMSS.dump.gz | \
  pg_restore --no-owner --no-acl --dbname=postgresql://postgres@127.0.0.1:5433/recruit

# 4. Restart the app
pm2 start recruit
```

## Restore a single table or partial data

```bash
gunzip -c /var/backups/recruit/daily/recruit-YYYYMMDD-HHMMSS.dump.gz | \
  pg_restore --no-owner --no-acl \
    --table=Candidate \
    --dbname=postgresql://postgres@127.0.0.1:5433/recruit
```

## Verify a backup is valid (without restoring to prod)

```bash
# List contents of a dump
gunzip -c /var/backups/recruit/daily/recruit-YYYYMMDD-HHMMSS.dump.gz | pg_restore --list

# Restore to a throwaway DB
psql -h 127.0.0.1 -p 5433 -U postgres -c "CREATE DATABASE recruit_verify;"
gunzip -c /var/backups/recruit/daily/recruit-YYYYMMDD-HHMMSS.dump.gz | \
  pg_restore --no-owner --no-acl --dbname=postgresql://postgres@127.0.0.1:5433/recruit_verify
psql -h 127.0.0.1 -p 5433 -U postgres -d recruit_verify -c "SELECT COUNT(*) FROM \"Candidate\";"
psql -h 127.0.0.1 -p 5433 -U postgres -c "DROP DATABASE recruit_verify;"
```

## Known limitations

- **Local-only.** Backups live on the same disk as the DB. If the disk fails, both are lost. Adding off-site sync (rsync to another host, or S3) is a known follow-up.
- **No point-in-time recovery.** WAL archiving is not configured. Recovery granularity is "last nightly snapshot."
- **Disk pressure.** Server is at ~89% disk. Monitor `/var/backups/recruit/` size.
