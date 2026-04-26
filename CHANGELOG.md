## [1.1.5](https://github.com/Adekunes/addin-darululum/compare/v1.1.4...v1.1.5) (2026-04-23)


### Bug Fixes

* **ci:** exclude no-import-prefix in Deno 2.x lint on dev/main ([cd4a231](https://github.com/Adekunes/addin-darululum/commit/cd4a2317e9432965a060ccb8f625e8d83be0f83f))
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
