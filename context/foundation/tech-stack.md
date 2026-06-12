---
starter_id: next
package_manager: npm
project_name: wedding-planner
hints:
  language_family: js
  team_size: solo
  deployment_target: self-host
  ci_provider: github-actions
  ci_default_flow: manual-promotion
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: true
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

A solo developer building a self-hosted wedding planning app with a 4-week after-hours timeline needs a battle-tested, agent-friendly stack that runs on Node.js anywhere. Next.js is the recommended choice for TypeScript web apps with self-host deployment — it runs on any Linux server without edge-runtime constraints. The stack clears all four agent-friendly gates (TypeScript, official create-next-app starter, strong conventions, excellent docs) and the self-check came back clean across all five points. Auth is required per PRD; payments, realtime, and AI are explicitly out of scope. GitHub Actions handles build + test with RPM package artifact; manual deploy to the LAN PC server.
