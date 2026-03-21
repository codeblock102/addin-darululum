# Dār Al-Ulūm Madrassah Management System — User Guide

## Overview

The Dār Al-Ulūm Madrassah Management System is a web-based platform that helps teachers, administrators, and parents manage day-to-day madrassah activities. It covers student records, Qur'an progress tracking, attendance, class scheduling, assignments, and parent–teacher communication.

The system has three user roles:

| Role | Who it is for |
|------|---------------|
| **Admin** | Madrassah administrators — full access to all features plus reporting and system configuration |
| **Teacher** | Teachers — manage their students, record attendance, track Qur'an progress, and message parents |
| **Parent** | Parents/guardians — read-only view of their child's progress, attendance, and assignments |

---

## Getting Started

### Logging In

1. Go to `/auth` in your browser.
2. Enter your **email address** and **password**.
3. Click **Sign In**.

After a successful login the system redirects you to the page that matches your role (Dashboard for teachers and admins, Parent Dashboard for parents).

### Forgot Your Password?

Click the **Reset password** link on the login page. Enter your email address and follow the instructions sent to your inbox.

### Your Role Determines What You See

- **Admins** land on the main Dashboard and can also access the Admin Panel (`/admin`).
- **Teachers** land on their Teacher Dashboard.
- **Parents** land on the Parent Dashboard.

If you see an "Access Denied" or blank screen, contact your administrator — your account may not have the correct role assigned yet.

---

## Teacher Guide

### Dashboard

The Teacher Dashboard is your home screen. It shows:

- A summary of your students (total, active, new enrolments).
- Recent attendance figures.
- Quick links to take attendance and record progress.
- A messages badge showing unread messages from parents.

Admins viewing the Dashboard also see an **Analytics** tab and a **Messages** tab alongside the overview.

### Students

Navigate to **Students** from the sidebar.

- **View students** — browse or search your student list by name. Filter by status (Active, Inactive, Vacation, etc.).
- **Student details** — click a student row to see their profile: date of birth, guardian contact, address, health information, current Juz, and completed Juz.
- **Add a student** — click the **+ Add Student** button and fill in the form. Required fields include name and status.
- **Edit a student** — click the edit icon on any student row to update their details.

### Classes

Navigate to **Classes** from the sidebar.

- See all classes with their subject, section, assigned teachers, capacity, scheduled days, and time slots.
- **Add a class** — click **+ New Class** and fill in the name, subject, days of week, and time.
- **Enrol students** — use the Enrollment option on a class to add or remove students.
- **Delete a class** — use the delete option on any class row (confirmation required).

### Attendance

Navigate to **Attendance** from the sidebar.

The Attendance page shows summary cards for:

- Total active students
- How many students are marked today
- Attendance rate for the last 7 days

**Taking attendance**

1. Select the **Take Attendance** tab.
2. Choose the class and date.
3. Mark each student as **Present**, **Absent**, or **Late**.
4. Submit when done.

**Viewing attendance records**

Switch to the **Records** tab to search and filter past attendance entries. Admins can also configure attendance cutoff settings from this page.

### Progress Book (Dhor Book)

Navigate to **Progress Book** from the sidebar. This is where you record each student's daily Qur'an lesson.

**View modes:**

- **Daily** — record or review a single student's entry for today. Select the student from the list, then enter:
  - Lesson type: Hifz (memorisation), Nazirah (reading), or Qaida (beginner)
  - Current Surah and Juz
  - Start and end Ayat (verses)
  - Sabaq Para (today's lesson portion)
  - Memorisation quality rating
  - Notes
- **Classroom** — see all students' progress side by side for a selected date.
- **Monthly** — a calendar view showing a student's entries across the month.

Admins can switch between teacher views using the teacher selector at the top.

### Schedule

Navigate to **Schedule** from the sidebar to view your weekly class timetable. The schedule displays your classes by day and time.

### Messages

Navigate to **Messages** from the sidebar.

- **Compose** — select a parent from the dropdown, enter a subject and message body, and click **Send**.
- **Inbox** — view messages received from parents. Unread messages are highlighted.
- **Sent** — review messages you have already sent.
- Click any conversation to open a threaded view and reply inline.

### Add Parent

Navigate to **Add Parent** from the sidebar (or use the link on a student's profile).

- Enter the parent's email address and select which student(s) to link them to.
- The system creates a parent account and sends an invitation email.
- Once linked, the parent can log in and see their child's data.

### Preferences

Navigate to **Preferences** (or **Settings**) from the sidebar to adjust:

- Notification preferences (email alerts for absences, messages, etc.)
- Display language or region settings

---

## Admin Guide

Admins have access to everything teachers can do, plus the features below.

### Teachers Page

Navigate to **Teachers** from the sidebar.

- View all teacher accounts with their subject and contact details.
- See per-teacher statistics (number of students, attendance rate, progress entries).
- Add or edit teacher accounts.

### Analytics

Navigate to **Analytics** from the sidebar. This is the executive reporting dashboard.

The Analytics page is organised into five tabs:

| Tab | What it shows |
|-----|---------------|
| **Overview** | High-level executive summary: total students, attendance trends, progress activity |
| **Students** | Per-student metrics — attendance rates, progress entries, risk indicators |
| **Teachers** | Per-teacher metrics — class load, student count, activity levels |
| **Classes** | Per-class metrics — enrolment numbers, attendance, progress |
| **Alerts & Risks** | Active alerts flagged by the system (e.g. students with very low attendance or no recent progress). Critical alerts are highlighted in red. |

### Activity Feed

From the Admin Dashboard, the **Activity Feed** section shows a log of recent system actions (attendance recorded, progress entries added, messages sent, etc.).

### Admin Panel (`/admin`)

The Admin Panel is a separate configuration area accessed at `/admin`. It includes:

#### Setup

Initial system configuration. Use this when setting up the madrassah for the first time (admin account creation, system defaults).

#### Parent Accounts

- Create parent accounts manually by entering the parent's name and email.
- Link parent accounts to one or more students.
- View and manage all existing parent accounts.

#### Bulk Student Import

Import multiple students at once from a CSV file. Download the template, fill it in with student data, and upload. The system will create records for each row.

#### Teacher Schedules

View the combined timetable for all teachers in a single screen. Useful for spotting scheduling conflicts.

#### Roles — Manual Role Assignment

If a user's role was not set automatically on sign-up, use this page to assign the correct role (Admin, Teacher, or Parent) to any account by email address.

---

## Parent Guide

Parents can only see data for their linked child (or children). If your account has not been linked to a student yet, contact the teacher or administrator.

### Parent Dashboard

The Dashboard is your home screen. For the selected child it shows:

- **Attendance rate** — percentage of sessions attended (based on the last 50 records).
- **Qur'an position** — the most recently recorded Surah and Juz.
- **Pending Work** — number of assignments not yet graded.
- **Progress Entries** — total Dhor Book entries in the last 20 sessions.

Below the summary cards you can see:

- A list of the 10 most recent attendance sessions with Present / Absent / Late badges.
- The 5 most recent Qur'an progress entries (Surah, Juz, verses, quality, and teacher notes).
- All current assignments with their status.

If you have more than one child linked to your account, use the **child selector** at the top to switch between them.

### Progress — Qur'an Memorisation (Dhor Book)

Navigate to **Progress** from the parent menu.

- Select your child using the child selector.
- The full **Dhor Book** is displayed in read-only mode.
- You can see each daily entry: lesson type, Surah, Juz, verses, quality, and teacher notes.

### Attendance

Navigate to **Attendance** from the parent menu.

- Summary cards show the overall attendance rate and counts of Present, Absent, and Late sessions.
- The full session history (up to 50 recent sessions) is listed below with the date and status of each session.

### Academics

Navigate to **Academics** from the parent menu.

- The **Assignments** tab shows all assignments set for your child. Each row includes:
  - Title and description
  - Due date
  - Status (Assigned / Submitted / Graded)
  - Grade and teacher feedback (once graded)
  - An attached file, if the teacher included one
- Click any row to open the full assignment details. If there is an attachment you can preview images and PDFs directly in the browser, or download the file.
- Use the **Status** filter or the search box to find specific assignments.

> Note: The **Grades** and **Reports** tabs are coming soon.

### Messages

Navigate to **Messages** from the parent menu.

- **Send a message** — select the teacher from the dropdown, enter a subject and your message, then click **Send**. The teacher receives an email notification.
- **Inbox** — messages from your child's teacher appear here. Unread messages have a blue highlight. Click a message to open the full conversation thread and reply.
- **Sent** — review messages you have already sent.
- Use the **Filter by Teacher** dropdown to show messages from a specific teacher only.

---

## Tips & Troubleshooting

**Can't see your child's data (parent)?**
Your account must be linked to your child's student record by a teacher or admin. Contact the madrassah office and ask them to link your account.

**Assignment data not showing (parent)?**
Make sure your account is linked to the correct student. If it is linked and assignments still do not appear, ask the teacher to confirm they have assigned work to your child.

**Attendance not updating (teacher)?**
Check that the correct date is selected and that you are looking at an active class. Attendance cutoff settings set by the admin may prevent edits after a certain time.

**Can't log in?**
Use the **Reset password** link on the login page. If you still cannot access your account, contact your administrator.

**Wrong role after logging in?**
If you see the wrong dashboard or receive an "Access Denied" error, ask an admin to check your role assignment in the Admin Panel under **Roles — Manual Role Assignment**.

**Progress Book entries not saving?**
Ensure all required fields (lesson type, Surah, Juz, and at least a start Ayat) are filled in before submitting.
