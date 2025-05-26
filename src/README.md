# Madrassah student management system app

This application aims to improve administrative efficiency and organization in managing and monitoring the progress of Hifz students.

## Table of Contents
- Features
- File structure
- Tech Stack
- Getting Started
- Usage
- Development
- Contributing
- License

## Features
### Teachers
- Add a student progress data(sabaq,sabaq para,dhor)
- View students basic info (name, amount of juz memorized,enrollment date, activity)
- View student progress data
- View entire classroom progress data
- View schedule
- View student attendence (in progress)
- Add student attendance (in progress)
- Edit personal app preferences

## Tech Stack
- List main technologies (React,Typescript,TanStack Query, Supabase)

## Getting Started
1. Clone the repo
2. Install dependencies
3. Set up environment variables
4. Run the development server


## File Structure
- The project is divided in 10 main folders
### Components: Contains reusable UI components that are used to build the various pages of the application.
- admin: Components specific to the admin section/dashboard.
- attendance: Components related to attendance tracking features (e.g., forms, tables).
- auth: Components used for authentication (e.g., login forms, registration).
- classes: Components related to managing or displaying class information.
- dashboard: General dashboard components, possibly shared across different user roles.
- dhor-book: Components related to "Dhor Book" (likely a progress tracking feature, possibly specific to Quranic studies, "Dhor" can mean revision).
- layouts: Components that define page layouts or structural elements (e.g., sidebars, headers).
- mobile: Components specifically designed or adapted for mobile views.
- progress: Components for displaying or managing student progress.
- shared: Common, reusable components that don't fit into a more specific category.
- student-progress: Components specifically for tracking and displaying student progress metrics.
- students: Components related to student management or display.
- table: Reusable components for rendering data tables.
- teacher-portal: Components specific to the teacher portal section.
- teachers: Components related to teacher management or display.
- ui: ontains general-purpose UI elements, often from a UI library like Shadcn/ui (e.g., buttons, cards, inputs).
### Config: Holds configuration files, such as navigation settings or feature flags.
- **defaultSettings.ts:** This file probably holds default application settings, initial configurations, or constants that might be used across the app.
- **navigation.ts:** This file almost certainly defines the structure and items for application navigation menus (e.g., sidebar links, top navigation).
### Contexts: Holds configuration files, such as navigation settings or feature flags.
**AuthContext.tsx:** This file provides a React Context for managing and sharing authentication state (like the current user, login/logout functions) throughout the application.
### Hooks: Stores custom React hooks for reusable stateful logic.
- **use-mobile.tsx:** A hook likely used to detect if the application is being viewed on a mobile device, possibly for responsive design adjustments.
- **use-toast.ts:** A hook for displaying toast notifications or simple alerts to the user.
- **useAnalyticsData.ts:** Hook for fetching or processing analytics data.
- **useLeaderboardData.ts:** Hook for fetching or managing data related to a leaderboard feature.
- **useRBAC.ts:** (Role-Based Access Control) Hook for managing user permissions and access control based on their roles.
- **useRealtimeAdminMessages.ts:** Hook for handling real-time admin-specific messages or notifications.
- **useRealtimeAnalytics.ts:** Hook for fetching or subscribing to real-time analytics updates.
- **useRealtimeLeaderboard.ts:** Hook for real-time updates to leaderboard data.
- **useRealtimeMessages.ts:** Hook for handling generic real-time messages or notifications.
- **useSettings.ts:** Hook for accessing or modifying application settings, possibly from localStorage or a settings context.
- **useTeacherAccounts.ts:** Hook for managing teacher account data or related operations.
- **useTeacherMessages.ts:** Hook specifically for handling messages related to teachers.
- **useTeacherStatus.ts:** Hook to get or manage the status of a teacher (e.g., active, inactive).
- **useTeacherSummary.ts:** Hook to fetch or compute summary information related to a teacher.
- **useUserRole.ts:** Hook to determine or access the current user's role.
### Integrations: Contains modules for connecting to external services or APIs (e.g., Supabase).
- **supabase**: This subfolder contains all the code related to the Supabase integration, such as the Supabase client setup, type definitions generated from your Supabase schema, and possibly helper functions for interacting with Supabase.
### Lib: Includes helper functions, utility libraries, or third-party library configurations..
- **utils.ts:** This file likely contains general utility functions that can be reused across the application. It's similar to a src/utils folder but might be specifically for functions that are part of a "library" of helpers, or it could be an older pattern if src/utils is also present and more actively used.
### Pages: Defines the top-level components for different application routes/views.
- **admin:** This subfolder contains page components specific to the admin section of the application.
- **Attendance.tsx:** The main page for managing attendance.
- **Auth.tsx:** The page component for handling user authentication (login, signup, etc.).
- **Classes.tsx:** A page for displaying or managing classes.
- **CreateDemoAccount.tsx:** A page likely used for creating demonstration accounts.
- **CreateTeacherProfileForTestAccount.tsx:&& A page for setting up teacher profiles for test accounts.
- **DhorBook.tsx:** The page for the "Dhor Book" feature, likely related to student progress tracking.
- **Index.tsx:** Typically the main landing page or dashboard page after login.
- **NotFound.tsx:** The page displayed when a user navigates to a route that doesn't exist (404 error).
- **Preferences.tsx:** A page for user preferences or settings.
- **Progress.tsx:** A page dedicated to displaying progress information, possibly a general overview.
- **Schedule.tsx:** A page for viewing or managing schedules.
- **Settings.tsx:** A general settings page for the application or user.
- **StudentDetail.tsx:** A page for displaying detailed information about a specific student.
- **StudentProgress.tsx:** A page focused on displaying detailed student progress.
- **Students.tsx:** A page for listing or managing students.
- **TeacherAccounts.tsx:** A page for managing teacher accounts, likely an admin function.
- **TeacherPortal.tsx:** The main entry point or dashboard for the teacher portal.
src/pages/Teachers.tsx: A page for listing or managing teachers.
### Styles: Contains global styles, CSS files, or styling-related configurations.
- **admin-theme.css:** Contains CSS styles specific to the admin theme or section.
- **animations.css:** Holds CSS animations used in the application.
- **base.css:** Contains fundamental or base CSS styles for the entire application.
- **components.css** Styles that might be applied to specific components or component groups.
- **teacher-theme.css:* CSS styles specific to the teacher portal theme.
- **theme.css:** General theme-related CSS, possibly a base theme that admin and teacher themes extend or override.
### Types: Stores TypeScript type definitions and interfaces for the application.
- **adminUser.ts:** Type definitions related to admin user objects.
- **attendance.ts:** Type definitions for attendance records or related data structures.
- **dhor-book.ts:** Type definitions for the "Dhor Book" feature.
- **leaderboard.ts:** Types for leaderboard data.
- **navigation.ts:** Type definitions for navigation items or structures.
- **progress.ts:** Types related to student progress data.
- **settings.ts:** Type definitions for application or user settings.
- **supabase.ts:** This is likely the auto-generated file from Supabase containing types for your database schema (tables, columns, enums, etc.).
- **teacher.ts:** Type definitions for teacher objects or related data.
- **user.ts:* General user type definitions, possibly a base user type.
### Utils: Provides general utility functions used across various parts of the codebase.
- **sql:** This subfolder likely contains SQL script files or utilities related to SQL.
- **adminUtils.ts:** Utility functions specifically for admin-related tasks.
- **createTeacherAccount.ts:** A utility or script for creating teacher accounts, possibly for testing or seeding.
- **dateUtils.ts:** Utility functions for date manipulation and formatting.
- **exportUtils.ts:** Utilities for exporting data (e.g., to CSV, PDF).
- **juzAyahMapping.ts:** Utilities or data for mapping Juz (sections of the Quran) to Ayahs (verses).
- **juzMetadata.ts:** Contains metadata related to Juz of the Quran.
- **quranPageCalculation.ts:** Utilities for calculations related to Quran pages.
- **quranValidation.ts:** Functions for validating Quran-related data (e.g., surah numbers, ayah numbers).
- **roleUtils.ts:** Utility functions related to user roles and permissions.
- **seedDatabase.ts:** A script or utility for seeding the database with initial or test data.
- **stringUtils.ts:** Utility functions for string manipulation.


