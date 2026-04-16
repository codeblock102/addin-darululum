# Handoff Log — Darul Ulum Montreal

This file is **non-negotiable**. Every meaningful change must be logged here.

---

## 2026-04-15 — Initial cleanup, UI fix, and documentation setup

**What:**
- Created `.claude/launch.json` with dev server configurations (vite dev on :5173, vite preview on :4173)
- Set up Claude memory system at `.claude/projects/…/memory/` with user, project, feedback, and handoff protocol notes
- Created `handoff.md` (this file) and `abdul.wiki` (living app documentation)
- Removed debug `console.log` leaking admin nav items from `Sidebar.tsx` (line 252)
- Removed dead/unused imports prefixed with `_` from `Sidebar.tsx`, `StudentSearch.tsx`, `TeacherMessages.tsx`
- Fixed `text-black` misuse → `text-muted-foreground` in dashboard components (TodayStudents, RecentActivity, QuickActions, StudentSearch)
- Fixed `DashboardStats.tsx` hardcoded stubs: `attendanceRate` always returned 92, `activeClasses` always returned 8 — replaced with real Supabase queries
- Removed fake hardcoded trend values from DashboardStats
- Implemented real data in `TodayStudents.tsx` — now fetches today's actual attendance
- Implemented real data in `RecentActivity.tsx` — now fetches recent progress entries
- Deleted dead file `src/styles/enhanced-ui.css` (was never imported)
- Removed dead `.enhanced-*` CSS utility classes from `components.css` (none were used in any component)

**Why:**
- Previous UI changes introduced debug artifacts, hardcoded fake data, and visual inconsistencies
- `text-black` on secondary/muted text looks harsh and breaks the design language
- Stub data in DashboardStats gives false metrics to admins — dangerous for trust
- `console.log` in Sidebar leaks navigation structure to any user with DevTools open

**Files changed:**
- `src/components/layouts/Sidebar.tsx`
- `src/components/teacher-portal/dashboard/StudentSearch.tsx`
- `src/pages/TeacherMessages.tsx`
- `src/components/teacher-portal/dashboard/TodayStudents.tsx`
- `src/components/teacher-portal/dashboard/RecentActivity.tsx`
- `src/components/teacher-portal/dashboard/QuickActions.tsx`
- `src/components/dashboard/DashboardStats.tsx`
- `src/styles/components.css`
- `src/styles/enhanced-ui.css` (deleted)

---
