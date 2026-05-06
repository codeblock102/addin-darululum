# Frequently Asked Questions

---

## Admin

### How do I create a teacher account?

1. Go to **Teacher Accounts** in the sidebar.
2. Click **Add Teacher Account**.
3. Fill in the teacher's name, email, section, and subject.
4. Check **Create Login Account** and optionally **Generate Password**.
5. Click **Create**.

---

### How do I restrict a teacher or admin to one campus?

Set the `section` field on their profile. In the Supabase SQL editor:

```sql
-- Saint-Laurent (women's campus)
UPDATE public.profiles SET section = 'women' WHERE id = '<user-uuid>';

-- Henri-Bourassa (men's campus)
UPDATE public.profiles SET section = 'Henri-Bourassa' WHERE id = '<user-uuid>';
```

Once set, that user will only see students from their section in all views. The attendance section dropdown will also lock automatically.

---

### How do I create a parent account?

1. Go to **Admin → Parent Accounts**.
2. Enter the parent's name and email address.
3. Select the student(s) to link.
4. The system creates the account and sends an invitation email.

---

### How do I assign students to teachers?

When a class is created and a teacher is assigned, all students in that section are associated with that teacher. To update:
1. Go to **Classes** and assign the correct teacher.
2. Go to **Students** and ensure each student's section matches the class.

---

### How do I reset a teacher's password?

Go to **Teacher Accounts**, find the teacher, and use the password reset option. Alternatively, the teacher can use **Forgot password?** on the login page.

---

### How do I change someone's role (e.g., admin → teacher)?

Via Supabase SQL:

```sql
UPDATE public.profiles SET role = 'teacher' WHERE id = '<user-uuid>';
UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb
  WHERE id = '<user-uuid>';
```

Always update both tables to keep them consistent.

---

### How do I view all teacher schedules?

Go to **Admin → Teacher Schedules**. This shows a combined timetable for all teachers. Schedules must first be seeded — run `seed_dum_schedules_v10.sql` in the Supabase SQL editor.

---

### How do I add a student's health information or IEP?

1. Go to **Students** and open the student's detail page.
2. Click the **Health & IEP** tab (4th tab).
3. Click the pencil icon to edit: health card number, medical condition, allergies, health notes, IEP toggle, and accommodations.
4. Click Save.

---

### How do I see the staff directory?

Go to **Teachers** → click the **Staff Directory** tab. You can search by name, subject, or grade. Each card shows the staff member's role, subjects, contact details, and bio.

---

### Why is the attendance rate showing 0%?

No attendance has been recorded for today. Ask teachers to mark attendance for their students daily.

---

### How do I import students in bulk?

Go to **Admin → Bulk Student Import**. Download the CSV template, fill it in, and upload. The system creates a record for each row.

---

### What should I run in the Supabase SQL editor to activate everything?

Three migration files should be run (in order):

1. `supabase/migrations/add_sick_attendance_status.sql` — adds "sick" to the DB enum
2. `supabase/migrations/add_student_dossier_fields.sql` — adds 13 columns to the students table
3. `supabase/migrations/seed_dum_schedules_v10.sql` — seeds all 12 class schedules

---

## Teachers

### How do I record today's progress for a student?

1. Go to **Progress Book** → **New Entry**.
2. Select the student and date.
3. Fill in lesson type (Hifz/Nazirah/Qaida), Surah, Juz, Ayat range, quality rating, and notes.
4. Click **Save Entry**.

---

### What is the difference between Sabaq, Sabaq Para, and Dhor?

| Term | Meaning |
|---|---|
| **Sabaq** | Today's new memorization — fresh verses being learned |
| **Sabaq Para** | Recent revision — verses from the last few days being reviewed |
| **Dhor** | Old revision — older memorized portions being cycled through |

See [GLOSSARY.md](GLOSSARY.md) for full definitions.

---

### How do I record a "Sick" absence?

On the Attendance page, when marking a student, select **Sick** from the status options (the thermometer icon). This is distinct from "Absent" or "Excused" — it records that the student was absent due to illness.

---

### How do I enter a multi-day absence?

Click the **Multi-day Absence** button at the top of the Attendance page. Select the student, start date, and end date. The system creates one excused record per weekday in the range (weekends are skipped automatically).

---

### What do the quality ratings mean?

| Rating | Score | Meaning |
|---|---|---|
| Excellent | 5 | Perfect recitation with flawless Tajweed |
| Good | 4 | Very good with minor errors |
| Average | 3 | Acceptable with some errors |
| Needs Work | 2 | Below average; more practice required |
| Needs Improvement | 1 | Poor recitation; significant revision needed |

---

### How do I bulk-mark attendance for a whole class?

On the Attendance page, switch to the **Bulk** tab. Select students using the checkboxes (or "Select All"), choose a status, optionally set a time and notes, then click **Apply to Selected**.

---

### Why are my analytics charts empty?

Analytics charts show the last 90 days of data. If you've just started using the system, charts will be empty until enough entries are recorded.

---

### I can't see any students in my portal. Why?

No students have been assigned to your account. Ask the admin to:
1. Ensure your teacher profile has the correct section.
2. Ensure students in your section are linked to your class.

---

### I can only see students from one campus. Is that normal?

Yes — if your profile has a `section` set (e.g. `'women'` or `'Henri-Bourassa'`), you are scoped to that campus. This is intentional. Contact an admin if it seems incorrect.

---

### The section dropdown is missing from the attendance form. Why?

Your profile has a `section` set, so the system automatically locks your view to that section. The dropdown is hidden because it's not needed. This is expected behaviour for campus-scoped staff.

---

### How do I receive messages from the admin?

Messages appear in **Messages → Inbox** in real-time. You'll also see a toast notification when a new message arrives.

---

## Parents

### How do I see my child's data?

Your account must be linked to your child's student record by a teacher or admin. Once linked, log in and all data is visible on your dashboard.

### Can I see my child's sick absences?

Yes — the attendance history shows all statuses including Sick, with colour-coded badges.

### What are the daily emails I receive?

Two types:
1. **Attendance notification** — sent when your child is marked for the day (present, absent, late, etc.). Includes a color-coded status banner and a short message.
2. **Daily progress report** — sent each evening with your child's Quran lesson details (Sabaq) and any assignment updates.

---

## Technical

### The app is not loading.

1. Hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`).
2. Clear browser cache.
3. Check your internet connection.
4. Contact your administrator.

### I'm getting "Access Denied" or seeing the wrong dashboard.

Your role may not be correctly assigned. Ask an admin to check via **Admin → Manual Role Setup**.

### The schedule page is blank.

The schedule data needs to be seeded. An admin or developer must run `seed_dum_schedules_v10.sql` in the Supabase SQL editor.

### Daily emails aren't being sent.

See [EMAIL_SCHEDULING_SETUP.md](EMAIL_SCHEDULING_SETUP.md). Key things to check:
- `pg_cron` extension is enabled in Supabase
- `RESEND_API_KEY` is set in Supabase project secrets
- Guardian email addresses are on file for students
- `attendance_settings.enabled = true` for the madrassah
