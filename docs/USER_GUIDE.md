# User Guide

Welcome to **Addin Darululum** — a student management system designed for Madrassah Hifz programmes. This guide explains how to use the system for both administrators and teachers.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Portal](#admin-portal)
   - [Dashboard](#admin-dashboard)
   - [Managing Students](#managing-students)
   - [Managing Teachers](#managing-teachers)
   - [Progress Book (Dhor Book)](#progress-book-admin)
   - [Attendance](#attendance-admin)
   - [Messaging](#messaging-admin)
   - [Settings](#settings)
3. [Teacher Portal](#teacher-portal)
   - [Dashboard](#teacher-dashboard)
   - [My Students](#my-students)
   - [Recording Progress](#recording-progress)
   - [Attendance](#attendance-teacher)
   - [Analytics](#analytics)
   - [Messages](#messages-teacher)
   - [Preferences](#preferences)

---

## Getting Started

### Login
1. Navigate to the application URL.
2. Enter your email address and password.
3. Click **Sign In**.

If you do not have an account, contact your administrator to create one for you.

### First-time Setup (Admin only)
If this is a fresh installation:
1. Go to `/setup-admin` to create the first admin account.
2. Log in with your admin credentials.
3. Add teachers via **Teacher Accounts**.
4. Add students and assign them to teachers.

---

## Admin Portal

### Admin Dashboard {#admin-dashboard}

The admin dashboard shows a high-level overview of the Madrassah:

- **Total Students** — Number of active students enrolled.
- **Total Teachers** — Number of active teachers.
- **Today's Attendance Rate** — Percentage of students present today.
- **Active Classes** — Number of currently active classes.

Use the sidebar to navigate to different sections.

---

### Managing Students {#managing-students}

**Path:** Sidebar → Students

#### Viewing Students
The Students page shows a table of all enrolled students. You can:
- Search by name
- Filter by section/class
- Click a student row to view their detailed profile

#### Adding a New Student
1. Click **Add Student**.
2. Fill in the student's name, section, and other details.
3. Click **Save**.

#### Student Detail Page
Click any student to see:
- Personal information
- Assigned teacher
- Progress history (Sabaq, Sabaq Para, Dhor records)
- Juz mastery status
- Attendance history

---

### Managing Teachers {#managing-teachers}

**Path:** Sidebar → Teachers

#### Viewing Teachers
Shows all teachers with their name, email, assigned section, and status.

#### Adding a Teacher (Teacher Accounts)
**Path:** Sidebar → Teacher Accounts

1. Click **Add Teacher Account**.
2. Fill in name, email, section, and subject.
3. Optionally check **Create Login Account** to generate login credentials.
4. Click **Create**.

The teacher will receive login credentials they can use to access the Teacher Portal.

#### Assigning Students to Teachers
Students are assigned to teachers at the class/section level. When you create a class and assign a teacher, students in that section are associated with that teacher.

---

### Progress Book (Admin) {#progress-book-admin}

**Path:** Sidebar → Progress Book

The Progress Book shows all student progress entries across the Madrassah. As an admin you can:
- View all entries by date
- Filter by student, teacher, or record type (Sabaq / Sabaq Para / Dhor)
- See the leaderboard showing top-performing students

---

### Attendance (Admin) {#attendance-admin}

**Path:** Sidebar → Attendance

View attendance records across all classes. You can:
- Filter by date and class
- See which students were present, absent, or late
- Export attendance data

---

### Messaging (Admin) {#messaging-admin}

**Path:** Admin Dashboard → Messaging tab

#### Receiving Messages
The **Inbox → Received** tab shows messages sent to the admin by teachers.

#### Sending Messages
1. Click the **Compose** tab.
2. Select one or more teacher recipients from the dropdown.
3. Choose a message type (Direct, Announcement, Feedback) and category.
4. Type your message.
5. Click **Send Message**.

New unread messages show a badge counter on the Inbox tab.

---

### Settings {#settings}

**Path:** Sidebar → Settings

Configure application-wide settings such as:
- School name and information
- Academic year configuration
- Notification preferences

---

## Teacher Portal

### Teacher Dashboard {#teacher-dashboard}

The teacher dashboard shows:
- **My Students** — count of students assigned to you
- **Today's Entries** — progress records submitted today
- **Leaderboard** — top students by Juz mastery
- Quick links to record progress and mark attendance

---

### My Students {#my-students}

**Path:** Dashboard → Students tab

Shows all students currently assigned to you. Click a student to see their progress history, Juz mastery status, and attendance record.

---

### Recording Progress {#recording-progress}

**Path:** Sidebar → Progress Book

This is where you record each student's daily Quran session.

#### Creating a Progress Entry
1. Click **New Entry** (or the + button).
2. Select the **student**.
3. Select the **date**.
4. Fill in the **Sabaq** tab (new lesson):
   - Select the Juz and Surah
   - Enter start and end Ayat
   - Rate the memorization quality
5. Fill in the **Sabaq Para** tab (recent revision) if applicable.
6. Fill in the **Dhor** tab (old revision) if applicable.
7. Add any notes or comments in the **General** tab.
8. Click **Save Entry**.

#### Understanding Entry Types
| Tab | What to record |
|-----|---------------|
| **Sabaq** | Today's new memorization lesson |
| **Sabaq Para** | Revision of recently learned portions |
| **Dhor** | Revision of older memorized portions |

#### Quality Ratings
When recording any entry, rate the student's recitation quality:
- **Excellent** — Flawless with perfect Tajweed
- **Good** — Very good with minor errors
- **Average** — Acceptable with some errors
- **Needs Work** — Below average, needs more practice
- **Needs Improvement** — Poor, significant revision required

---

### Attendance (Teacher) {#attendance-teacher}

**Path:** Sidebar → Attendance (or Dashboard → Attendance tab)

#### Marking Attendance
1. Select the date using the date picker.
2. For each student, select their status:
   - **Present**
   - **Absent**
   - **Late**
3. Use **Mark All Present** for bulk attendance on normal days.
4. Click **Save Attendance**.

#### Bulk Actions
Select multiple students using the checkboxes, then use the bulk action dropdown to mark them all as present, absent, or late at once.

---

### Analytics {#analytics}

**Path:** Dashboard → Analytics tab (or teacher portal analytics section)

The analytics page shows data-driven insights about your students:

#### Stats Cards (top row)
| Card | What it shows |
|------|--------------|
| **My Students** | Total students assigned to you |
| **Average Quality** | Weighted average memorization quality score across all students |
| **This Week's Entries** | Progress entries recorded in the last 7 days |
| **Revisions This Month** | Total progress entries this calendar month |

#### Charts

**Progress Overview tab:**
- **Memorization Quality Distribution** — Pie chart showing breakdown of quality ratings across all students
- **Progress Over Time** — Line chart showing daily entry counts over the last 90 days

**Student Performance tab:**
- **Student Memorization Progress** — Bar chart comparing total verses memorized per student

**Daily Activity tab:**
- **Daily Activity** — Bar chart showing entries per day over the last 14 days

---

### Messages (Teacher) {#messages-teacher}

**Path:** Sidebar → Messages (or Dashboard → Messages)

#### Inbox
Shows messages received from the admin or other teachers. Unread messages are highlighted and marked with a **New** badge.

Click a message to expand and read the full content.

#### Sent
Shows messages you have sent.

#### Composing a Message
1. Click the **Compose** tab.
2. Select a recipient from the dropdown.
3. Choose a message type and category.
4. Type your message.
5. Click **Send Message**.

The inbox automatically updates in real-time when new messages arrive.

---

### Preferences {#preferences}

**Path:** Sidebar → Preferences

Personalise your teacher portal:
- Display name
- Notification settings
- Theme (light/dark mode)
