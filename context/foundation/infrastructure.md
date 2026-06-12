---
project: Wedding Planner
researched_at: 2026-06-12
recommended_platform: Docker Standalone
runner_up: Coolify
context_type: mvp
tech_stack:
  language: JavaScript
  framework: Next.js
  runtime: Node.js 22
---

## Recommendation

**Deploy using Docker Standalone with Next.js `output: standalone`.**

This approach is the official Next.js production Docker deployment method — minimal, portable, and transparent. For your LAN-only, 2-user wedding app, it provides the right balance: Docker portability without PaaS abstraction overhead. You build once, run anywhere, and the deployment is just a container restart.

## Platform Comparison

| Option | CLI-first | Managed | Docs | Stable API | MCP | Total |
|--------|-----------|---------|------|------------|-----|-------|
| Docker Standalone | Pass | Partial | Pass | Pass | Fail | 3.5 |
| Coolify | Pass | Pass | Pass | Pass | Fail | 4 |
| CapRover | Pass | Pass | Partial | Pass | Fail | 3.5 |
| Plain Docker Compose | Pass | Partial | Pass | Pass | Fail | 3.5 |

**Scoring notes:**
- **CLI-first**: All options pass — Docker CLI, Coolify CLI, and Compose are all terminal-driven.
- **Managed**: Coolify wins (full PaaS abstraction). Docker Standalone is "partial" — you manage the container, Docker manages the runtime.
- **Docs**: All pass — Next.js docs are excellent, Coolify/CapRover have solid docs.
- **Stable API**: All pass — Docker commands are stable, deploy hooks are deterministic.
- **MCP**: All fail — no MCP servers for self-hosted Docker deployment (not applicable for this use case).

### Shortlisted Platforms

#### 1. Docker Standalone (Recommended)

Next.js official production Docker deployment. Uses `output: standalone` in `next.config.ts` to generate a minimal Docker image (~150-300MB) with only runtime dependencies. Maximum portability, minimum abstraction. You own the container lifecycle — build, run, restart, logs.

#### 2. Coolify (Runner-up)

Self-hosted PaaS — Vercel-like DX on your own server. Git-push to deploy, automatic SSL, preview deployments, built-in database management. Best DX for solo MVP, but adds an abstraction layer. Requires domain/DNS setup for SSL; more initial config work.

#### 3. Plain Docker Compose

Full control over app + database containers. More configuration (Dockerfile + compose.yml + networking), but transparent and portable. Good if you need fine-grained control over volumes, networks, and service dependencies.

## Anti-Bias Cross-Check: Docker Standalone

### Devil's Advocate — Weaknesses

1. You manage everything — no PaaS dashboard for logs, restarts, or health checks. All operational tasks are manual CLI commands.
2. Docker image size — standalone output is minimal but still ~150-300MB. Multiple builds accumulate disk usage.
3. No automatic SSL — HTTPS requires manual setup (reverse proxy, Let's Encrypt) if you want encrypted LAN traffic.
4. Manual updates — each deploy requires rebuilding the image and restarting the container. No Git-push automation unless you build it yourself.

### Pre-Mortem — How This Could Fail

Six months later, the deployment approach caused friction. You built the Docker image once, deployed it, and it worked. But when you needed to update the app, you forgot to rebuild the image properly, deployed stale code, and spent an hour debugging why your changes weren't showing. The database container lost data because you didn't configure a volume mount. For LAN-only with 2 users, the manual deploy process felt tedious compared to "git push and it's live." You realize the simplicity came with operational friction you didn't anticipate.

### Unknown Unknowns

1. Next.js standalone output doesn't include `node_modules` for devDependencies — if your build step needs them at runtime, the container will fail.
2. The standalone Docker image runs as root by default — for production you'd want a non-root user, but for LAN MVP this is acceptable.
3. Docker on Linux requires the user to be in the `docker` group — if you're not, `docker` commands will fail with permission errors.

## Operational Story

How Docker Standalone actually operates day to day:

- **Preview deploys**: Not applicable — single production container. Build locally, push image, restart container. For PR previews, run a second container on a different port.
- **Secrets**: Environment variables via `docker run -e` or `.env` file mounted as volume. For production, use `docker --env-file` or Docker secrets (Swarm mode).
- **Rollback**: Re-run the previous container image tag. Typical time: 30-60 seconds. Data caveat: database migrations don't auto-rollback — keep migration scripts versioned.
- **Approval**: All actions are manual CLI commands — an agent can run `docker build`, `docker tag`, `docker run` unattended. Human approves before `docker stop` + `docker run` swap.
- **Logs**: `docker logs -f wedding-planner` for live tail. `docker logs wedding-planner --tail 100` for recent history. JSON logs with `--log-driver json-file`.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|------|--------|------------|--------|------------|
| Stale image deployed | Pre-mortem | Medium | Medium | Script the build-deploy-restart sequence; use image tags with git SHA |
| Database data loss | Pre-mortem | Medium | High | Mount Docker volume for database persistence; backup `.data/` directory weekly |
| Docker permission errors | Unknown unknowns | Low | Low | Add your user to `docker` group: `sudo usermod -aG docker $USER` |
| Missing devDependencies at runtime | Unknown unknowns | Low | Medium | Test the standalone build locally before deploying; run `docker run --rm` to verify |
| No HTTPS on LAN | Devil's advocate | Low | Low | For LAN-only, HTTP is acceptable. Add reverse proxy (nginx/traefik) + Let's Encrypt if needed later |
| Manual deploy friction | Devil's advocate | Medium | Low | Write a simple deploy script (`deploy.sh`) that builds, tags, and restarts in one command |

## Getting Started

1. **Add standalone output to `next.config.ts`:**

   ```ts
   // next.config.ts
   const nextConfig = {
     output: 'standalone',
   };
   
   export default nextConfig;
   ```

2. **Create a minimal `Dockerfile`:**

   ```dockerfile
   # Use Node.js 22 (matches your tech stack)
   FROM node:22-alpine AS base
   
   # Production dependencies only
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci --only=production
   
   # Build the application
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   RUN addgroup --system --gid 1001 nodejs && \
       adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV HOSTNAME="0.0.0.0"
   CMD ["node", "server.js"]
   ```

3. **Build and run:**

   ```bash
   # Build the Docker image
   docker build -t wedding-planner .
   
   # Run the container (LAN-accessible on port 3000)
   docker run -d -p 3000:3000 --name wedding-planner wedding-planner
   ```

4. **Access the app:**

   Open `http://<your-server-ip>:3000` from any browser on your LAN.

5. **Add a database (optional, for later):**

   Create `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     app:
       image: wedding-planner
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/wedding_planner
       depends_on:
         - db
     db:
       image: postgres:15
       volumes:
         - postgres_data:/var/lib/postgresql/data
       environment:
         - POSTGRES_PASSWORD=password
         - POSTGRES_DB=wedding_planner
   volumes:
     postgres_data:
   ```

   Run with `docker-compose up -d`.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration (provided above in "Getting Started")
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
- Kubernetes or container orchestration
