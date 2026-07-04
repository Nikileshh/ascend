# Ascend

Turn your goals into a personalized execution system. Your AI coach for roadmaps, schedules, and habits.

## Structure

This is a pnpm workspace monorepo:

- [`frontend/`](frontend/) — Next.js app (React 19, Tailwind CSS v4)
- [`backend/`](backend/) — Express API server (TypeScript, Zod)

## Getting started

```bash
pnpm install

# Run both frontend and backend
pnpm dev

# Or individually
pnpm dev:frontend   # http://localhost:3000
pnpm dev:backend    # http://localhost:4000
```

Copy `frontend/.env.example` to `frontend/.env.local` and `backend/.env.example` to `backend/.env` before running.

## Scripts

| Command          | What it does                         |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Run frontend + backend in watch mode |
| `pnpm build`     | Build all packages                   |
| `pnpm lint`      | Lint all packages                    |
| `pnpm typecheck` | Type-check all packages              |
| `pnpm format`    | Format the whole repo with Prettier  |
