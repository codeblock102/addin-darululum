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
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { ProxyProvider } from "@/contexts/ProxyContext.tsx";
import Index from "@/pages/Index.tsx";
import NotFound from "@/pages/NotFound.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import Auth from "@/pages/Auth.tsx";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { DashboardLayout } from "@/components/layouts/DashboardLayout.tsx";
import ResetPassword from "@/pages/ResetPassword.tsx";

// Lazy-loaded heavy routes
const Students = lazy(() => import("@/pages/Students.tsx"));
const Teachers = lazy(() => import("@/pages/Teachers.tsx"));
const StudentDetail = lazy(() => import("@/pages/StudentDetail.tsx"));
const HifzReportCard = lazy(() => import("@/pages/HifzReportCard.tsx"));
const Classes = lazy(() => import("@/pages/Classes.tsx"));
const ProgressBook = lazy(() => import("@/pages/ProgressBook.tsx"));
const TeacherAccounts = lazy(() => import("@/pages/TeacherAccounts.tsx"));
const Attendance = lazy(() => import("@/pages/Attendance.tsx"));
const Settings = lazy(() => import("@/pages/Settings.tsx"));
const Preferences = lazy(() => import("@/pages/Preferences.tsx"));
const CreateDemoAccount = lazy(() => import("@/pages/dev/CreateDemoAccount.tsx"));
const CreateTeacherProfileForTestAccount = lazy(() => import("@/pages/dev/CreateTeacherProfileForTestAccount.tsx"));
const DatabaseSeeder = lazy(() => import("@/pages/dev/DatabaseSeeder.tsx"));
const TeacherSchedules = lazy(() => import("@/pages/admin/TeacherSchedules.tsx"));
const SetupAdmin = lazy(() => import("@/pages/admin/SetupAdmin.tsx"));
const ManualRoleSetup = lazy(() => import("@/pages/dev/ManualRoleSetup.tsx"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout.tsx"));
const AdminAccessDiagnostic = lazy(() => import("@/pages/dev/AdminAccessDiagnostic.tsx"));
const DevAdminManagement = lazy(() => import("@/pages/dev/DevAdminManagement.tsx"));
const TeacherSchedule = lazy(() => import("@/pages/TeacherSchedule.tsx"));
const Parent = lazy(() => import("@/pages/Parent.tsx"));
const ParentProgress = lazy(() => import("@/pages/ParentProgress.tsx"));
const ParentAcademics = lazy(() => import("@/pages/ParentAcademics.tsx"));
const ParentAgenda = lazy(() => import("@/pages/ParentAgenda.tsx"));
const ParentAttendance = lazy(() => import("@/pages/ParentAttendance.tsx"));
const ParentAccounts = lazy(() => import("@/pages/admin/ParentAccounts.tsx"));
const BulkStudentImport = lazy(() => import("@/pages/admin/BulkStudentImport.tsx"));
const Activity = lazy(() => import("@/pages/admin/Activity.tsx"));
const CommunicationTemplates = lazy(() => import("@/pages/admin/CommunicationTemplates.tsx"));
const Reports = lazy(() => import("@/pages/admin/Reports.tsx"));
const SchoolCalendar = lazy(() => import("@/pages/SchoolCalendar.tsx"));
const TeacherAddParent = lazy(() => import("@/pages/TeacherAddParent.tsx"));
const TeacherMessages = lazy(() => import("@/pages/TeacherMessages.tsx"));
const ParentMessages = lazy(() => import("@/pages/ParentMessages.tsx"));
const Profile = lazy(() => import("@/pages/Profile.tsx"));
const Tasks = lazy(() => import("@/pages/Tasks.tsx"));
const AbsenceRequests = lazy(() => import("@/pages/AbsenceRequests.tsx"));

const RouteSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse h-8 w-8 rounded-full bg-brand/30" />
  </div>
);

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
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ProxyProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/create-demo-account" element={<ProtectedRoute requireAdmin><CreateDemoAccount /></ProtectedRoute>} />
          <Route path="/create-teacher-profile" element={<ProtectedRoute requireAdmin><CreateTeacherProfileForTestAccount /></ProtectedRoute>} />
          <Route path="/admin-diagnostic" element={<ProtectedRoute requireAdmin><AdminAccessDiagnostic /></ProtectedRoute>} />
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
            <Route path="bulk-student-import" element={<BulkStudentImport />} />
            <Route path="teacher-schedules" element={<TeacherSchedules />} />
          </Route>
          {/* Admin pages served inside DashboardLayout (main sidebar) */}
          <Route
            path="/admin/communication-templates"
            element={
              <ProtectedRoute requireAdmin>
                <DashboardLayout>
                  <CommunicationTemplates />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Admin Activity in main sidebar (not inside Admin Panel) */}
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Activity />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/absence-requests"
            element={
              <ProtectedRoute requireAdmin>
                <DashboardLayout>
                  <AbsenceRequests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

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
            <Route
              path="/parent/agenda"
              element={
                <ProtectedRoute requireParent>
                  <ParentAgenda />
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
            <Route path="/students/:id/report-card" element={<HifzReportCard />} />
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
            <Route path="/add-parent" element={<ProtectedRoute requireTeacher><TeacherAddParent /></ProtectedRoute>} />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute requireTeacher>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute requireTeacher>
                  <TeacherMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/messages"
              element={
                <ProtectedRoute requireParent>
                  <ParentMessages />
                </ProtectedRoute>
              }
            />
            <Route path="/schedule" element={<TeacherSchedule />} />
            <Route path="/calendar" element={<SchoolCalendar />} />
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
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute requireAdmin>
                  <Tasks />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ProxyProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
