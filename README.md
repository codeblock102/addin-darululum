# Addin Darululum

A student management system for Madrassah Hifz (Quran memorization) programmes. Enables administrators and teachers to track student progress, attendance, and communicate effectively.

## Features

- **Admin Portal** — Manage students, teachers, classes, and view system-wide stats
- **Teacher Portal** — Record daily Quran memorization progress (Sabaq, Sabaq Para, Dhor), mark attendance, and view analytics
- **Progress Book (Dhor Book)** — Digital equivalent of the traditional Hifz record book
- **Messaging** — Real-time messaging between admin and teachers
- **Analytics** — Charts for memorization quality, student progress, and daily activity
- **Leaderboard** — Gamified student rankings by Juz mastery

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Backend/Database | Supabase (PostgreSQL + Auth + Realtime) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Forms | react-hook-form + Zod |
| State | TanStack Query (React Query v5) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project with the required tables (see [Architecture docs](docs/ARCHITECTURE.md))

### Environment Setup

Create a `.env` file (or set environment variables):

```sh
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

### First-time Admin Setup

1. Navigate to `/setup-admin` to create the first admin account.
2. Log in and go to **Teacher Accounts** to create teacher logins.
3. Add students and assign them to teachers via **Classes**.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, directory structure, database schema |
| [docs/HOOKS.md](docs/HOOKS.md) | Reference for all custom React hooks |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Step-by-step guide for admins and teachers |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Definitions of Islamic/Madrassah terms used in the system |
| [docs/FAQ.md](docs/FAQ.md) | Frequently asked questions |

## Project Structure

```
src/
├── pages/          # Route-level page components
├── components/     # UI components (admin/, teacher-portal/, dhor-book/, ui/)
├── hooks/          # Custom React hooks
├── contexts/       # React context providers
├── integrations/   # Supabase client and generated types
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full structure.

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to all features |
| **Teacher** | Access to own students, progress recording, attendance, analytics, messaging |
