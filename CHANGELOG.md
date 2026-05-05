# [1.7.0](https://github.com/Adekunes/Tadween/compare/v1.6.1...v1.7.0) (2026-05-05)


### Features

* redesign teacher messages page layout ([ed8c125](https://github.com/Adekunes/Tadween/commit/ed8c1250ea7cdfc7cf60eea7657c522b71f2edcc))

## [1.6.1](https://github.com/Adekunes/Tadween/compare/v1.6.0...v1.6.1) (2026-05-05)


### Bug Fixes

* improve text contrast and readability on student profile page ([ccf9f1c](https://github.com/Adekunes/Tadween/commit/ccf9f1c98dcd1519aca0477eb99fe0fcde2f0c2f))

# [1.6.0](https://github.com/Adekunes/Tadween/compare/v1.5.0...v1.6.0) (2026-05-05)


### Features

* redesign student profile page with hero header and stat cards ([41a7954](https://github.com/Adekunes/Tadween/commit/41a7954d3aa512e5bf516c523bdb254a873426db))

# [1.5.0](https://github.com/Adekunes/Tadween/compare/v1.4.0...v1.5.0) (2026-05-05)


### Features

* per-student Note/Email/Call buttons + inline notes on attendance list ([e02061a](https://github.com/Adekunes/Tadween/commit/e02061ab67036447b05629abf4c58fe61fc5a846))

# [1.4.0](https://github.com/Adekunes/Tadween/compare/v1.3.1...v1.4.0) (2026-05-05)


### Features

* HubSpot-style student contact popover on attendance list ([15e242d](https://github.com/Adekunes/Tadween/commit/15e242d0d3d0b6a473e047d85525b0f7b7200f93))

## [1.3.1](https://github.com/Adekunes/Tadween/compare/v1.3.0...v1.3.1) (2026-05-05)


### Bug Fixes

* attendance vertical list + email automation fixes ([2020b44](https://github.com/Adekunes/Tadween/commit/2020b44a64235023e2442eac5a5a3d553fa77123))

# [1.3.0](https://github.com/Adekunes/Tadween/compare/v1.2.0...v1.3.0) (2026-05-05)


### Bug Fixes

* TeacherList — location column, null-safe filter, colSpan 6 ([485b81d](https://github.com/Adekunes/Tadween/commit/485b81de1f6b9162b19e9ba3fba642725c1c8e52))


### Features

* secretary feedback -- calendar audience, events on dashboards, teacher location, attendance list ([0baf54f](https://github.com/Adekunes/Tadween/commit/0baf54f1ad5fad819fb6ffdafc7e7efdb1d4b029))

## [2.0.0] (2026-05-03)

### Features

* **calendar-audience:** `school_events.audience` column (`all` | `teachers` | `parents`); `EventDialog` now has an Audience selector (Everyone / Teachers Only / Parents Only) with icon chips; audience badge shown on event cards in the sidebar and upcoming list
* **teacher-dashboard-events:** upcoming school events widget on teacher `DashboardOverview` — queries events with `audience IN ('all','teachers')`, shows next 5 with type icon + date range
* **parent-dashboard-events:** upcoming school events widget on `Parent.tsx` — queries events with `audience IN ('all','parents')`, shows next 5; parents-only events show a ❤️ badge
* **teacher-location:** `profiles.location` column surfaced everywhere — `TeacherDialog` now has a Location / Room input field (persisted on create and update); `TeacherList` desktop table shows a blue pill badge; `TeacherList` mobile cards also show the location badge
* **attendance-vertical-list:** `BulkAttendanceGrid` student selector rewritten from a 3-column card grid to a compact vertical list — row number, avatar, name, alternating row backgrounds, selected rows highlight in blue, ✓ checkmark on right
* **teacher-location-search:** null-safe search filter on `TeacherList` — `(teacher.subject ?? "")` and `(teacher.location ?? "")` prevent runtime crash when fields are null (fixes Sr. Salma not appearing)

### Bug Fixes

* **teacher-list-null-crash:** `teacher.subject.toLowerCase()` threw when `subject` is null; fixed with optional-chaining

---

# [1.2.0](https://github.com/Adekunes/Tadween/compare/v1.1.5...v1.2.0) (2026-04-29)


### Bug Fixes

* add @fullcalendar/core as direct dep + update deno.lock ([9815ed0](https://github.com/Adekunes/Tadween/commit/9815ed0fb222d8bada5fa5a2257d158627d1214a))
* **admin:** fix metric card contrast — use inline styles for white text on green gradient ([28764b5](https://github.com/Adekunes/Tadween/commit/28764b57cdc73349efd62d7f8d841f85293990f3))
* analytics NaN, parent access denied, sidebar scroll, activity feed removal ([10138bb](https://github.com/Adekunes/Tadween/commit/10138bbbe07b2f04c1e9c7e8fcd4b7197e5ae945))
* **ci:** add deno install before deno task build ([c5a28bf](https://github.com/Adekunes/Tadween/commit/c5a28bf3d18083bcd785acc67a0ed9a577aee8a1))
* **ci:** exclude no-import-prefix in Deno 2.x lint on dev/main ([a85cd88](https://github.com/Adekunes/Tadween/commit/a85cd8888fdd1a7ce5b8f0420bc8db00c590cb3b))
* **ci:** exclude no-import-prefix rule in Deno 2.x lint ([0e92e52](https://github.com/Adekunes/Tadween/commit/0e92e529dc880c844223694473f37ee0f664c5dd))
* gate dev routes, fix /add-parent guard, clean ParentAcademics debug code ([fbcf8ca](https://github.com/Adekunes/Tadween/commit/fbcf8ca9fe8c31f441d5d870d575a8f055736bc9))
* import AdminStatCard in Activity.tsx ([9731988](https://github.com/Adekunes/Tadween/commit/97319889d1e64f2f693264daf19500742a5828c4))
* major UI cleanup — remove floating buttons, clean icon squares, fix data bugs ([dac468d](https://github.com/Adekunes/Tadween/commit/dac468d5b6c86a58d615435e09234183449b82d9))
* make Deno lint and format pass in CI ([87aee1f](https://github.com/Adekunes/Tadween/commit/87aee1fdcf5020d3840344ad55fcccc987009d5d))
* regenerate deno.lock — stale esm.sh hash for realtime-js ([0cb29c9](https://github.com/Adekunes/Tadween/commit/0cb29c9cd109be44420e1883b1d90f46ddd42095))
* remove PII console logs, add Dashboard error state, remove redundant ProtectedRoute wrappers ([3813a53](https://github.com/Adekunes/Tadween/commit/3813a53e885f093c6863bd4aadefcdfcc7fa448d))
* replace shadcn TabsTrigger with custom pill buttons on Attendance page ([b28b3b3](https://github.com/Adekunes/Tadween/commit/b28b3b3339a828e7e566bdc3f4a5976f12d7daaa))
* resolve all CI pipeline failures ([5a59a25](https://github.com/Adekunes/Tadween/commit/5a59a2527bd5cab4df6e2c43dc5c115e88a4a012))
* resolve CI failures -- deno fmt + missing use-toast re-export ([1d7fb33](https://github.com/Adekunes/Tadween/commit/1d7fb33c42d42b59cca98eae63231e1385a16922))
* resolve dark UI across all admin pages by switching to light theme ([e8a7f54](https://github.com/Adekunes/Tadween/commit/e8a7f548d9c2adc27193427dacd952d359a5fe63))
* resolve post-merge issues on dev ([e304fee](https://github.com/Adekunes/Tadween/commit/e304fee69ee219131227b7c57c6f4f3da49a144e))
* UI cleanup, real data, dead code removal, and documentation ([3251f11](https://github.com/Adekunes/Tadween/commit/3251f1196184e136aa6b68357629cea5c817d255))
* UI polish — parent empty state, progress book icon, recent activity separator ([24572d7](https://github.com/Adekunes/Tadween/commit/24572d7121ca31f32f95279dd9e817877faaafd2))
* ui/ux polish — admin mobile layout, empty states, loading consistency, nav icons and i18n ([656258e](https://github.com/Adekunes/Tadween/commit/656258eefe3f5b7f56bad54a65a173082aa1aa64))
* update CI to use Node.js for frontend, Deno 2.x for edge functions only ([94766ef](https://github.com/Adekunes/Tadween/commit/94766ef037ada74ad9bc738f7796494b98a2eda7))
* use Deno for frontend CI instead of Node/npm ([837c816](https://github.com/Adekunes/Tadween/commit/837c8161180e5f6c998abfcc8c34fd134a9d1513))
* wire onClick handlers to Profile/Settings in expanded sidebar user dropdown ([3892fcd](https://github.com/Adekunes/Tadween/commit/3892fcdf08754a3e517914831a1db76693e4d6ea))


### Features

* 6 new features -- notifications, task list, announcements, absence requests, teacher portal overhaul ([97dc124](https://github.com/Adekunes/Tadween/commit/97dc124c668c5cd48db55877df1bdcc7c755872d))
* 6 new features — contact pop-up, CSV export, unexcused warnings, late alerts, school calendar, assignment notifications ([1e17dbd](https://github.com/Adekunes/Tadween/commit/1e17dbdcdaae76b0e5ded073495788e7e9462437))
* add in-app notification system with bell in sidebar ([2774786](https://github.com/Adekunes/Tadween/commit/2774786f9039ccacaffe51af42e53a913911be4a))
* admin proxy impersonation + nav cleanup ([06e8a08](https://github.com/Adekunes/Tadween/commit/06e8a08a481bfb200ab0b5a204e087ddf188ee01))
* **admin:** Donezo-style admin dashboard ([5cc7838](https://github.com/Adekunes/Tadween/commit/5cc7838a9913c6a36a0b5464f0d7089a023afcad)), closes [#f5f6fa](https://github.com/Adekunes/Tadween/issues/f5f6fa)
* **design:** apply Donezo design system to all admin views ([7ad5bb7](https://github.com/Adekunes/Tadween/commit/7ad5bb7879c5c37453d7a643c8c6e1a6b354680b)), closes [#f5f6fa](https://github.com/Adekunes/Tadween/issues/f5f6fa) [#f5f6fa](https://github.com/Adekunes/Tadween/issues/f5f6fa)
* full luxury overhaul of teacher portal ([a7e5374](https://github.com/Adekunes/Tadween/commit/a7e5374330743bd246fa3592325da299c8b62abb))
* full luxury UI redesign — sidebar, dashboard, tables, page headers ([3ba2a2c](https://github.com/Adekunes/Tadween/commit/3ba2a2cb3176a6116ef6e59ad9111f7d92514949))
* implement 5 features from DUM Application Feedback spec ([02db29f](https://github.com/Adekunes/Tadween/commit/02db29f977735eaa621e4164db03315e0d308517))
* merge claude/amazing-swirles — full UI redesign + CI/Deno fix ([13d8e51](https://github.com/Adekunes/Tadween/commit/13d8e516493d1f9da0670f4acb4e337a58e937d6))
* profile page, error boundary, login redesign, useRBAC channel fix ([7118073](https://github.com/Adekunes/Tadween/commit/71180735e14f6f8a4ce6243c15d38f3967c541d9))
* redesign attendance, add daily prompts, remove analytics dashboard ([ba01c6d](https://github.com/Adekunes/Tadween/commit/ba01c6db74036e5297289c3682cb3bcdfffcb888))
* seed full class schedules from Scheduling V10 PDF ([5cfc56e](https://github.com/Adekunes/Tadween/commit/5cfc56ebc52f92002c138702fb5a0032d362c36e))
* sortable column headers on Students, Teachers, and Parent Accounts ([865a1e3](https://github.com/Adekunes/Tadween/commit/865a1e34b37fb8acef20d098c1e47c7b41d5b635))
* structured absence reasons + multi-day absence modal ([b26aec0](https://github.com/Adekunes/Tadween/commit/b26aec01eb3e3c32987a70fb00847000f782525a))
* student dossier tab + DB migration for extended student fields ([a49a6bc](https://github.com/Adekunes/Tadween/commit/a49a6bc7633821082be22008127b92c11dff187f))
* **teacher:** live per-student metrics and at-risk alerting ([0878063](https://github.com/Adekunes/Tadween/commit/08780639558b1c51ab2db36c48f23422231c46ee))

---

## [1.9.0] (2026-04-28)

### Deployment
* **edge-functions:** deployed all 4 new edge functions to live Supabase project (`depsfpodwaprzxffdcks`) — all ACTIVE
  - `send-assignment-graded` (v1)
  - `send-assignment-overdue` (v1)
  - `send-enrollment-confirmation` (v1)
  - `send-class-announcement` (v1)
* **pg_cron:** scheduled `send-assignment-overdue` to run daily at 08:00 UTC (cron schedule id 34) — `0 8 * * *`

---

## [1.8.0] (2026-04-28)

### New Features

* **notifications:** `send-assignment-graded` edge function -- fires when teacher marks an assignment graded; emails all linked parents with student name, assignment title, and link to parent portal
* **notifications:** `send-assignment-overdue` edge function -- daily pg_cron job; queries all past-due ungraded assignments and emails parents; soft de-duplicates via `notifications` table
* **notifications:** `send-enrollment-confirmation` edge function -- fires on new student creation; emails all admin accounts with student name, section, guardian info, and enrollment date
* **notifications:** wired enrollment confirmation into `StudentDialog.tsx` and graded notification into `TeacherAssignments.tsx` (both fire-and-forget)
* **students:** status filter pill buttons on Students page -- All / Active / Inactive / Vacation / Hospitalized / Suspended / Graduated; stacks with existing search and section filters
* **tasks:** `teacher_tasks` table + RLS (admins see all; teachers see/update own); `TaskManager` admin component (grouped by teacher, inline create form, priority/status badges, delete/complete actions); `TaskWidget` teacher component (pending tasks with priority dots, overdue highlighting, mark-done); admin `/tasks` route + nav item
* **announcements:** `announcements` table + RLS; `send-class-announcement` edge function (resolves class students -> parents -> Resend emails, updates `sent_to_count`); `AnnouncementComposer` teacher component (class selector, compose form, sent history); new Announcements tab in teacher portal
* **absence-requests:** `absence_requests` table + RLS; `AbsenceRequestForm` teacher component (date range, reason, notes, history with status badges); `AbsenceRequestsPanel` admin component (filter by status, approve/reject with inline admin note, full table); admin `/absence-requests` route + nav item; new My Absences tab in teacher portal
* **teacher-portal:** full luxury overhaul -- `DashboardHeader` replaced with green gradient banner (greeting, live student/absent/class chips); `TeacherTabs` converted to pill buttons; `DashboardOverview` gains 4 tinted stat cards (My Students, Today Absent, Assignments Pending, Progress Today); `QuickActions` gets section accent header and green hover treatment

### Database Migrations
* `20260428120000_create_teacher_tasks.sql`
* `20260428120001_create_announcements.sql`
* `20260428130000_create_absence_requests.sql`

---

## [1.7.0] (2026-04-28)

### New Features

* **tables:** sortable column headers on Students, Teachers, and Parent Accounts — click any sortable header to toggle asc/desc; active column turns green with ↑/↓ arrow, inactive columns show neutral ⇅
* **students:** sortable by Name (A→Z), Section (A→Z), Status (severity order: active→inactive), Enrollment Date (chronological)
* **teachers:** sortable by Name, Subject, Students count
* **parent-accounts:** sort toggle (Name / Children count) above the parent list in the Manage tab

### Bug Fixes

* **tabs:** replaced `shadcn TabsTrigger` with custom pill buttons on Attendance page — `data-[state=active]` CSS from the Radix base component was leaking a blue underline regardless of overrides; all tabs now use a consistent `bg-green-700 text-white` pill for active state
* **tabs:** same pill treatment applied to Parent Accounts page tabs (Create / Link / Manage)
* **sidebar-user:** wired `onClick(() => navigate(...))` to Profile and Settings items in the expanded dropdown — the collapsed state had handlers but the expanded (desktop) state was missing them

---

## [1.6.0] (2026-04-27)

### New Features

* **proxy:** admin "View As" impersonation — admin can browse the entire app as any teacher or parent without changing the Supabase auth session; JWT stays admin-level so full RLS access is preserved; proxied role overrides `useRBAC` returns (`isAdmin/isTeacher/isParent/teacherId`); amber banner persists at top of layout with "Viewing as [Name] (Role) — Exit" button; eye icon on every teacher row and parent account row; navigates to the appropriate dashboard on proxy start
* **proxy:** `ProxyContext.tsx` — `ProxyProvider` + `useProxy` hook with `startProxy(userId, role, name, email)` and `exitProxy()` actions; wired into `App.tsx`, `useRBAC.ts`, and `DashboardLayout.tsx`

### Navigation Cleanup

* **admin nav:** removed `Profile` and `Settings` from sidebar nav (both now reachable via user dropdown at bottom); grouped remaining 11 items into sections: People (Students, Teachers, Classes), Operations (Progress Book, Attendance, Calendar, Teacher Schedules), Admin (Parent Accounts, Bulk Import, Activity Feed)
* **teacher nav:** removed `My Students` (redundant tab in Dashboard), `Profile`, and `Preferences` from nav; grouped 7 remaining items into sections: Daily (Attendance, Progress Book, Assignments), Communication (Messages, Schedule, Calendar)
* **parent nav:** removed `Add Parent` and `Profile` from nav; trimmed to 5 essential items
* **SidebarNav:** renders `section` labels as `text-[10px] uppercase tracking-widest text-gray-400` dividers; unread message badge now shows count (`9+` cap) instead of a dot
* **SidebarUser dropdown:** Profile and Settings menu items now navigate correctly (`/profile`, `/settings` for admin, `/preferences` for teacher)
* **NavItem type:** added optional `section?: string` field

---

## [1.5.0] (2026-04-27)

### UI Redesign — Luxury Pass

* **sidebar:** removed cheap left-border active indicator; replaced with full `bg-green-50` pill + `shadow-sm`; avatar upgraded to `bg-[#052e16] text-white` (dark brand green); header now shows "Dār Al-Ulūm" wordmark with small-caps role sub-label ("ADMIN" / "TEACHER PORTAL"); role chip added below email in expanded user section
* **dashboard:** `MetricCard` default variant redesigned — tinted card backgrounds by semantic type (`bg-green-50/60`, `bg-red-50/60`, `bg-amber-50/60`); icon in `w-10 h-10 rounded-xl` container; KPI numbers bumped to `text-4xl font-black tracking-tight`; labels to `text-xs font-semibold uppercase tracking-widest text-gray-400`; section headers given `border-l-2 border-green-600 pl-3` accent; mini stat row numbers to `text-3xl font-black`; removed badge/subLabel duplication on attendance metric cards
* **students:** icon+title page header strip; colored avatar circles by initial range (8 color bands); table headers uppercase; row hover `bg-green-50/30`; action column uses icon button; removed emoji hint bar
* **teachers:** same page header strip; table redesigned with uppercase headers, row hover, icon action buttons (pencil/trash); fixed pre-existing 5-header/6-cell column mismatch
* **classes:** same page header strip; `ClassTable` actions converted to icon buttons (pencil, users, trash2) with appropriate hover colors
* **AdminPageShell:** page header refactored to full-width `bg-white border-b` strip with colored icon container; `AdminPrimaryBtn` uses gradient inline style to defeat `.admin-theme` CSS override
* **schedule calendar:** custom toolbar with green pill active view button, `bg-gray-50` nav group, Google Calendar link; `headerToolbar={false}`; CSS overrides for lighter grid, green today column, now-indicator

---

## [1.4.1] (2026-04-27)

### Bug Fixes

* **ui:** fix all green banner text rendering dark — `.admin-theme h1` and `.teacher-theme h1/p/span/div` CSS rules have higher specificity (0,1,1) than Tailwind utility classes (0,1,0), silently overriding `text-white` / `text-green-200`; fixed by replacing those classes with `style={{ color: "white" }}` / `style={{ color: "#bbf7d0" }}` on all text, icons, and buttons inside green gradient banners across `AdminDashboard.tsx`, `Attendance.tsx`, `SchoolCalendar.tsx`, and `TeacherSchedule.tsx`

---

## [1.4.0] (2026-04-27)

### New Features

* **attendance:** student contact info pop-up — clicking an absent/late/sick student's name in the Watchlist or Records tab opens a popover with guardian name, phone, and email (click-to-call / click-to-email); `StudentContactPopover` component queries on demand
* **attendance:** CSV export — "Export CSV" button in the Records tab header downloads the currently filtered records (date, time, student, class, status, reason, notes)
* **attendance:** unexcused absence warnings panel — orange alert banner at top of Watchlist tab when any students have absences with no reason filed; each row also shows an "N unexcused" chip
* **attendance:** late arrivals alert panel — amber card appears on the Attendance page header when any students are marked late today, listing names with click-to-contact popovers
* **attendance:** `send-late-arrival-alert` edge function — notifies admin emails when a student is marked late (POST `{ student_id, attendance_id, date, time }`)
* **calendar:** new School Calendar page (`/calendar`) — monthly grid + upcoming sidebar, supports event types: Holiday, Break, PD Day, Exam, Event; admin CRUD; `school_events` table with RLS seeded with 2025–26 dates
* **assignments:** `send-assignment-notification` edge function — fires on assignment creation, emails all linked parents with assignment title, description, due date, and a link to the parent portal
* **navigation:** School Calendar added to admin and teacher sidebars; `nav.calendar` translation key added (EN + FR)

### Database

* **migration:** `create_school_events.sql` — `school_events` table (UUID PK, title, event_type enum, start/end date, color, RLS) with starter seed data for 2025–26

---

## [1.3.0] (2026-04-26)

### Removed
* **analytics:** removed entire analytics dashboard — deleted 11 components, 6 hooks, 6 service files, types, page, and `NotificationBell`. `EmptyState` preserved as shared component.
* **analytics:** removed `TeacherAnalytics` and `TeacherStudentInsights` from teacher portal; removed `performance` tab from teacher dashboard

### New Features
* **attendance:** full page redesign — green gradient welcome banner (matching admin dashboard), 4 stat cards, live progress bar, and four tabs: Roll Call, **Watchlist** (students with 2+ absences in 30 days with streak badges), **Heatmap** (30-day school-wide attendance rate grid, color-coded), Records
* **daily-prompt:** `DailyPromptModal` fires once per calendar day per account on first app open; role-aware (Admin, Teacher, Parent) with 4 actionable checklist items; respects Settings → Page Assistance toggle
* **settings:** added Page Assistance toggle to Settings → User Experience; controls whether the daily prompt fires

### Bug Fixes
* **admin-dashboard:** removed broken `useAnalyticsSummary` import; attendance rate now derived directly from existing daily queries
* **teacher-dashboard:** removed broken `TeacherAnalytics` import and stale `performance` tab case
* **dashboard-overview:** fixed broken `/dashboard?tab=performance` link → `/attendance`
* **activity:** fixed broken `/analytics` navigate → `/attendance`
* **onboarding:** updated admin step 4 from deleted "Analytics dashboard" to "Attendance & Reports"

---

## [1.2.0] (2026-04-26)

### New Features

* **onboarding:** role-specific 5-step onboarding modal fires on first login for Admin, Teacher, and Parent; persisted via localStorage `dum_onboarded_{userId}`
* **admin-dashboard:** personalized welcome banner with time-based greeting and live date
* **admin-dashboard:** Today Absent card — counts absent/excused/sick students for today
* **admin-dashboard:** Unmarked Today card — total active students minus marked today
* **admin-dashboard:** Enrolment by Location/Grade breakdown with bar chart
* **admin-dashboard:** Staff / Classes / Attendance Rate mini-summary row
* **health-iep:** new Health & IEP tab on student detail pages; inline-editable health card number, medical condition, allergies, health notes, IEP toggle, and accommodations textarea
* **staff-hris:** Staff Directory tab on Teachers page — searchable staff cards with role badge, subject/grade chips, bio preview, email and phone links
* **attendance:** added "Sick" status (with thermometer icon) to single-attendance radio group, bulk attendance select, status badge component, and Postgres `attendance_status` enum
* **schedules:** `seed_dum_schedules_v10.sql` — idempotent PL/pgSQL migration seeding all 12 class schedules (KG → Secondary 1 & 3) from Scheduling V10 PDF

---

## [1.1.5](https://github.com/codeblock102/addin-darululum/compare/v1.1.4...v1.1.5) (2026-03-21)


### Bug Fixes

* **analytics:** classes tab showed raw UUIDs for Enrolled/Capacity — fixed by converting `current_students` array to `.length`
* **analytics:** classes tab showed NaN% for Avg Capacity Used — fixed by same array-to-number conversion
* **analytics:** classes tab attendance showed "No records" for all classes — added fallback to filter by student membership when `class_id` is unset
* **analytics:** teachers tab student counts were all zeros — fixed by deriving teacher→student relationships from `classes.teacher_ids` + `current_students` instead of broken `students_teachers` name-matching
* **activity-feed:** "Teacher Actions" count was always 0 — fixed by counting all progress, attendance, and assignments entries
* **activity-feed:** "Top Performers" was always empty — fixed by lowering threshold from 90%/4.0 to 75%/3.5
* **parent-portal:** clicking the logo showed "Access Denied" — fixed logo link to navigate to `/parent` for parent role
* **parent-portal:** parents without a profile record were not redirected correctly — fixed redirect target to `/parent`
* **admin-sidebar:** desktop scrolling was broken due to `overflow-y` hardcoded to `hidden` — fixed to `auto`


### UI Changes

* **admin-sidebar:** removed Activity Feed from navigation
* **teacher-schedule:** added info banner and "Open Google Calendar" link
* **parent-portal:** full redesign of Dashboard, Progress, Attendance, Academics, and Messages pages with cleaner layouts, stat cards, color-coded badges, and chat-bubble message threads


## [1.1.4](https://github.com/codeblock102/addin-darululum/compare/v1.1.3...v1.1.4) (2026-03-11)


### Bug Fixes

* add admin RLS policies so Activity/Insights page works for admins ([2bfc1af](https://github.com/codeblock102/addin-darululum/commit/2bfc1afbf68ec486148cc356187868356db99ff7))

# 1.0.0 (2025-10-28)


### Bug Fixes

* **ci:** update node version and permissions for release ([2c5592b](https://github.com/codeblock102/addin-darululum/commit/2c5592b853be8c251c0803b1ef8c4e4a8c9c93e5))


### Features

* Add all project files ([a82c205](https://github.com/codeblock102/addin-darululum/commit/a82c205591046e3f0e1c9c881ecabee19c3eec91))
* Add attendance link and enable quick actions ([caa212d](https://github.com/codeblock102/addin-darululum/commit/caa212da6ee6297fa8e87d874165834757323d80))
* Add bulk attendance feature ([aed7a17](https://github.com/codeblock102/addin-darululum/commit/aed7a17194a2d78eb4858269d72e7aaf294412b9))
* Add class form ([f521861](https://github.com/codeblock102/addin-darululum/commit/f52186105a6953cd6ef84aa01ebc896c75cd6284))
* Add settings page access for admin ([e1e0a64](https://github.com/codeblock102/addin-darululum/commit/e1e0a649979e1d71ac6edee27cfe63ed00e2785e))
* Add student deletion functionality ([8287896](https://github.com/codeblock102/addin-darululum/commit/82878961f3fc09e621d24217ecd7c781e85b6bd2))
* Add student progress view ([3c94de1](https://github.com/codeblock102/addin-darululum/commit/3c94de1f02440608d0c802300d83c40c378d6f3b))
* Add student search bar ([85a11f1](https://github.com/codeblock102/addin-darululum/commit/85a11f1c96346701c1f4623b855c988b67a396bd))
* Add tabs for daily and classroom records ([16936bd](https://github.com/codeblock102/addin-darululum/commit/16936bdaf2fd4720bf7de3e53d4fef78b8f0a56e))
* Add tabs to Dhor Book entry form ([0c822b4](https://github.com/codeblock102/addin-darululum/commit/0c822b4b081e72c429591fe492fa17d52a9fe538))
* Add teacher management page ([0731de7](https://github.com/codeblock102/addin-darululum/commit/0731de79905ec5c776e7036b1f143e1b77a1efdb))
* Add teacher preferences page ([8f04840](https://github.com/codeblock102/addin-darululum/commit/8f048401c242a4b84cf115e9acd7870c1c428b13))
* Allow teachers to add students ([a50d7c0](https://github.com/codeblock102/addin-darululum/commit/a50d7c0495d0541469b93eae515064dad991448b))
* Allow teachers to delete students ([9169373](https://github.com/codeblock102/addin-darululum/commit/91693731f4c7dd16b0558cf60852a30d091e613c))
* **attendance:** add cutoff settings and absence notification system; cron job; edge function and admin UI ([5cc2d74](https://github.com/codeblock102/addin-darululum/commit/5cc2d74b543528126c21c000683e9162a80e3fa7))
* **attendance:** show cutoff settings to all roles; restrict editing to admins ([02a27be](https://github.com/codeblock102/addin-darululum/commit/02a27beace3bda6a23ce5a1e50d0dfb5fabb1629))
* **attendance:** surface cutoff settings above tabs and show current cutoff summary ([4d10143](https://github.com/codeblock102/addin-darululum/commit/4d10143cf7e4df51e50f7089ec700719d8ea00d0))
* Create teacher role on user creation ([e7342fa](https://github.com/codeblock102/addin-darululum/commit/e7342faf26cf8041c515adaea99c695e1149dbb0))
* Implement admin dashboard ([2f09d55](https://github.com/codeblock102/addin-darululum/commit/2f09d555f5b191b81fe066e63fa7b03baec449a9))
* Implement Dhor book features ([aad07ec](https://github.com/codeblock102/addin-darululum/commit/aad07ec8c8a36ffee2630f2dc073f351e868aedd))
* Implement Dhor Book System ([d72ea20](https://github.com/codeblock102/addin-darululum/commit/d72ea20331b2bd6fba07b09d4b1578a27c35d28d))
* Implement distinct admin UI design ([50f809a](https://github.com/codeblock102/addin-darululum/commit/50f809a17765959e712895526cf64d4a485eeff4))
* Implement dynamic surah and ayat selection ([85185ea](https://github.com/codeblock102/addin-darululum/commit/85185eabacdab5af8357a0fad0404b019693243c))
* Implement leaderboard enhancements ([cae19ef](https://github.com/codeblock102/addin-darululum/commit/cae19ef19b570b130d3dc9e9f3ff47785dae15d5))
* Implement leaderboard feature ([323c218](https://github.com/codeblock102/addin-darululum/commit/323c218851c878d3967b9d13f9d5885545f83d83))
* Implement messaging features ([23d3b91](https://github.com/codeblock102/addin-darululum/commit/23d3b912ab30101f2d43b2cf25593a7a4c0f3caf))
* Implement messaging system ([ec7de9f](https://github.com/codeblock102/addin-darululum/commit/ec7de9f72cbe9f82d87db31bac73d9fe08b6027f))
* Implement mobile-first enhancements ([d0b2ca0](https://github.com/codeblock102/addin-darululum/commit/d0b2ca0f0df454fe1c2096e2e23a704f785547e1))
* Implement Teacher Account Control Center ([5d69c72](https://github.com/codeblock102/addin-darululum/commit/5d69c728cbcefe272eeda268bf1d9b81a0f172fd))
* Make Classroom Records visible to admins ([d01a6bf](https://github.com/codeblock102/addin-darululum/commit/d01a6bff33704ea3b9f6c96d9943e83080e88493))
* Mirror admin student add for teachers ([31ffaa3](https://github.com/codeblock102/addin-darululum/commit/31ffaa3a3e44026425e5878ae99053c7db092ee0))
* Style and remove sidebar button ([137be33](https://github.com/codeblock102/addin-darululum/commit/137be331a6a14d247cc05665426b06aeeb7e0f14))
* Update teacher student enrollment form ([f35cebd](https://github.com/codeblock102/addin-darululum/commit/f35cebd1cf6059b5b861c75fe08990abf21ca800))
