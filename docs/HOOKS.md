# Custom Hooks Reference

This document describes all custom React hooks in `src/hooks/`.

---

## Authentication & Authorization

### `useRBAC`
**File:** `src/hooks/useRBAC.ts`

Role-based access control helper.

**Returns:**
```ts
{
  isAdmin: boolean;
  isTeacher: boolean;
  canAccess: (resource: string) => boolean;
}
```

**Usage:** Use in components to conditionally render admin-only UI or guard actions.

---

### `useUserRole`
**File:** `src/hooks/useUserRole.ts`

Fetches the current authenticated user's role from the `profiles` table.

**Returns:** `{ role: "admin" | "teacher" | null, isLoading: boolean }`

---

### `use-auth`
**File:** `src/hooks/use-auth.ts`

Provides access to the `AuthContext` values (user, session, signOut).

---

## Data Hooks

### `useAnalyticsData`
**File:** `src/hooks/useAnalyticsData.ts`

Fetches all analytics data for a teacher's portal.

**Parameters:** `teacherId: string`

**Returns:**
```ts
{
  data: {
    qualityDistribution: { quality: string; count: number }[];
    timeProgress: { date: string; count: number }[];
    studentProgress: { name: string; verses: number }[];
    dailyActivity: { name: string; count: number }[];
  };
  isLoading: boolean;
  error: Error | null;
}
```

**Query key:** `["teacher-analytics", teacherId]`

---

### `useTeacherMessages`
**File:** `src/hooks/useTeacherMessages.ts`

Fetches inbox and sent messages for a teacher from the `communications` table.

**Parameters:** `teacherId: string`

**Returns:**
```ts
{
  inboxMessages: Message[];
  sentMessages: Message[];
  recipients: { id: string; name: string; type: string }[];
  inboxLoading: boolean;
  sentLoading: boolean;
  recipientsLoading: boolean;
  refetchMessages: () => void;
  unreadCount: number;
}
```

**Query keys:** `["teacher-inbox", teacherId]`, `["teacher-sent", teacherId]`

---

### `useAdminMessages`
**File:** `src/hooks/useAdminMessages.ts`

Fetches received and sent messages for the admin from the `communications` table. Admin-sent messages are identified by `sender_id = null`.

**Returns:**
```ts
{
  receivedMessages: Message[];
  sentMessages: Message[];
  receivedLoading: boolean;
  sentLoading: boolean;
  refetchMessages: () => void;
}
```

**Query keys:** `["admin-inbox"]`, `["admin-sent"]`

---

### `useLeaderboardData`
**File:** `src/hooks/useLeaderboardData.ts`

Fetches student leaderboard data (Juz mastery rankings).

**Parameters:** `teacherId?: string`

**Returns:** Leaderboard entries sorted by mastery score.

---

### `useTeacherSummary`
**File:** `src/hooks/useTeacherSummary.ts`

Fetches summary statistics for a teacher's dashboard (student count, recent activity, etc.).

**Parameters:** `teacherId: string`

---

### `useTeacherAccounts`
**File:** `src/hooks/useTeacherAccounts.ts`

Fetches and manages teacher account data for the admin teacher accounts page.

---

### `useSettings`
**File:** `src/hooks/useSettings.ts`

Fetches and updates admin/app settings from Supabase.

---

### `useTeacherStatus`
**File:** `src/hooks/useTeacherStatus.ts`

Fetches the active/inactive status of teachers.

---

## Real-time Hooks

### `useRealtimeMessages`
**File:** `src/hooks/useRealtimeMessages.ts`

Sets up Supabase real-time subscriptions for a teacher's message inbox. Automatically invalidates `["teacher-inbox", teacherId]` query and shows toast notifications when new messages arrive.

**Parameters:** `teacherId: string`

**Side effects:** Creates 3 Supabase channels; cleans them up on unmount.

---

### `useRealtimeAdminMessages`
**File:** `src/hooks/useRealtimeAdminMessages.ts`

Sets up Supabase real-time subscriptions for admin messages.

---

### `useRealtimeLeaderboard`
**File:** `src/hooks/useRealtimeLeaderboard.ts`

Sets up real-time subscription on `juz_mastery` table for live leaderboard updates.

---

### `useRealtimeAnalytics`
**File:** `src/hooks/useRealtimeAnalytics.ts`

Sets up real-time subscription on `progress` table for live analytics updates.

---

## UI Hooks

### `use-toast`
**File:** `src/hooks/use-toast.ts`

shadcn/ui toast notification hook. Returns `toast()` function for triggering notifications.

**Usage:**
```tsx
const { toast } = useToast();
toast({ title: "Saved", description: "Changes saved successfully." });
```

### `use-mobile`
**File:** `src/hooks/use-mobile.tsx`

Returns `true` if the viewport is considered mobile width.

### `use-sidebar`
**File:** `src/hooks/use-sidebar.ts`

Manages sidebar open/collapsed state.

### `use-theme`
**File:** `src/hooks/use-theme.ts`

Returns current theme and `setTheme` function. Theme is persisted in localStorage.

### `useDashboardNavigation`
**File:** `src/hooks/useDashboardNavigation.ts`

Provides navigation helpers for dashboard pages.
