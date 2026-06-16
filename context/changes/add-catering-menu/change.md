---
change_id: add-catering-menu
title: Add catering menu
status: planned
created: 2026-06-16
updated: 2026-06-16
archived_at: null
---

## Notes

Pattern: Copy services CRUD (S-04) exactly. Two tables: `catering` (single-row settings with costPerPlate) + `cateringMenuItems` (menu positions with name/type/customType/isVege). Finances formula: costPerPlate × guestCount.
