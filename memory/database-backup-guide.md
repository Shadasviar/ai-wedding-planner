---
name: database-backup-guide
description: Safe SQLite backup procedures for the Wedding Planner project
metadata:
  type: reference
---

**Quick backup command:**
```bash
cp .data/sqlite.db* ~/backups/wedding-db-$(date +%Y%m%d)/
```

**Full documentation:** `context/changes/database-backup-guide/research.md`

**Why:** SQLite uses WAL mode with 3 files (.db, .db-wal, .db-shm). All three must be copied together to avoid data loss from uncommitted transactions.

**How to apply:**
1. Stop the dev server (optional but safest)
2. Copy all three files: `cp .data/sqlite.db* <backup-location>/`
3. Or use SQL dump: `sqlite3 .data/sqlite.db .dump > backup.sql`
