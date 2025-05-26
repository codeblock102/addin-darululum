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
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import StudentDetail from "@/pages/StudentDetail";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Progress from "@/pages/Progress";
import ProgressBook from "@/pages/ProgressBook";
import Schedule from "@/pages/Schedule";
import Attendance from "@/pages/Attendance";
import StudentProgress from "@/pages/StudentProgress";
import TeacherAccounts from "@/pages/TeacherAccounts";
import Auth from "@/pages/Auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Settings from "@/pages/Settings";
import Preferences from "@/pages/Preferences";
import CreateDemoAccount from "@/pages/CreateDemoAccount";
import CreateTeacherProfileForTestAccount from "@/pages/CreateTeacherProfileForTestAccount";
import DatabaseSeeder from "@/pages/admin/DatabaseSeeder";
import SetupAdmin from "@/pages/admin/SetupAdmin";
import ManualRoleSetup from "@/pages/admin/ManualRoleSetup";

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/create-demo-account" element={<CreateDemoAccount />} />
          <Route path="/create-teacher-profile" element={<CreateTeacherProfileForTestAccount />} />
          <Route path="/admin/setup" element={<SetupAdmin />} />
          <Route path="/role-setup" element={<ManualRoleSetup />} />
          
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
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
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <Classes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress-book"
            element={
              <ProtectedRoute>
                <ProgressBook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-progress"
            element={
              <ProtectedRoute>
                <StudentProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-accounts"
            element={
              <ProtectedRoute requireAdmin>
                <TeacherAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/database-seeder"
            element={
              <ProtectedRoute requireAdmin>
                <DatabaseSeeder />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
