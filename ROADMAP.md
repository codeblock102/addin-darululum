# Darul Ulum Montreal — Roadmap

_Last updated: 2026-05-09_
_Status: Phase 1 ✅ shipped · Phase 2 ✅ shipped · Phase 3 next_
_Owner: Adekunle (engineering) · Stakeholders: DUM admin team, secretary, teachers, parents_

---

## Vision

Darul Ulum Montreal is becoming the operational backbone of a modern Quran school: one place where admins run the school day, teachers record Hifz progress and attendance, parents see their child's life at school in real time, and the secretary manages families without spreadsheets. The product should feel less like "a school portal" and more like a calm, daily-use tool — fast, mobile-friendly, accurate, and trustworthy enough that paper records become optional. Over the next four months we move from "feature-complete MVP" to "the system the school cannot run without," shipping in tight phases that prioritize stability, parent experience, school-day operations, and the natural rhythm of the academic year.

---

## Phase 1 — Stabilization ✅ SHIPPED (2026-05-08)

**Goal:** zero known critical bugs, observable production, basic safety net of tests. No new features ship until this is green.

| # | Item | Why it matters | Effort | Depends on |
|---|------|----------------|--------|------------|
| 1.1 | Fix `ParentEditDialog` + `TeacherEditDialog` email validation (🔴) | Bad emails silently break notifications and corrupt auth records | S | — |
| 1.2 | Harden `useStudentTeacher` (`.maybeSingle()` + try/catch) (🟡) | Currently throws on unassigned students, breaks parent dashboard | S | — |
| 1.3 | Fix `StudentContactPopover` `.single()` crash on missing student (🟡) | Crashes admin tables when a student row is missing | S | — |
| 1.4 | Escape CSV headers in Reports export (🟡) | Commas/quotes in section names corrupt Excel imports | S | — |
| 1.5 | Optimize `attendance-by-section` report (O(n×m) → O(n+m)) (🟡) | Already slow at 113 students; will time out at scale | S | — |
| 1.6 | Remove `setState` during render in `CommunicationTemplates` (🟡) | Causes re-render loops, intermittent UI freeze | S | — |
| 1.7 | Add `madrassah_id` filter to AdminDashboard count queries (🟡) | Single-tenant assumption hides bug — dangerous before any second tenant | S | — |
| 1.8 | Re-enable paused email cron jobs (5, 34, 35) | Daily progress / absence emails currently dark | S | 1.1–1.7 deployed |
| 1.9 | Add error monitoring | Right now we find out about bugs from users | M | — |
| 1.10 | TypeScript: enable `noUnusedLocals` + `noUnusedParameters` | Cheap signal, catches dead code before strict mode | S | — |
| 1.11 | Critical-path tests (attendance submit, message send, progress entry) | These three flows define the product — must not regress | M | Vitest setup |

### Notes on 1.8 — re-enabling email crons

Cron jobs 5, 34, 35 are paused. Sequence to safely re-enable:
1. Deploy 1.1–1.7.
2. Trigger each cron manually via Supabase dashboard against a single test recipient.
3. Verify Resend dashboard shows delivered, no bounces.
4. Resume schedule. Watch error monitoring (1.9) for 24h.

### Notes on 1.9 — monitoring

Two viable paths — pick one this week, don't shop around:
- **Sentry free tier** — 5k events/month, ready in 30 min, best signal/effort ratio.
- **Lightweight `error_log` table + edge function** — if Sentry is overkill, log `error_id, user_id, route, message, stack, created_at` and surface in admin Activity page.

Recommendation: **Sentry**. Errors deserve a real tool; we already have admin audit log for app-level events.

### Notes on 1.11 — tests

Minimum viable suite — three integration tests against a seeded local Supabase:
- Teacher submits attendance for a class → row appears in `attendance` table.
- Teacher sends a parent message → row in `messages` + email queued.
- Teacher records Dhor entry → row in `progress` + parent daily-summary picks it up.

Gate CI on these. Everything else is gravy.

---

## Phase 2 — Parent UX ✅ SHIPPED (2026-05-09)

**Goal:** parents log in daily because the app is more useful than texting the teacher. This is where we earn retention.

| # | Item | Why | Effort | Depends on |
|---|------|-----|--------|------------|
| 2.1 | **Parent Weekly Agenda** — week-grid view of child's schedule | Most-requested in screenshots; answers "where is my child right now?" | M | Class schedule data model exists |
| 2.2 | **Hifz Report Card PDF** — printable per-student memorization report | Schools traditionally hand these out; parents will print and frame them | M | Dhor Book data |
| 2.3 | **Student photo upload** | Photos make every list/dossier feel real; trivial UX win | S | Supabase storage bucket |
| 2.4 | **Parent assignment submission** — upload completed work | Closes the loop on assignments; teachers stop chasing | M | Existing assignment table |

### 2.1 — Parent Weekly Agenda

- Reuse `SchoolCalendar` grid component if possible.
- Source: join `students` → `section` → `class_schedule` (verify schema exists; may need a `class_schedule` table).
- Show: class name, teacher, room, time, plus any holiday/PD overlay from `events`.
- Mobile-first — most parents open this on their phone.

### 2.2 — Hifz Report Card

- Use `react-pdf` or generate HTML → print stylesheet (cheaper, already in stack).
- Fields: student name, photo (from 2.3), section, current Surah/Juz, pages memorized this term, revision quality, teacher remarks, principal signature line.
- Generated server-side via edge function so admins can bulk-export end of term.

### 2.3 — Photo upload

- Supabase storage bucket `student-photos`, RLS: admin write, teacher/parent read for own students.
- Add to `StudentEditDialog` and parent profile page.
- Show in: students list, dossier, contact popover, weekly agenda, report card.

### 2.4 — Parent assignment submission

- New table `assignment_submissions(id, assignment_id, student_id, file_url, parent_note, submitted_at, graded_at)`.
- Parent uploads → teacher sees in existing assignment grading flow → existing `send-assignment-graded` email fires on grading.

---

## Phase 3 — School Operations 🟡 NEXT (month 2)

**Goal:** the secretary's spreadsheets disappear. Admin runs the school day from the app.

| # | Item | Why | Effort | Depends on |
|---|------|-----|--------|------------|
| 3.1 | Parent-Teacher Interview Scheduling | Currently coordinated by phone — wastes hours per term | L | Calendar primitives |
| 3.2 | Transport / Pickup Confirmation | Safety + parent peace of mind | M | Photo (2.3) helps |
| 3.3 | Bulk Attendance CSV Export | Government/internal reporting needs | S | Reports module |
| 3.4 | Secretary test accounts (demo teacher + parent) | Secretary onboarding + sales demos | S | — |

### 3.1 — Parent-Teacher Interviews

- Admin creates an interview window (e.g. "Term 1 interviews, Nov 12–14").
- Per teacher per section, define available 15-min slots.
- Parent dashboard shows "Book interview" → calendar of open slots.
- Email confirmation + reminder (reuse Resend templates).
- Admin override panel: reschedule, cancel, see no-shows.
- This is the largest item on the roadmap — scope tightly. **MVP = manual slot creation, no recurring rules.**

### 3.2 — Transport / Pickup

- Schema: `pickup_log(student_id, picked_up_by, relationship, time, confirmed_by_staff, photo_url)`.
- Staff scans/selects student at dismissal → confirms pickup person.
- Parent gets push (when 5.1 lands) / email "Your child was picked up at 3:47 PM by [name]."
- Phase-1 version: staff-only, no parent self-checkout. Avoid liability creep.

### 3.3 — Bulk Attendance CSV

- Add to Reports page: date range + section filter + "Download full log."
- Re-use CSV escaping fix from 1.4.

### 3.4 — Test accounts

- Seeded user "Demo Teacher" with one section of fake students; "Demo Parent" linked to one fake student.
- Reset script run nightly via cron (don't let demo data drift).

---

## Phase 4 — Year Lifecycle (month 3)

**Goal:** survive August. The school year transition is the highest-risk operation we'll ever run on this DB.

| # | Item | Why | Effort | Depends on |
|---|------|-----|--------|------------|
| 4.1 | Beginning-of-Year Rollover tool | Will be needed regardless — better to ship calmly than scramble in August | L | — |
| 4.2 | Archive system for past years | Keeps prod tables small + enables historical lookup | M | 4.1 |
| 4.3 | Multi-year reporting | Trend analysis: did students who completed Hifz in '25 retain in '26? | M | 4.2 |

### 4.1 — Rollover

- New `academic_years` table, `current_year_id` flag.
- "Promote students" wizard: bulk move students up a section, mark graduates as `status='graduated'`, archive last year's attendance/progress.
- **Critical:** dry-run mode that previews every change before committing. No magic buttons.
- Backup snapshot (pg_dump) auto-triggered before commit.

### 4.2 — Archive

- Move closed-year `attendance`, `progress`, `messages` to `*_archive` tables (or partition by year if Postgres supports).
- Read path: union archive when querying historical data.

### 4.3 — Multi-year reporting

- Extend Reports module with year selector.
- Compare juz completed per student per year.
- Section-level retention: how many students from Section 3A in '25 are still enrolled in '26?

---

## Phase 5 — Engagement & Growth (month 4+)

**Goal:** stop reacting to requests; start shaping the school's digital experience.

| # | Item | Why | Effort | Depends on |
|---|------|-----|--------|------------|
| 5.1 | Push notifications (browser + PWA) | Email is good; instant pings are better for absences/pickups | M | Service worker, PWA manifest |
| 5.2 | Mobile-responsive polish (full audit on phone) | 80% of parents will open on phones; current admin UI assumes desktop | L | — |
| 5.3 | Built-in booking (vs. Calendly) | Calendly is fine MVP; built-in keeps data + branding in-house | M | 3.1 work overlaps |
| 5.4 | Public school website + parent inquiry form | Top-of-funnel; hand-off into student onboarding | L | — |

### Decision pending — Calendly vs. built-in

Embed Calendly for parent inquiry meetings in the short term (1–2 days work). Migrate to built-in once 3.1 is mature; the same slot infra serves both flows.

---

## Technical Debt Backlog

Not on a phase timeline — pull in as capacity allows or when adjacent work makes it cheap.

| Item | Pain | Effort |
|------|------|--------|
| Refactor `DhorBookEntryForm.tsx` (1498 lines) | Single biggest source of merge conflicts; new fields take 2x longer than they should | L |
| Refactor `Activity.tsx` admin audit log (1344 lines) | Hard to extend; filter logic tangled with rendering | L |
| Refactor `TeacherMessages.tsx` (1178 lines) | Three responsibilities in one component (list, compose, thread) | M |
| TypeScript `strictNullChecks` | Most runtime errors we ship are nullable misses | L (gradual) |
| Migration filename standardization | Mix of `add_*.sql` and `20YYMMDD*.sql` makes ordering ambiguous | S |
| Sentry or equivalent (if not done in 1.9) | Already covered above; listed for completeness | M |
| Playwright E2E suite | login, attendance submit, message send, progress entry, parent dashboard | L |

### Refactor strategy

For each of the three giant files: extract sub-components into a sibling folder (`DhorBookEntryForm/`), one PR per extracted section, each PR independently shippable. Don't attempt a big-bang rewrite.

---

## Dependencies / Risks

| Risk | Mitigation |
|------|------------|
| **Live data — ~113 students, ~30 teachers, real parents** | Every migration tested on a `staging` Supabase branch; pg_dump before phase 4.1 rollover; no destructive SQL without confirmation |
| **Resend daily email limit** | Monitor in 1.9; batch absence emails into one daily digest if approaching cap; consider Resend paid tier before September enrollment bump |
| **Single-tenant assumption** | `madrassah_id` is missing in many queries (see 1.7). Audit *all* queries before onboarding any second school. Consider a `useTenantQuery` wrapper that injects the filter |
| **Git push shallow-fetch workaround (refs/stash 2 corrupt)** | Document the workaround in `docs/`; long-term: rewrite history once or accept it permanently. Low priority |
| **Solo developer bus factor** | This roadmap doc + ARCHITECTURE.md + commit messages are the contingency plan. Keep them current |
| **August rollover (4.1)** | Treated as its own phase with explicit dry-run requirement. Schedule a no-other-changes window in August |

---

## Success Metrics

Track monthly. If a metric trends wrong for 2 months, that drives the next phase's priorities.

| Metric | Target | Source |
|--------|--------|--------|
| Daily active admins | 5+ | Supabase auth logs |
| Daily active teachers | 20+ of ~30 | Auth logs |
| % of attendance taken before 9:30 AM | >90% | `attendance.created_at` vs class start |
| Parent message open rate | >60% | Resend webhooks |
| Parent dashboard weekly active | >50% of parents | Auth logs |
| Bug count per release | <3 user-reported bugs in first 48h | Sentry / user reports |
| Mean time to resolve P1 bug | <24h | Manual log |
| Email deliverability | >98% | Resend dashboard |

---

## Appendix — Phase Summary at a Glance

| Phase | Window | Theme | Ship gate |
|-------|--------|-------|-----------|
| 1 | This week | Stabilization | All 🔴/🟡 bugs closed, monitoring live, crons re-enabled |
| 2 | Next 2 weeks | Parent UX | Weekly agenda + Hifz PDF live; parents using daily |
| 3 | Month 2 | School operations | Secretary stops using spreadsheets |
| 4 | Month 3 | Year lifecycle | Rollover dry-run successful on staging |
| 5 | Month 4+ | Engagement & growth | Push notifications shipped, mobile polish complete |

---

_This is a living document. Update at the start of each phase; archive completed items rather than deleting them so we keep a trail of what shipped when._
