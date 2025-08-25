/**
 * @file src/App.tsx
 * @summary This is the main application component that sets up the overall structure, routing, and global providers.
 *
 * It initializes the `ThemeProvider` for managing UI themes (light/dark mode) and the `BrowserRouter` from `react-router-dom`
 * to handle client-side navigation. The core of this component is the `<Routes>` block, which defines all
 * the application paths and maps them to their respective page components.
 *
 * Several routes are wrapped with the `ProtectedRoute` component to ensure that users are authenticated
 * (and in some cases, have admin privileges) before accessing certain pages.
 *
 * It also includes the `<Toaster>` component, which is used to display toast notifications globally throughout the application.
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import Index from "@/pages/Index.tsx";
import NotFound from "@/pages/NotFound.tsx";
import Students from "@/pages/Students.tsx";
import Teachers from "@/pages/Teachers.tsx";
import StudentDetail from "@/pages/StudentDetail.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import Classes from "@/pages/Classes.tsx";
import ProgressBook from "@/pages/ProgressBook.tsx";
import TeacherAccounts from "@/pages/TeacherAccounts.tsx";
import Auth from "@/pages/Auth.tsx";
import Attendance from "@/pages/Attendance.tsx";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { DashboardLayout } from "@/components/layouts/DashboardLayout.tsx";
import Settings from "@/pages/Settings.tsx";
import Preferences from "@/pages/Preferences.tsx";
import CreateDemoAccount from "@/pages/CreateDemoAccount.tsx";
import CreateTeacherProfileForTestAccount from "@/pages/CreateTeacherProfileForTestAccount.tsx";
import DatabaseSeeder from "@/pages/admin/DatabaseSeeder.tsx";
import SetupAdmin from "@/pages/admin/SetupAdmin.tsx";
import ManualRoleSetup from "@/pages/admin/ManualRoleSetup.tsx";
import AdminLayout from "@/pages/admin/AdminLayout.tsx";
import AdminAccessDiagnostic from "@/pages/admin/AdminAccessDiagnostic.tsx";
import DevAdminManagement from "@/pages/DevAdminManagement.tsx";
import TeacherSchedule from "@/pages/TeacherSchedule.tsx";
import Parent from "@/pages/Parent.tsx";
import ParentProgress from "@/pages/ParentProgress.tsx";
import ParentAcademics from "@/pages/ParentAcademics.tsx";
import ParentAttendance from "@/pages/ParentAttendance.tsx";
import ParentAccounts from "@/pages/admin/ParentAccounts.tsx";
import ResetPassword from "@/pages/ResetPassword.tsx";

/**
 * @component App
 * @description The root component of the application.
 *
 * Sets up the main application providers:
 *  - `ThemeProvider`: For managing application-wide theming (e.g., light/dark mode).
 *    It uses `localStorage` (via `storageKey="vite-ui-theme"`) to persist the selected theme.
 *  - `BrowserRouter`: Enables client-side routing for the single-page application.
 *
 * Defines all application routes using `react-router-dom`:
 *  - Public routes like `/`, `/auth`, `/create-demo-account`.
 *  - Admin-specific setup routes like `/admin/setup`, `/role-setup`.
 *  - Protected routes (requiring authentication) for core application features like
 *    `/students`, `/dashboard`, `/classes`, `/progress-book`, etc.
 *  - Some protected routes also require admin privileges (e.g., `/teachers`, `/teacher-accounts`).
 *  - A catch-all route `*` maps to the `NotFound` page for any undefined paths.
 *
 * Also renders the `<Toaster />` component at the root level, allowing any part of the application
 * to trigger and display toast notifications.
 *
 * @returns {JSX.Element} The main application structure with configured routes and providers.
 */
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/create-demo-account" element={<CreateDemoAccount />} />
          <Route path="/create-teacher-profile" element={<CreateTeacherProfileForTestAccount />} />
          <Route path="/admin-diagnostic" element={<AdminAccessDiagnostic />} />
          <Route path="*" element={<NotFound />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="setup" replace />} />
            <Route path="setup" element={<SetupAdmin />} />
            <Route path="roles" element={<ManualRoleSetup />} />
            <Route path="seeder" element={<DatabaseSeeder />} />
            <Route path="admin-creator" element={<DevAdminManagement />} />
            <Route path="parent-accounts" element={<ParentAccounts />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/parent"
              element={
                <ProtectedRoute requireParent>
                  <Parent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/progress"
              element={
                <ProtectedRoute requireParent>
                  <ParentProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/academics"
              element={
                <ProtectedRoute requireParent>
                  <ParentAcademics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/attendance"
              element={
                <ProtectedRoute requireParent>
                  <ParentAttendance />
                </ProtectedRoute>
              }
            />
            {/* Redirect /teacher-portal to /dashboard for consistency */}
            <Route
              path="/teacher-portal"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute requireAdmin>
                  <Teachers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <ProtectedRoute requireAdmin>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/classes" element={<Classes />} />
            <Route path="/progress-book" element={<ProgressBook />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/schedule" element={<TeacherSchedule />} />
            <Route
              path="/teacher-accounts"
              element={
                <ProtectedRoute requireAdmin>
                  <TeacherAccounts />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/preferences" element={<Preferences />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
