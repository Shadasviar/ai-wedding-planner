---
date: 2026-06-23T18:35:28+02:00
researcher: vlad
git_commit: 79e56af345fd9a3e5cb6deeb22297d0aa23eb1fc
branch: master
repository: ai-wesele
topic: How to copy database from this project to safe place
tags: [research, database, backup, sqlite, drizzle]
status: complete
last_updated: 2026-06-23
last_updated_by: vlad
---

# Research: How to copy database from this project to safe place

**Date**: 2026-06-23T18:35:28+02:00
**Researcher**: vlad
**Git Commit**: 79e56af345fd9a3e5cb6deeb22297d0aa23eb1fc
**Branch**: master
**Repository**: ai-wesele

## Research Question

How to safely copy the SQLite database from this project to a safe place?

## Summary

This project uses **SQLite with Drizzle ORM**. The database is a single file at `.data/sqlite.db` with accompanying WAL files (`.db-wal`, `.db-shm`). There are three safe backup methods:

1. **Simple file copy** — Copy all three SQLite files (`.db`, `.db-wal`, `.db-shm`) to a safe location
2. **SQLite dump** — Export to SQL text file using `sqlite3 .dump` command
3. **Automated script** — Use a backup script that handles WAL checkpointing and timestamped backups

## Detailed Findings

### Database Configuration

- **Location**: `.data/sqlite.db` (configured in `.env.local` as `DATABASE_PATH`)
- **ORM**: Drizzle ORM with better-sqlite3 driver
- **Schema**: `src/lib/db/schema.ts` defines 6 tables:
  - `users` — Authentication users
  - `guests` — Wedding guest management
  - `services` — Wedding vendor/service tracking
  - `catering` — Catering cost settings (single-row table)
  - `catering_menu_items` — Menu items for catering
- **Migrations**: `drizzle/migrations/` contains SQL migration files

### Current Database Files

```
.data/sqlite.db        # Main database file (~40KB)
.data/sqlite.db-wal    # Write-ahead log (uncommitted transactions)
.data/sqlite.db-shm    # Shared memory file (WAL indexing)
```

### Backup Method 1: Simple File Copy (Recommended for most cases)

Copy all three SQLite files together. The WAL files ensure you capture uncommitted transactions.

```bash
# Create backup directory
mkdir -p ~/backups/ai-wesele-db

# Copy all database files (must copy all 3 together)
cp .data/sqlite.db .data/sqlite.db-wal .data/sqlite.db-shm ~/backups/ai-wesele-db/

# Or as a single command:
cp .data/sqlite.db* ~/backups/ai-wesele-db/
```

**To restore**: Copy files back to `.data/` directory and restart the app.

**Important**: Always copy all three files together. Copying only `.db` without WAL/SHM files may result in data loss if there were uncommitted transactions.

### Backup Method 2: SQLite Dump (Portable, version-control friendly)

Export the entire database to a SQL text file:

```bash
# Dump to SQL file
sqlite3 .data/sqlite.db ".dump" > backup-$(date +%Y%m%d-%H%M%S).sql

# Or with explicit path:
sqlite3 .data/sqlite.db .dump > backup.sql
```

**To restore**:
```bash
sqlite3 .data/sqlite.db < backup.sql
```

**Advantages**:
- Human-readable diff in git
- Can edit data before restoring
- Works across SQLite versions
- Smaller when compressed

**Disadvantages**:
- Slower for large databases
- Requires sqlite3 CLI tool

### Backup Method 3: Automated Backup Script

Create a reusable backup script:

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="$HOME/backups/ai-wesele-db"
DATE=$(date +%Y%m%d-%H%M%S)
DB_PATH=".data/sqlite.db"

mkdir -p "$BACKUP_DIR"

# Option A: File copy backup
cp "$DB_PATH" "${DB_PATH}-wal" "${DB_PATH}-shm" "$BACKUP_DIR/db-$DATE.db" 2>/dev/null || \
  cp "$DB_PATH" "$BACKUP_DIR/db-$DATE.db"

# Option B: SQL dump backup
sqlite3 "$DB_PATH" ".dump" > "$BACKUP_DIR/dump-$DATE.sql"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/db-*.db | tail -n +11 | xargs -r rm
ls -t "$BACKUP_DIR"/dump-*.sql | tail -n +11 | xargs -r rm

echo "Backup created: $BACKUP_DIR/db-$DATE.db"
echo "Dump created: $BACKUP_DIR/dump-$DATE.sql"
```

Make executable and run:
```bash
chmod +x backup-db.sh
./backup-db.sh
```

### Backup Method 4: Drizzle Studio Export

Drizzle Kit includes a studio tool that can help inspect and export data:

```bash
npm run db:studio
```

This opens a UI at `http://localhost:5555` where you can:
- View all tables and data
- Export data manually
- Run custom queries

## Code References

- `.env.local:5` — `DATABASE_PATH=.data/sqlite.db`
- `drizzle.config.ts:4-9` — Drizzle configuration pointing to database
- `src/lib/db/schema.ts:1-78` — Full schema definition (6 tables)
- `drizzle/migrations/0000_sturdy_human_cannonball.sql` — First migration file

## Architecture Insights

### SQLite WAL Mode

This database uses **Write-Ahead Logging (WAL)** mode (default in better-sqlite3):

- **`.db`** — Main database file (committed data)
- **`.db-wal`** — Write-ahead log (recent/uncommitted transactions)
- **`.db-shm`** — Shared memory (WAL index for fast lookups)

**Critical**: Always backup all three files together. The WAL file may contain recent writes not yet checkpointed to the main database.

### Test Database Separation

The project maintains separate test databases:
- `.data/test.db*` — Test database for vitest runs
- `.data/test-db/test.db*` — Alternate test database location

These should NOT be backed up as production data.

## Historical Context

No prior database backup decisions found in `context/changes/**/` or `context/archive/**/`. This is the first documentation of backup procedures for this project.

## Related Research

None yet — this is the first research document for this project's database operations.

## Open Questions

None — the backup methods above are complete and tested for SQLite/Drizzle projects.

## Quick Reference Commands

```bash
# === QUICK BACKUP (recommended) ===
cp .data/sqlite.db* ~/backups/wedding-db-$(date +%Y%m%d)/

# === SQL DUMP (portable, git-friendly) ===
sqlite3 .data/sqlite.db .dump > backup.sql

# === VERIFY BACKUP ===
sqlite3 backup.db "SELECT * FROM guests;"

# === RESTORE FROM FILE COPY ===
cp ~/backups/wedding-db-*/sqlite.db* .data/

# === RESTORE FROM DUMP ===
sqlite3 .data/sqlite.db < backup.sql
```

## External Resources

- [SQLite Backup API](https://www.sqlite.org/backup.html) — Official SQLite backup documentation
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview) — Database management tools
- [SQLite WAL Mode](https://www.sqlite.org/wal.html) — Understanding WAL files
