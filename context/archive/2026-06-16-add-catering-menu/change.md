---
change_id: add-catering-menu
title: Add catering menu
status: archived
created: 2026-06-16
updated: 2026-06-26
archived_at: 2026-06-26T09:33:18Z
---

## Notes

Pattern: Copy services CRUD (S-04) exactly. Two tables: `catering` (single-row settings with costPerPlate) + `cateringMenuItems` (menu positions with name/type/customType/isVege). Finances formula: costPerPlate × guestCount.
