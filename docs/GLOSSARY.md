# Glossary — Dār Al-Ulūm Montréal

Islamic, Madrassah-specific, and system terms used throughout the application.

---

## Qur'an Memorization Terms

### Hifz (حفظ)
The act of memorizing the Qur'an by heart. A student who has memorized the entire Qur'an is called a **Hafiz** (male) or **Hafiza** (female). In the app, `lesson_type = "hifz"` records new memorization entries.

### Sabaq (سبق)
Literally "lesson." In the context of Hifz, Sabaq is the student's **new daily lesson** — the fresh verses being memorized for the first time. A student typically memorizes a small portion (a few verses or a page) as their Sabaq each day.

### Sabaq Para (سبق پارہ)
The **recent revision** portion. Once a student moves on to a new Sabaq, the previous lesson becomes their Sabaq Para and is reviewed regularly to keep recent memorization fresh. "Para" is Urdu/Persian for a section or portion.

### Dhor (دور)
The **old revision** — reviewing portions of the Qur'an memorized some time ago. A student cycles through their entire memorized portion via Dhor to prevent forgetting. The Progress Book (Dhor Book) is the primary tracking tool for this.

### Juz (جُزء) — plural: Ajza
One of the 30 equal divisions of the Qur'an. Each Juz contains roughly the same amount of text. Student progress is often tracked by Juz completed. `current_juz` and `completed_juz[]` are key fields on the `students` table.

### Surah (سورة) — plural: Suwar
A chapter of the Qur'an. There are 114 Surahs, ranging from 3 verses (Al-Kawthar) to 286 verses (Al-Baqarah).

### Ayah / Ayat (آية)
A single verse of the Qur'an. Progress is often measured in the number of Ayat memorized. `start_ayat` and `end_ayat` are fields on the `progress` table.

### Tajweed (تجويد)
The rules governing correct Qur'anic pronunciation and recitation. Quality ratings reflect how well a student applies Tajweed.

### Nazirah (نظرة)
Reading from the Mushaf (Qur'an text) without memorization. A lesson type distinct from Hifz. `lesson_type = "nazirah"`.

### Qaida (قاعدة)
The introductory level of Qur'anic reading — basic letter recognition, joining, and pronunciation rules. `lesson_type = "qaida"`.

---

## School / System Terms

### Madrassah (مدرسة)
An Islamic educational institution. Literally "school" in Arabic. In South Asian contexts, refers specifically to an institution focused on Islamic education, including Qur'an memorization.

### Dhor Book
The record book used in traditional Madrassahs to track daily Sabaq, Sabaq Para, and Dhor entries. In this system, the "Progress Book" (`/progress-book`) is the digital Dhor Book.

### IEP (Individualized Education Plan)
A documented plan for students who need accommodations or specialized support. The **Health & IEP** tab on each student's detail page stores the IEP flag and accommodations text. Admins can toggle and edit this inline.

### Section
A grouping of students, typically by level of memorization or grade. Teachers are assigned to one or more sections. The `section` field exists on both `students` and `profiles`.

---

## Attendance Statuses

| Status | Meaning |
|---|---|
| **Present** | Student attended the session |
| **Absent** | Student was absent (reason required) |
| **Late** | Student arrived late (reason required) |
| **Excused** | Pre-approved absence (reason required) |
| **Early Departure** | Student left before the session ended |
| **Sick** | Student was absent due to illness |

---

## Quality Ratings

Used in progress entries to assess a student's recitation quality.

| Rating | Score | Meaning |
|---|---|---|
| **Excellent** | 5 | Perfect recitation with flawless Tajweed |
| **Good** | 4 | Very good with minor errors |
| **Average** | 3 | Acceptable with some errors |
| **Needs Work** | 2 | Below average; more practice required |
| **Needs Improvement** | 1 | Poor recitation; significant revision needed |

The average quality score across all entries is displayed as a weighted average (e.g., "Good (4.2/5)") in the analytics dashboard.

---

## Absence Reason Categories (Mozaïk-style)

| Category | Examples |
|---|---|
| **Activities** | School trip, sports event, extracurricular |
| **Legal** | Court appearance, immigration appointment |
| **Family** | Family event, bereavement |
| **Health** | Illness, medical appointment |
| **Other** | Any other reason (requires description) |
