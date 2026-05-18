# Cadence - HR Goal Management & AI Analytics Portal
> Built for AtomQuest Hackathon 1.0

## Live demo
[https://your-railway-url.up.railway.app]

## Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Employee | employee@cadence.app | demo123 |
| Manager | manager@cadence.app | demo123 |
| Admin / HR | admin@cadence.app | demo123 |

## Features
- Goal lifecycle: Draft -> Submit -> Manager Approval -> Quarterly Check-ins
- UoM-based progress scoring (Min, Max, Timeline, Zero formulas)
- Shared departmental KPIs pushed from manager to team
- Immutable audit trail with full change history
- RAG command center: ask anything about goal data in plain English
- QoQ analytics: completion trends, department breakdowns, overdue tracking

## Stack
Next.js 16 | React 19 | Prisma 6 | PostgreSQL + pgvector | NextAuth | OpenAI embeddings | Claude Sonnet (RAG synthesis) | Recharts | Tailwind CSS 4

## Setup
1. Clone the repo
2. Copy .env.example to .env and fill in your values
3. npm install
4. npx prisma migrate dev
5. npx prisma db seed
6. npm run dev

## Environment variables
See .env.example for required variables.
