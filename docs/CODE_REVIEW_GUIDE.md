# Code Review Guide — Dār Al-Ulūm Montréal

A running record of significant changes and what reviewers should verify. Ordered newest-first.

---

## 2026-05-06 — Email Redesign + Section-Scoped Staff

**Branch:** `claude/staff-contact-database-CVUOP-s2`  
**PR:** #85

### What to check

| Change | File(s) | What to verify |
|---|---|---|
| Section-scoped admin/teacher | `src/hooks/useStudentsQuery.ts`, `src/pages/Students.tsx`, `src/components/attendance/AttendanceForm.tsx` | Admin/teacher with `profiles.section` set only sees matching students; attendance section dropdown hidden and locked for scoped users |
| Attendance email redesign | `supabase/functions/attendance-absence-email/index.ts` (v45) | Per-status color banner renders correctly; `buildAttendanceEmailHtml()` outputs valid HTML; gradient header shows logo |
| Daily progress email redesign | `supabase/functions/daily-progress-email/index.ts` (v55) | Guardian email: gradient header, student name band, Sabaq table, academic table, CTA; Principal email: class sections, top student, report meta, CTA |
| Sr. Salma role | `profiles` DB row | `role = 'teacher'`, `section = 'women'`, `madrassah_id` set |
| Ibrahim Toure role | `profiles` DB row | `role = 'teacher'`, `section = 'Henri-Bourassa'`, `madrassah_id` set |

### DB changes applied to live

```sql
-- Sr. Salma: admin → teacher
UPDATE public.profiles SET role = 'teacher' WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';

-- Ibrahim Toure: admin → teacher
UPDATE public.profiles SET role = 'teacher' WHERE id = '6f605396-a882-4ddc-bdf7-3df137a66501';

-- Section scoping (earlier in same session)
UPDATE public.profiles SET section = 'women' WHERE id = '61d50d06-442b-4269-923f-818d7ae861f7';
-- Ibrahim Toure already had section = 'Henri-Bourassa'
```

---

## v1.2.0 — 5 Features from DUM Application Feedback (2026-04-26)

**Branch:** `claude/amazing-swirles`

### What to check

| Feature | File(s) | What to verify |
|---|---|---|
| Onboarding modal | `src/components/onboarding/OnboardingModal.tsx`, `DashboardLayout.tsx` | Modal fires on first login for each role; doesn't appear again after dismissal; `dum_onboarded_{userId}` key written to localStorage |
| Admin dashboard stats | `src/components/admin/AdminDashboard.tsx` | Welcome banner shows correct greeting based on time of day; Today Absent and Unmarked Today cards show real counts; enrolment chart renders when data exists |
| Health & IEP tab | `src/components/students/StudentHealthIEP.tsx`, `StudentDetail.tsx` | 4th tab exists on student detail; admin can edit and save; allergy alert strip appears when medical_condition is non-empty; IEP toggle persists |
| Staff HRIS directory | `src/components/teachers/StaffHRIS.tsx`, `Teachers.tsx` | "Staff Directory" tab appears on Teachers page; search filters cards in real-time; cards show correct fields |
| Sick attendance | `src/types/attendance.ts`, `supabase.ts`, `status-badge.tsx`, `AttendanceStatusRadioGroup.tsx`, `BulkAttendanceGrid.tsx` | "Sick" option appears in single and bulk attendance forms; status badge renders orange with thermometer icon; DB migration adds enum value |

### DB migrations still pending (must run in Supabase SQL editor)
1. `supabase/migrations/add_sick_attendance_status.sql`
2. `supabase/migrations/add_student_dossier_fields.sql`
3. `supabase/migrations/seed_dum_schedules_v10.sql`

---

## v1.1.5 — Analytics Rebuild, At-Risk Alerting, Security (2026-03-23)

**Branch:** `claude/refactor-analytics-metrics-mPyk2`

### Security Fixes (review carefully)

**localStorage role bypass removed** (`src/pages/Index.tsx`)
- Was: `localStorage.getItem('userRole')` could grant admin access to anyone
- Now: role always resolved from live Supabase session
- Check: `localStorage.setItem('userRole', 'admin')` in DevTools must NOT grant access

**Auth timeout bypass removed** (`src/components/auth/ProtectedRoute.tsx`)
- Was: slow network showed a "Continue with limited access" button
- Now: timeout → redirect to `/auth`
- Check: no "Continue with limited access" button exists anywhere

**PII console logs removed** (multiple files)
- Check: DevTools Console shows zero `console.log` output with user data (emails, IDs, names, roles)

**Dead admin API call removed** (`src/utils/promoteToAdmin.ts`)
- `supabase.auth.admin.updateUserById` must not exist in client-side code

**Explicit column selects** (`Teachers.tsx`, `StudentDetail.tsx`, `ParentAttendance.tsx`, `Parent.tsx`)
- No `.select('*')` on sensitive tables in these files

**Route guards fixed** (`App.tsx`)
- `/create-demo-account`, `/create-teacher-profile`, `/admin-diagnostic` now require admin
- `/add-parent` now requires teacher (not parent)

### Bug Fixes

| Bug | File | Check |
|---|---|---|
| Parent → AccessDenied at /dashboard | `Dashboard.tsx` | Parent lands on /parent |
| Dashboard infinite spinner on error | `Dashboard.tsx` | Error shows retry button |
| NaN% capacity in analytics | `useAnalyticsLive.ts` | Classes show valid percentages |
| Teacher Actions count = 0 | `Activity.tsx` | Non-zero count when data exists |
| Logo link broken for parents | `Sidebar.tsx` | Parent clicking logo goes to /parent |
| Sidebar scroll blocked on desktop | `Sidebar.tsx` | Sidebar scrolls when nav items overflow |

### New Features

- **Analytics dashboard rebuilt** with live data (student KPIs, teacher KPIs, class KPIs, 6 headline metrics)
- **At-risk alerting** — alert banner on teacher dashboard when students have <70% attendance or no progress in 14+ days
- **Notification bell** — sidebar badge showing unread alert count; dismissable; persisted in localStorage 7 days

---

## v1.1.4 and earlier

See `CHANGELOG.md` for full history.

---

## General Review Checklist

Run before approving any PR:

```bash
npx tsc --noEmit   # Must pass with zero errors
npm run lint       # Must pass
```

Check in browser:
- [ ] No `console.log` output with user data in DevTools
- [ ] Correct role lands on correct page after login
- [ ] New features visible and functional for their target role
- [ ] No blank screens or unhandled error states
- [ ] Mobile layout works (use DevTools device mode)
- [ ] Section-scoped users see only their campus's students
- [ ] Attendance section dropdown hidden for scoped users
