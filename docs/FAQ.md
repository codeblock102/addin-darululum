# Frequently Asked Questions

---

## Admin

### How do I create a teacher account?

1. Go to **Sidebar → Teacher Accounts**.
2. Click **Add Teacher Account**.
3. Fill in the teacher's name, email, section, and subject.
4. Check **Create Login Account** and optionally **Generate Password** to automatically create login credentials.
5. Click **Create**.

The teacher can then log in using the email and password you set.

---

### How do I assign students to teachers?

Students are assigned to teachers through the class/section system. When a class is created and a teacher is assigned to it, all students in that section are associated with that teacher.

To manage assignments:
1. Go to **Sidebar → Students**.
2. Edit a student and set their section.
3. Go to **Sidebar → Classes** to ensure the correct teacher is assigned to that section.

---

### How do I reset a teacher's password?

Currently password resets are handled through Supabase Auth. Contact your system administrator, or use the Supabase dashboard to reset the user's password.

---

### Why is the attendance rate showing 0%?

This means no attendance has been recorded for today. Ask teachers to mark attendance for their students each day.

---

### How do I view all progress entries?

Go to **Sidebar → Progress Book**. You can filter by date, student, teacher, or record type.

---

## Teachers

### How do I record today's progress for a student?

1. Go to **Sidebar → Progress Book**.
2. Click **New Entry**.
3. Select the student and date.
4. Fill in the Sabaq (new lesson), Sabaq Para (recent revision), and/or Dhor (old revision) tabs.
5. Rate the quality and add any notes.
6. Click **Save Entry**.

---

### What is the difference between Sabaq, Sabaq Para, and Dhor?

| Term | Meaning |
|------|---------|
| **Sabaq** | Today's new memorization — the fresh verses being learned |
| **Sabaq Para** | Recent revision — verses learned in recent days being reviewed |
| **Dhor** | Old revision — older memorized portions being cycled through |

See the [Glossary](GLOSSARY.md) for full definitions.

---

### How do I mark attendance for all students at once?

On the Attendance page:
1. Select the date.
2. Click **Mark All Present** to mark everyone present in one click.
3. Then manually change any absent or late students.
4. Click **Save Attendance**.

---

### What do the quality ratings mean?

| Rating | Meaning |
|--------|---------|
| Excellent | Flawless recitation with perfect Tajweed |
| Good | Very good with minor errors |
| Average | Acceptable with some errors |
| Needs Work | Below average; more practice required |
| Needs Improvement | Poor recitation; significant revision needed |

---

### How does the Average Quality score work?

The Average Quality in the Analytics section is a weighted score calculated as:
- Excellent = 5 points
- Good = 4 points
- Average = 3 points
- Needs Work = 2 points
- Needs Improvement = 1 point

The score is the average across all entries for your students, displayed as a label and number (e.g., "Good (4.2/5)").

---

### Why are my analytics charts empty?

Analytics require progress entries to be recorded. If you have just started using the system, charts will be empty until you record student progress. The time-based charts show the last 90 days, so older entries will not appear.

---

### How do I receive messages from the admin?

Messages appear automatically in your **Messages → Inbox** tab. The system uses real-time updates, so new messages will appear without needing to refresh the page. You will also see a toast notification when a new message arrives.

---

### I cannot see any students in my portal. Why?

This means no students have been assigned to your teacher account. Contact your administrator to:
1. Ensure your teacher profile is set up correctly.
2. Ensure students are assigned to your section.

---

## Technical

### The app is not loading. What should I do?

1. Check your internet connection.
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R).
3. Try clearing your browser cache.
4. Contact your system administrator if the issue persists.

### I am getting a "permission denied" error.

This usually means your user account does not have the correct role assigned. Contact your administrator to verify your role (admin or teacher) in the system.
