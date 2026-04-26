# Architecture Overview

## Project Summary

Addin Darululum is a Madrassah (Islamic school) student management system. It allows administrators to manage students, teachers, classes, and attendance, while teachers can record daily Quran memorization progress, track attendance, and communicate via messaging.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend framework | React 18 | UI rendering |
| Build tool | Vite | Development server and bundling |
| Language | TypeScript | Type-safe JavaScript |
| Routing | react-router-dom v6 | Client-side navigation |
| Server state | TanStack Query (React Query v5) | Data fetching, caching, invalidation |
| Backend/Database | Supabase | PostgreSQL database, Auth, real-time subscriptions |
| UI components | shadcn/ui + Tailwind CSS | Accessible component library |
| Charts | Recharts | Data visualization |
| Forms | react-hook-form + Zod | Form state management and validation |
| Notifications | shadcn Toaster + Sonner | Toast notifications |

---

## Project Structure

```
src/
├── App.tsx                         # Root component: routes and providers
├── main.tsx                        # Entry point
│
├── pages/                          # Route-level page components
│   ├── Index.tsx                   # Home page (role-based redirect)
│   ├── Auth.tsx                    # Login/signup page
│   ├── Dashboard.tsx               # Admin or teacher dashboard
│   ├── Students.tsx                # Student list (admin)
│   ├── StudentDetail.tsx           # Individual student detail
│   ├── Teachers.tsx                # Teacher list (admin)
│   ├── TeacherAccounts.tsx         # Teacher account management
│   ├── Classes.tsx                 # Class management
│   ├── ProgressBook.tsx            # Dhor book / progress entries
│   ├── Attendance.tsx              # Attendance management
│   ├── Settings.tsx                # Admin settings
│   ├── Preferences.tsx             # Teacher preferences
│   └── admin/                      # Admin-only utility pages
│       ├── DatabaseSeeder.tsx
│       ├── SetupAdmin.tsx
│       └── ManualRoleSetup.tsx
│
├── components/
│   ├── layouts/                    # App shell (sidebar, header, layout wrapper)
│   │   ├── DashboardLayout.tsx     # Outer layout with sidebar
│   │   ├── Sidebar.tsx             # Main navigation sidebar
│   │   ├── sidebar/                # Sidebar sub-components
│   │   └── dashboard/              # Dashboard layout sub-components
│   │
│   ├── auth/                       # Auth guards
│   │   └── ProtectedRoute.tsx      # Wraps routes requiring authentication
│   │
│   ├── admin/                      # Admin portal components
│   │   ├── AdminDashboard.tsx      # Admin dashboard entry point
│   │   ├── AdminStatsCards.tsx     # Stats summary cards
│   │   ├── messaging/              # Admin messaging system
│   │   ├── settings/               # Admin settings panels
│   │   └── teacher-accounts/       # Teacher account creation
│   │
│   ├── teacher-portal/             # Teacher portal components
│   │   ├── TeacherDashboard.tsx    # Teacher home dashboard
│   │   ├── TeacherAnalytics.tsx    # Analytics charts and stats
│   │   ├── TeacherAttendance.tsx   # Attendance recording
│   │   ├── analytics/              # Chart sub-components
│   │   ├── attendance/             # Attendance sub-components
│   │   ├── dashboard/              # Dashboard sub-components
│   │   ├── messaging/              # Teacher messaging
│   │   └── students/               # Student views for teachers
│   │
│   ├── dhor-book/                  # Progress book (Dhor Book)
│   │   ├── DhorBookEntryForm.tsx   # Main entry form
│   │   ├── ClassroomRecords.tsx    # Classroom records view
│   │   ├── entry-form/             # Entry form sub-components (tabs, fields)
│   │   └── classroom/              # Classroom sub-components
│   │
│   ├── students/                   # Student management
│   ├── teachers/                   # Teacher management
│   │   └── dialog/                 # Teacher dialog sub-components
│   ├── attendance/                 # Attendance components
│   ├── classes/                    # Class management components
│   ├── dashboard/                  # Shared dashboard components
│   ├── progress/                   # Progress tracking components
│   ├── student-progress/           # Student progress display
│   ├── mobile/                     # Mobile-specific components
│   └── ui/                         # shadcn/ui base components
│
├── hooks/                          # Custom React hooks
│   ├── useRBAC.ts                  # Role-based access control
│   ├── useUserRole.ts              # Current user role
│   ├── useAnalyticsData.ts         # Teacher analytics data
│   ├── useTeacherMessages.ts       # Teacher inbox/sent messages
│   ├── useAdminMessages.ts         # Admin inbox/sent messages
│   ├── useRealtimeMessages.ts      # Real-time message subscriptions
│   ├── useLeaderboardData.ts       # Student leaderboard
│   ├── useTeacherSummary.ts        # Teacher dashboard summary
│   └── ...
│
├── contexts/
│   └── AuthContext.tsx             # Authentication state provider
│
├── integrations/
│   └── supabase/
│       ├── client.ts               # Supabase client instance
│       └── types.ts                # Auto-generated DB types
│
├── types/                          # TypeScript type definitions
│   ├── progress.ts                 # Progress, Message, JuzRevision types
│   ├── attendance.ts               # Attendance types
│   ├── teacher.ts                  # Teacher types
│   ├── navigation.ts               # Sidebar navigation types
│   └── ...
│
├── utils/                          # Utility functions
├── config/                         # App configuration
└── styles/                         # Global CSS
```

---

## Authentication & Authorization Flow

```
User visits app
     │
     ▼
ProtectedRoute checks AuthContext
     │
     ├── Not authenticated → redirect to /auth
     │
     └── Authenticated
           │
           ▼
         useUserRole() queries profiles table
           │
           ├── role = "admin" → AdminDashboard, full access
           └── role = "teacher" → TeacherDashboard, restricted access
```

- **AuthContext** (`src/contexts/AuthContext.tsx`): Wraps the app, listens to `supabase.auth.onAuthStateChange`, provides `user`, `session`, and `signOut`.
- **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): Redirects unauthenticated users to `/auth`. Optionally accepts `requireAdmin` prop.
- **useRBAC** (`src/hooks/useRBAC.ts`): Returns `isAdmin`, `isTeacher`, and permission-check helpers.
- **useUserRole** (`src/hooks/useUserRole.ts`): Fetches the current user's role from the `profiles` table.

---

## Database Schema

The Supabase PostgreSQL database has the following key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts with role (admin/teacher), name, email |
| `students` | Student records (deprecated, migrated to `students_teachers`) |
| `students_teachers` | Student records with teacher assignments |
| `teachers` | Additional teacher profile data |
| `classes` | Class definitions with section, grade, status |
| `attendance` | Daily attendance records per student |
| `progress` | Daily Quran memorization progress entries |
| `juz` | Juz mastery records per student |
| `juz_revisions` | Individual revision records for each Juz |
| `juz_mastery` | Juz mastery levels per student |
| `communications` | Messaging between teachers and admin |

### communications table
```
id            uuid (PK)
message       text
sender_id     uuid | null   -- null = admin message
recipient_id  uuid
read          boolean
created_at    timestamptz
message_type  text          -- "direct" | "announcement" | "feedback"
category      text          -- "academic" | "administrative" | "general"
parent_message_id  uuid     -- for threading
sender_name   text
recipient_name text
read_at       timestamptz
```

---

## State Management

| Type | Tool | Usage |
|------|------|-------|
| Server/async state | TanStack Query | All Supabase data fetching |
| Real-time updates | Supabase Realtime + TanStack Query invalidation | Messaging, leaderboard |
| Form state | react-hook-form | All forms (Dhor Book entry, Teacher dialog, etc.) |
| Local UI state | React `useState` | Tabs, toggles, modal open state |
| Auth state | React Context (`AuthContext`) | Current user session |
| Theme | React Context (`ThemeProvider`) | Light/dark mode, persisted in localStorage |

---

## Routing Structure

```
/auth                           Login page (public)
/create-demo-account            Demo account creation (public)
/setup-admin                    Admin setup utility (public)
/role-setup                     Manual role assignment (public)

Protected (requires auth):
/                               Home (redirects based on role)
/dashboard                      Admin or Teacher dashboard
/students                       Student list (admin)
/students/:id                   Student detail (admin)
/teachers                       Teacher list (admin-only)
/teacher-accounts               Teacher account management (admin-only)
/classes                        Class management
/progress-book                  Dhor Book entry and records
/attendance                     Attendance management
/settings                       Admin settings
/preferences                    Teacher preferences
/admin/database-seeder          Database seeding utility (admin)
```

---

## Real-time Subscriptions

| Hook | Table Watched | Purpose |
|------|--------------|---------|
| `useRealtimeMessages` | `communications` | New inbox messages for teacher |
| `useRealtimeAdminMessages` | `communications` | New messages for admin |
| `useRealtimeLeaderboard` | `juz_mastery` | Live leaderboard updates |
| `useRealtimeAnalytics` | `progress` | Analytics data updates |

All real-time hooks use `supabase.channel()` with `postgres_changes` and invalidate TanStack Query caches on events.

---

## Key Patterns

### Data Fetching
All data fetching is done via TanStack Query `useQuery` hooks. Query keys follow the pattern `["entity-name", id]` to allow targeted cache invalidation.

### Mutations
Data mutations use TanStack Query `useMutation` or direct `supabase.from(...).insert/update/delete` calls followed by `queryClient.invalidateQueries()`.

### Forms
All forms use `react-hook-form` with Zod schema validation via `zodResolver`. Form schemas are co-located with their components (or extracted to a `*Schema.ts` file for larger forms).

### Component Splitting
Large page components are split into smaller focused sub-components. Each directory contains an `index.ts` barrel file for clean imports.
