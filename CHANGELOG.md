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
