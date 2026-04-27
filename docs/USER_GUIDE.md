# Dār Al-Ulūm Montréal — User Guide

## Overview

The Dār Al-Ulūm Management System is a web-based platform for managing day-to-day madrassah activities: student records, Qur'an progress, attendance, class scheduling, and parent–teacher communication.

Three roles exist:

| Role | Who it's for |
|---|---|
| **Admin** | Madrassah administrators — full access to all features, reporting, and system configuration |
| **Teacher** | Teachers — manage students, record attendance, track Qur'an progress, message parents |
| **Parent** | Parents/guardians — read-only view of their child's progress and attendance |

---

## Getting Started

### Logging In
1. Go to the app URL and click **Sign In**.
2. Enter your email and password.
3. You'll be redirected to the dashboard for your role.

### First Login — Onboarding Walkthrough
On your very first login a guided walkthrough will appear automatically. It's a 5-step modal tailored to your role (Admin, Teacher, or Parent) that explains the key features. You can skip it or go through it at any time.

To see it again: clear `dum_onboarded_<your-user-id>` from your browser's local storage and refresh.

### Daily Prompt
After your first login, a **daily checklist modal** appears once each calendar day when you open the app. It shows 4 actionable tasks relevant to your role:
- **Teachers**: take attendance, log progress, check messages, review assignments
- **Admins**: check today's attendance, review the absence watchlist, check the activity feed, pending admin tasks
- **Parents**: check child's progress, attendance, messages, assignments

To disable it: go to **Settings → User Experience → Page Assistance** and toggle it off.
To reset it for the current day: clear `dum_daily_<user-id>_<YYYY-MM-DD>` from local storage.

### Forgot Your Password?
Click **Forgot password?** on the login page. Enter your email and follow the link sent to your inbox.

---

## Admin Guide

### Dashboard (`/dashboard`)

Your dashboard shows:
- **Personalized welcome banner** with a time-based greeting and today's date
- **4 stat cards**: Total Students, Today Present, Today Absent, Unmarked Today
- **Enrolment by Location / Grade** — bar chart breakdown of active students per section/grade
- **Staff / Classes / Attendance Rate** — three quick-reference mini-cards

### Students (`/students`)

- Browse and search the full student list; filter by status (active, inactive)
- Click any student to open their detail page with four tabs:
  - **Profile** — demographics, guardian contacts, current Juz
  - **Dossier** — Mozaïk-style identity card (language, program, contacts, resource person)
  - **Health & IEP** — health card number, medical conditions, allergies, IEP toggle and accommodations
  - **Progress** — attendance history and Qur'an progress entries

#### Health & IEP Tab (Admin)
Admins can edit all health fields inline — click the pencil icon, make changes, then save. A red alert strip appears automatically when a medical condition is on file.

### Teachers (`/teachers`)

Two tabs:
1. **Teacher List** — view all teacher accounts with per-teacher stats
2. **Staff Directory** — searchable HRIS cards for all staff (teachers, admins, secretaries). Each card shows role badge, subject/grade chips, bio, email, and phone.

### Classes (`/classes`)

- View all classes with schedule, teacher, capacity, and status
- Create or edit classes; the `time_slots` field stores the full weekly schedule in structured JSONB

### School Calendar (`/calendar`)

Monthly calendar grid showing school events, holidays, PD days, exams, and custom events.
- **Admins** can create, edit, and delete events via the **Add Event** button
- **Teachers and parents** can view all events (read-only)
- Click any day to see events scheduled for that date
- Upcoming events (next 60 days) listed in the right sidebar

### Attendance (`/attendance`)

Three modes:
- **Take Attendance** — select class/date, mark individual students with: Present, Absent, Late, Excused, Early Departure, or **Sick**
- **Bulk Attendance** — select multiple students, choose a status, and apply in one click
- **Multi-day Absence** — date-range dialog that creates one excused record per weekday in the range
- **Records** — search and filter all past attendance entries

**Absence reasons** (Mozaïk-style categories): Activities, Legal, Family, Health, Other — shown for absent/excused/late statuses.

**Contact pop-up:** In the Watchlist and Records tabs, clicking an absent/late/sick student's name opens a popover with the guardian name, phone (click-to-call), and email (click-to-email).

**Unexcused warning:** The Watchlist tab shows an orange alert when students have absences filed with no reason. Each student row also shows an "N unexcused" chip.

**Late arrivals panel:** When any students are marked late today, an amber alert card appears above the tab strip listing their names with click-to-contact.

**Export CSV:** The Records tab header has an "Export CSV" button that downloads the currently filtered records.

### Progress Book (`/progress-book`)

Record each student's daily Qur'an lesson:
- Lesson type: **Hifz** (memorisation), **Nazirah** (reading), or **Qaida** (beginner)
- Current Surah and Juz, start/end Ayat
- Sabaq Para (recent revision)
- Quality rating (Excellent → Needs Improvement)
- Teacher notes

View modes: Daily, Classroom (all students), Monthly calendar.

### Schedule (`/teacher-schedule`)

View the combined weekly timetable for all teachers. Schedules are seeded from the Scheduling V10 PDF — run `seed_dum_schedules_v10.sql` in the Supabase SQL editor first.

### Admin Panel Pages

| Page | Purpose |
|---|---|
| `/admin/parent-accounts` | Create parent accounts and link to students |
| `/admin/bulk-student-import` | Import students from CSV |
| `/admin/teacher-schedules` | Combined timetable view |
| `/admin/manual-role-setup` | Assign role to any account by email |
| `/settings` | System settings (appearance, email, notifications) |

### Profile (`/profile`)

Edit your own name, phone, bio, and change your password.

---

## Teacher Guide

### Dashboard

Shows:
- Summary cards: total students, today's attendance, recent activity
- Quick links to take attendance and record progress
- Alert banner if any students are at risk (attendance <70% or no progress in 14+ days)

### Recording Progress

1. Go to **Progress Book** → **New Entry**
2. Select the student and date
3. Fill in lesson type, Surah/Juz/Ayat, quality, and notes
4. Save — the entry appears in the classroom view and parent portal immediately

### Taking Attendance

1. Go to **Attendance** → **Take Attendance**
2. Select the class and date
3. Mark each student: Present, Absent, Late, Excused, Early Departure, or **Sick**
4. For absent/late/excused students, select an absence reason from the dropdown
5. Submit

For long absences, use the **Multi-day Absence** button in the header.

### Schedule

Your weekly timetable is at `/teacher-schedule`. Tap **Open Google Calendar** to export your schedule.

### Messages

- **Compose** — select a parent, write a message, send
- **Inbox** — real-time; new messages appear without refresh and trigger a toast
- **Sent** — review sent messages

### Add Parent

Use the **Add Parent** page or the link on a student's profile. Enter the parent's email, select the student(s) to link, and the system sends an invitation.

---

## Parent Guide

Parents see only their linked child's data. Contact the madrassah office if your child is not linked.

### Dashboard (`/parent`)

- **Attendance rate** — percentage of sessions attended
- **Qur'an position** — last recorded Surah and Juz
- **Pending work** — ungraded assignments
- **Recent progress** — last few Dhor Book entries

Use the **child selector** at the top to switch between children (if you have more than one linked).

### Progress (`/parent/progress`)

Full Dhor Book in read-only mode — lesson type, Surah, Juz, verses, quality rating, and teacher notes for each session.

### Attendance (`/parent/attendance`)

Summary bar (rate, present/absent counts) and full session history with colour-coded badges.

### Academics (`/parent/academics`)

Assignments tab: title, due date, status (Assigned / Submitted / Graded), grade, teacher feedback, and file attachments (preview or download PDFs and images inline).

### Messages (`/parent/messages`)

Chat-bubble interface. Your messages appear on the right; teacher messages on the left. Use the teacher dropdown to filter by teacher.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank screen or "Access Denied" after login | Your role may not be set. Ask an admin to check via Manual Role Setup |
| Child's data not visible (parent) | Your account is not linked to the student. Contact the madrassah office |
| Attendance not updating | Check the correct date is selected; attendance cutoff may be in effect |
| Progress Book entries not saving | All required fields (lesson type, Surah, Juz, start Ayat) must be filled |
| Daily emails not arriving | See `docs/EMAIL_SCHEDULING_SETUP.md` — verify cron, Resend API key, and guardian email |
| Schedule page is empty | Run `seed_dum_schedules_v10.sql` in Supabase SQL editor |
| Can't log in | Use Forgot Password on the login page; contact admin if it persists |
