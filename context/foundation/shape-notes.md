---
project: "Wedding Planner"
context_type: greenfield
created: 2026-06-12
updated: 2026-06-12
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 4
  hard_deadline: "2026-07-12"
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6]
  gray_areas_resolved:
    - topic: persona scope
      decision: "Two users (couple) — shared workspace for you and your wife"
    - topic: deployment model
      decision: "Self-hosted on x86_64 PC server, accessible via LAN to authorized users"
    - topic: access model
      decision: "Explicit user accounts with flat permissions — all users share same data"
    - topic: timeline
      decision: "Multi-week after-hours MVP — user accepted sustained-effort cost"
    - topic: Reminders+Blockers vs Timeline
      decision: "Merge into Timeline — date-driven, motivational, reminds user about next steps"
    - topic: Finances structure
      decision: "Aggregated view showing total costs from Guests + Services, with visual diagrams"
    - topic: hard deadline
      decision: "1 month from now (2026-07-12) — wedding date"
  frs_drafted: 17
  quality_check_status: accepted
---

## Vision & Problem Statement

**Pain:** Remembering and tracking all the small aspects of a wedding — guest lists, vendor/service providers and their responsibilities, costs in one place, selecting dinner menu, and other details.

**Person:** You and your wife — two users coordinating together.

**Moment:** During wedding planning — juggling multiple moving pieces across guests, vendors, budget, and menu decisions.

**Cost today:** Scattered tools (spreadsheets, notes, emails, contracts), data trapped in different places, no single view of the full picture.

**Insight:** Private, safe app for your wedding planning only — not a multi-tenant service, not hosted where you don't control access. Single-instance, private deployment for one couple.

## User & Persona

**Primary persona:** You and your wife — 2 users, shared access, coordinating together. This is a shared couple workspace, not a single-user local app and not a multi-tenant platform.

**Scope:** Single-instance, private deployment.

## Access Control

**Model:** Explicit user accounts — each user has their own login credentials.
**Access level:** Flat permissions — all users have the same access rights (no admin/member roles).
**Data:** Shared pool — all authenticated users see and edit the same wedding data.
**Scope:** You, your wife, and potentially others helping with wedding planning (parents, wedding party).
**Deployment:** Self-hosted on x86_64 PC server, accessible via local network only.

## Success Criteria

### Primary
- Dashboard with 3 areas (Guests, Services, Timeline) plus Finances summary
- Navigate into each area to manage items
- Timeline surfaces upcoming activities (motivational, date-driven)
- Finances shows aggregated total cost from Guests + Services with visual diagram

### Secondary
- Agile iterations — secondary features TBD after MVP ships

### Guardrails
- No data loss — what you enter stays there
- Data/cost consistency — updates in one place reflect everywhere in the app

## Functional Requirements

### Dashboard
- FR-001: User can open the app and view the dashboard. Priority: must-have
- FR-002: User can see three major areas on dashboard: Guests, Services, Timeline. Priority: must-have
- FR-003: User can see Finances summary on dashboard (total cost, visual diagram). Priority: must-have
- FR-004: User can navigate from dashboard into each area's detail screen. Priority: must-have

### Guests Management
- FR-005: User can add guests with associated costs (e.g., meal price). Priority: must-have
- FR-006: User can view guest list with cost breakdown. Priority: must-have
- FR-007: User can edit guest information and costs. Priority: must-have
- FR-008: User can remove guests. Priority: must-have

### Services Management
- FR-009: User can add services with associated costs (vendor prices). Priority: must-have
- FR-010: User can view services list with cost breakdown. Priority: must-have
- FR-011: User can edit service information and costs. Priority: must-have
- FR-012: User can remove services. Priority: must-have

### Timeline (replaces Reminders + Blockers)
- FR-013: User can add timeline activities with target dates. Priority: must-have
- FR-014: User can view upcoming activities on dashboard (motivational view). Priority: must-have
- FR-015: User can mark timeline activities as complete. Priority: must-have

### Finances (Aggregated View)
- FR-016: User can see total wedding cost aggregated from Guests + Services. Priority: must-have
- FR-017: User can see cost breakdown by category (visual diagram). Priority: must-have

## User Stories

### US-01: User views dashboard and manages wedding planning

- **Given** the user has opened the wedding planning app
- **When** they arrive at the dashboard
- **Then** they see Guests, Services, Timeline areas plus a Finances summary with total cost and diagram

#### Acceptance Criteria
- Dashboard shows 3 management areas + Finances summary
- Finances shows aggregated total from all cost sources
- Timeline displays upcoming activities (motivational, date-driven)
- Tapping any area navigates to that area's detail screen

## Business Logic

**One-sentence rule:** The app aggregates costs from all wedding items (guests, services) and computes real-time statistics showing the current budget state.

**Explanation:** The app consumes cost inputs from guest entries (e.g., per-guest meal costs) and service entries (vendor prices), then outputs aggregated totals and category breakdowns. The user encounters this through the Finances dashboard, which displays the total wedding cost and visual diagrams without requiring manual summation.

## Non-Functional Requirements

- **Platform:** Runs on x86_64 PC server, accessible via browser to users on the local network.
- **Data integrity:** What you enter persists reliably — no data loss between sessions.
- **Privacy:** No external access — data stays within the local network under your control.
- **Availability:** App is available when the Pi is running; no internet required, LAN access only.

## Non-Goals

- **Avoid: External integrations** — no vendor APIs, payment systems, or email services.
- **Avoid: Mobile app** — browser-only on LAN; no native iOS/Android application.
- **Avoid: Photo/media management** — no uploading or storing venue photos, inspiration images, or media files.
- **Avoid: Real-time sync** — LAN access is sufficient; no instant synchronization across devices.
- **Avoid: Recommendation engine** — no AI suggesting guests, vendors, menu items, or wedding decisions.
- **Avoid: Budget validation** — no target budget enforcement or overspending alerts; statistics only.

## Open Questions

1. **What is the specific authentication mechanism?** — TBD: email/password, username/password, or passwordless magic link for user accounts. This is a downstream implementation detail — the PRD only specifies that explicit user accounts are required.

## Quality cross-check

All elements present and accepted:
- Access Control: present
- Business Logic: present (one-sentence rule captured)
- Project artifacts: present
- Timeline-cost acknowledged: present (4 weeks, after-hours, hard deadline 2026-07-12)
- Non-Goals: present
