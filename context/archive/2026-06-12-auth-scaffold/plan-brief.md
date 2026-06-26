# Auth Scaffold — Plan Brief

> Full plan: `context/changes/auth-scaffold/plan.md`
> Research: N/A (no research doc provided)

## What & Why

Implement authentication for the Wedding Planner app using Auth.js v5 (next-auth) with username/password login. This foundation (F-01 in the roadmap) enables multi-user access per the PRD Access Control section and protects all routes, unlocking 4 downstream slices.

## Starting Point

The codebase is a fresh Next.js 16.2.9 + TypeScript + Tailwind 4 scaffold with no auth library, no database, and no user management. The default Next.js starter page is in place at `src/app/page.tsx`.

## Desired End State

- Users can log in with username/password at `/login`
- All routes except `/login` are protected via Auth.js proxy middleware
- Session persists via JWT in HTTP-only cookie
- Users can log out via a sign-out button
- Seed users exist for testing (until F-02 database scaffold lands)
- Auth.js v5 is configured with credentials provider

## Key Decisions Made

| Decision                       | Choice                          | Why (1 sentence)                                               | Source |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------- | ------ |
| Auth mechanism                 | Username/password               | Works offline (LAN-only), no external dependencies needed.     | Plan   |
| Auth library                   | Auth.js v5 (next-auth beta)     | Standard for Next.js, matches App Router patterns.             | Plan   |
| Session storage                | JWT in HTTP-only cookie         | Stateless server, no database round-trip per request.          | Plan   |
| Login UI                       | Simple centered form            | Matches low-complexity goal, users know this pattern.          | Plan   |
| Failed login handling          | Generic error, no rate limiting | Acceptable for 2 trusted users on LAN; simplest implementation.| Plan   |
| Logout                         | Manual logout button            | Table stakes for shared device scenario; trivial to implement. | Plan   |
| Protected routes               | All except /login               | Clear mental model — if you're in the app, you're authenticated.| Plan   |
| Password hashing               | bcryptjs                        | Edge-runtime compatible; battle-tested standard.               | Plan   |
| User storage                   | Database-backed (supports N)    | Matches PRD "explicit user accounts"; extensible.              | Plan   |
| Post-login redirect            | To dashboard root (/)           | Simpler than callback URL handling; acceptable for single-page app.| Plan |
| Security (LAN)                 | HTTP, no HTTPS required         | Matches infrastructure decision; LAN-only threat model.        | Plan   |

## Scope

**In scope:**
- Auth.js v5 installation and configuration
- Credentials provider with username/password
- bcryptjs password hashing
- Login page UI
- Session provider and hooks
- Route protection via proxy middleware
- Seed users for testing

**Out of scope:**
- Password recovery/reset
- Email verification
- OAuth or social login
- Rate limiting
- Role-based access control
- HTTPS enforcement

## Architecture / Approach

Auth.js v5 sits between the Next.js App Router and the application. The `auth.ts` config at the root defines the credentials provider and JWT session strategy. The `/api/auth/[...nextauth]/route.ts` handler processes sign-in/sign-out requests. The `src/middleware.ts` proxy protects all routes except `/login`. Client components access session via `useSession()` hook from `next-auth/react`. Server Components call `auth()` directly.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  src/middleware  │────▶│  Auth.js    │
│  (session)  │     │   (proxy auth)   │     │  (JWT +     │
└─────────────┘     └──────────────────┘     │  sessions)  │
                                             └─────────────┘
```

## Phases at a Glance

| Phase | What it delivers                    | Key risk                                |
| ----- | ----------------------------------- | --------------------------------------- |
| 1. Install & Secrets | Dependencies + AUTH_SECRET env var | Wrong secret format breaks sessions     |
| 2. Configure Auth.js | auth.ts with credentials provider   | bcryptjs vs bcrypt confusion            |
| 3. API Route | /api/auth/[...nextauth] handler     | Path must match exactly                 |
| 4. Login Page | /login with centered form           | Client component ("use client") needed  |
| 5. Session Provider | App wrapped with SessionProvider    | Must be client component                |
| 6. Protect Routes | Middleware + protected dashboard    | Middleware config must exclude /login   |
| 7. User Seed | Seed users + bcrypt comparison      | Temporary until F-02 database lands     |

**Prerequisites:** None (this is a foundation change, parallel with F-02 database-scaffold)
**Estimated effort:** ~2-3 sessions across 7 phases

## Open Risks & Assumptions

- **Auth.js v5 is in beta** — latest stable is 5.0.0-beta.31; API may change before final release
- **Database dependency** — this plan uses seed users temporarily; full database integration requires F-02
- **Edge runtime** — bcryptjs is slower than native bcrypt; acceptable for 2 users but not scalable
- **No password recovery** — for 2 users, manual reset via database is acceptable

## Success Criteria (Summary)

- Unauthenticated access to `/` redirects to `/login`
- Login with valid credentials (`admin` / `wedding2026`) grants access
- Sign out clears session and redirects to `/login`
- TypeScript compiles without errors
- All 7 phases complete with manual verification passing
