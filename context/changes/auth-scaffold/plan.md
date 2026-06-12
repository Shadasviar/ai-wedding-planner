# Auth Scaffold Implementation Plan

## Overview

Implement authentication for the Wedding Planner app using Auth.js v5 (next-auth) with username/password login. This foundation (F-01 in the roadmap) enables multi-user access and protects all routes, unlocking downstream slices S-01, S-03, S-04, and S-06.

## Current State Analysis

**What exists now:**
- Next.js 16.2.9 with App Router (no Pages Router)
- TypeScript + Tailwind 4
- No auth library installed
- No database yet (parallel foundation F-02)
- Default Next.js starter page at `src/app/page.tsx`

**What's missing:**
- Auth library and configuration
- User database table
- Login UI
- Session management
- Protected routes

**Key constraints:**
- LAN-only deployment (no external providers)
- 2 users initially (you and your wife), but database-backed for extensibility
- Low-complexity goal (simple, working auth over polish)

## Desired End State

After this plan is complete:
- Users can log in with username/password at `/login`
- All routes except `/login` are protected
- Session persists via JWT in HTTP-only cookie
- Users can log out via a sign-out button
- Database has a `users` table with `id`, `username`, `password_hash` columns
- Auth.js v5 is configured with credentials provider

**Verification:**
- `npm run dev` → redirects to `/login`
- Login with seeded credentials → access to app
- Logout → session cleared, redirect to `/login`
- Direct navigation to protected route → redirect to `/login`

### Key Discoveries:

- Auth.js v5 uses `auth.ts` at root + `/api/auth/[...nextauth]/route.ts` handler pattern
- Recent versions use `proxy.ts` instead of manual middleware for session handling
- bcryptjs (not bcrypt) is required for Edge runtime compatibility
- `npx auth secret` generates the required `AUTH_SECRET` environment variable
- JWT sessions are default in Auth.js — no extra config needed

## What We're NOT Doing

- Password recovery/reset flow (manual reset via database for 2 users)
- Email verification or magic links (PRD Non-Goal: no external integrations)
- Role-based access control (PRD: flat permissions)
- Rate limiting or brute-force protection (acceptable for 2 trusted users on LAN)
- HTTPS enforcement (LAN-only, HTTP is acceptable per infrastructure decision)
- OAuth or social login (PRD Non-Goal)

## Implementation Approach

Use Auth.js v5 (the Next.js standard) with the credentials provider for username/password auth. Store passwords with bcryptjs hashes in a users table. Sessions use JWT in HTTP-only cookies. All routes except `/login` are protected via Auth.js proxy middleware.

## Critical Implementation Details

- **bcryptjs, not bcrypt**: The native `bcrypt` package has C++ bindings that don't work in Next.js Edge runtime. Use `bcryptjs` (pure JavaScript implementation) for password hashing.
- **Auth.js v5 beta**: The latest version (5.0.0-beta.31) uses a new pattern (`proxy.ts` instead of middleware). Follow the v5 docs, not v4 tutorials.
- **Database dependency**: This plan creates the `users` table schema, but the actual database connection depends on F-02 (database scaffold). For now, use a placeholder adapter or in-memory store; swap to real DB adapter when F-02 lands.

---

## Phase 1: Install Dependencies & Generate Secrets

### Overview

Install Auth.js v5, bcryptjs, and generate the required secret key for session signing.

### Changes Required:

#### 1. Install npm packages

**File**: `package.json`

**Intent**: Add Auth.js v5 and bcryptjs as project dependencies.

**Contract**: Run `npm install next-auth@beta bcryptjs` and verify both appear in `package.json` dependencies.

#### 2. Install type definitions

**File**: `package.json`

**Intent**: Add TypeScript types for bcryptjs.

**Contract**: Run `npm install -D @types/bcryptjs` and verify it appears in `package.json` devDependencies.

#### 3. Generate AUTH_SECRET

**File**: `.env.local`

**Intent**: Generate a cryptographically secure secret for session signing.

**Contract**: Run `npx auth secret` and add the output to `.env.local`:
```
AUTH_SECRET=<generated-value>
```

### Success Criteria:

#### Automated Verification:

- [ ] 1.1 `npm list next-auth` shows version 5.0.0-beta.x
- [ ] 1.2 `npm list bcryptjs` shows version 3.x
- [ ] 1.3 `.env.local` contains `AUTH_SECRET=` line

#### Manual Verification:

- [ ] 1.4 Verify `.env.local` is in `.gitignore` (secret not committed)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Configure Auth.js

### Overview

Create the Auth.js configuration file with credentials provider, JWT sessions, and bcryptjs integration.

### Changes Required:

#### 1. Create auth configuration

**File**: `auth.ts` (project root)

**Intent**: Initialize Auth.js with credentials provider (username/password), JWT sessions, and bcryptjs for password verification.

**Contract**: Create `auth.ts` with the following structure:

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // TODO: Replace with database lookup when F-02 lands
        // For now, hardcoded user for testing
        if (credentials?.username === "admin" && 
            credentials?.password === "wedding2026") {
          return { id: "1", name: "Admin", email: "admin@example.com" }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
```

**Note**: The `authorize` function uses hardcoded credentials temporarily. When F-02 (database scaffold) lands, replace with actual database lookup using bcrypt comparison:
```typescript
const validPassword = await bcrypt.compare(password, user.password_hash)
```

### Success Criteria:

#### Automated Verification:

- [ ] 2.1 TypeScript compiles without errors: `npm run build`
- [ ] 2.2 No ESLint errors: `npm run lint`

#### Manual Verification:

- [ ] 2.3 Verify auth.ts exports: handlers, signIn, signOut, auth

**Implementation Note**: Pause for manual confirmation before proceeding.

---

## Phase 3: Create API Route

### Overview

Create the NextAuth API route handler that processes authentication requests.

### Changes Required:

#### 1. Create auth route handler

**File**: `src/app/api/auth/[...nextauth]/route.ts`

**Intent**: Wire up the Auth.js handlers to handle sign-in and sign-out requests.

**Contract**: Create the route file:

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Success Criteria:

#### Automated Verification:

- [ ] 3.1 TypeScript compiles: `npm run build`
- [ ] 3.2 Route file exists at correct path

#### Manual Verification:

- [ ] 3.3 POST to `/api/auth/[...nextauth]` with valid credentials returns session

**Implementation Note**: Pause for manual confirmation.

---

## Phase 4: Build Login Page

### Overview

Create a simple, centered login form at `/login`.

### Changes Required:

#### 1. Create login page component

**File**: `src/app/login/page.tsx`

**Intent**: Render a centered login form with username and password fields.

**Contract**: Create the page:

```tsx
"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })
    
    if (result?.error) {
      setError("Invalid credentials")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
        <h1 className="text-center text-2xl font-semibold">Sign In</h1>
        
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:

- [ ] 4.1 TypeScript compiles: `npm run build`
- [ ] 4.2 No ESLint errors: `npm run lint`

#### Manual Verification:

- [ ] 4.3 Login page renders at `/login`
- [ ] 4.4 Form submits and redirects to `/` on success
- [ ] 4.5 Invalid credentials show error message

**Implementation Note**: Pause for manual confirmation.

---

## Phase 5: Add Session Provider

### Overview

Wrap the app with SessionProvider to enable session access in client components.

### Changes Required:

#### 1. Create SessionProvider wrapper

**File**: `src/components/providers.tsx`

**Intent**: Create a client-side provider component for session context.

**Contract**: Create the component:

```tsx
"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

#### 2. Wrap app layout

**File**: `src/app/layout.tsx`

**Intent**: Wrap the root layout with the Providers component.

**Contract**: Modify `layout.tsx`:

```tsx
import { Providers } from "@/components/providers"
// ... existing imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Success Criteria:

#### Automated Verification:

- [ ] 5.1 TypeScript compiles: `npm run build`

#### Manual Verification:

- [ ] 5.2 Session is accessible in client components via `useSession()` hook

**Implementation Note**: Pause for manual confirmation.

---

## Phase 6: Protect Routes

### Overview

Configure Auth.js proxy middleware to protect all routes except `/login`.

### Changes Required:

#### 1. Create proxy middleware

**File**: `src/middleware.ts`

**Intent**: Protect routes by redirecting unauthenticated users to `/login`.

**Contract**: Create the middleware:

```typescript
export { auth as proxy } from "@/auth"

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
}
```

#### 2. Update root page

**File**: `src/app/page.tsx`

**Intent**: Replace default Next.js page with authenticated dashboard placeholder.

**Contract**: Replace the page content with a simple authenticated view:

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/auth"

export default function Home() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Welcome, {session.user?.name}</h1>
      <p className="mt-4 text-zinc-600">Wedding Planner Dashboard</p>
      
      <form
        action={async () => {
          "use server"
          await signOut()
        }}
        className="mt-8"
      >
        <button className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50">
          Sign Out
        </button>
      </form>
    </div>
  )
}
```

**Note**: This uses Server Component pattern — `auth()` is called directly in the component.

### Success Criteria:

#### Automated Verification:

- [ ] 6.1 TypeScript compiles: `npm run build`
- [ ] 6.2 Middleware file exists

#### Manual Verification:

- [ ] 6.3 Unauthenticated access to `/` redirects to `/login`
- [ ] 6.4 After login, user sees dashboard
- [ ] 6.5 Sign out button clears session and redirects to `/login`

**Implementation Note**: Pause for manual confirmation.

---

## Phase 7: Create User Seed

### Overview

Create the users table schema and seed initial users for testing.

### Changes Required:

#### 1. Create database schema placeholder

**File**: `src/lib/db/schema.ts`

**Intent**: Define the users table structure (will be wired when F-02 lands).

**Contract**: Create the schema file:

```typescript
// Placeholder schema - will be replaced with actual Prisma/Drizzle schema in F-02
export interface User {
  id: string
  username: string
  password_hash: string
  created_at: Date
}

// Seed users for testing
export const SEED_USERS = [
  { username: "admin", password: "wedding2026" },
  { username: "user", password: "wedding2026" },
]
```

#### 2. Update auth.ts to use seed users

**File**: `auth.ts`

**Intent**: Replace hardcoded credentials with seed user lookup + bcrypt comparison.

**Contract**: Update the `authorize` function:

```typescript
import bcrypt from "bcryptjs"
import { SEED_USERS } from "@/lib/db/schema"

async authorize(credentials) {
  const user = SEED_USERS.find(u => u.username === credentials?.username)
  if (!user) return null
  
  const validPassword = await bcrypt.compare(
    credentials?.password as string,
    user.password
  )
  
  if (!validPassword) return null
  
  return { id: user.username, name: user.username, email: `${user.username}@example.com` }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] 7.1 TypeScript compiles: `npm run build`
- [ ] 7.2 Seed users file exists

#### Manual Verification:

- [ ] 7.3 Can login with seed user credentials
- [ ] 7.4 Invalid username shows error
- [ ] 7.5 Invalid password shows error

**Implementation Note**: Pause for manual confirmation.

---

## Testing Strategy

### Unit Tests:

- Middleware redirects unauthenticated users
- `authorize()` function rejects invalid credentials
- `authorize()` function accepts valid credentials

### Integration Tests:

- Full login flow: `/login` → credentials → `/` → session active
- Logout flow: `/` → sign out → `/login` → session cleared

### Manual Testing Steps:

1. Navigate to `/` → verify redirect to `/login`
2. Enter invalid credentials → verify error message
3. Enter valid credentials (`admin` / `wedding2026`) → verify redirect to `/`
4. Verify dashboard shows welcome message
5. Click "Sign Out" → verify redirect to `/login`
6. Navigate directly to `/` while logged out → verify redirect

## Performance Considerations

- JWT sessions are stateless — no database round-trip per request
- bcryptjs is slower than native bcrypt but acceptable for 2 users
- Session expiry: default 30 days (Auth.js default)

## Migration Notes

- This scaffold uses seed users temporarily
- When F-02 (database scaffold) lands, replace `SEED_USERS` with actual database query
- Migration path: keep seed users as fallback during database transition

## References

- Auth.js v5 docs: https://authjs.dev/getting-started/installation?framework=next.js
- Auth.js credentials provider: https://authjs.dev/getting-started/providers/credentials
- bcryptjs npm: https://www.npmjs.com/package/bcryptjs
- Roadmap F-01: `context/foundation/roadmap.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Install Dependencies & Generate Secrets

#### Automated

- [x] 1.1 `npm list next-auth` shows version 5.0.0-beta.x — c0a425a
- [x] 1.2 `npm list bcryptjs` shows version 3.x — c0a425a
- [x] 1.3 `.env.local` contains `AUTH_SECRET=` line — c0a425a

#### Manual

- [x] 1.4 Verify `.env.local` is in `.gitignore` — c0a425a

### Phase 2: Configure Auth.js

#### Automated

- [x] 2.1 TypeScript compiles without errors: `npm run build`
- [x] 2.2 No ESLint errors: `npm run lint`

#### Manual

- [ ] 2.3 Verify auth.ts exports: handlers, signIn, signOut, auth

### Phase 3: Create API Route

#### Automated

- [ ] 3.1 TypeScript compiles: `npm run build`
- [ ] 3.2 Route file exists at correct path

#### Manual

- [ ] 3.3 POST to `/api/auth/[...nextauth]` with valid credentials returns session

### Phase 4: Build Login Page

#### Automated

- [ ] 4.1 TypeScript compiles: `npm run build`
- [ ] 4.2 No ESLint errors: `npm run lint`

#### Manual

- [ ] 4.3 Login page renders at `/login`
- [ ] 4.4 Form submits and redirects to `/` on success
- [ ] 4.5 Invalid credentials show error message

### Phase 5: Add Session Provider

#### Automated

- [ ] 5.1 TypeScript compiles: `npm run build`

#### Manual

- [ ] 5.2 Session is accessible in client components via `useSession()` hook

### Phase 6: Protect Routes

#### Automated

- [ ] 6.1 TypeScript compiles: `npm run build`
- [ ] 6.2 Middleware file exists

#### Manual

- [ ] 6.3 Unauthenticated access to `/` redirects to `/login`
- [ ] 6.4 After login, user sees dashboard
- [ ] 6.5 Sign out button clears session and redirects to `/login`

### Phase 7: Create User Seed

#### Automated

- [ ] 7.1 TypeScript compiles: `npm run build`
- [ ] 7.2 Seed users file exists

#### Manual

- [ ] 7.3 Can login with seed user credentials
- [ ] 7.4 Invalid username shows error
- [ ] 7.5 Invalid password shows error
