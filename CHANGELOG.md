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
