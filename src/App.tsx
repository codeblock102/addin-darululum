import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import StudentDetail from "@/pages/StudentDetail";
import TeacherPortal from "@/pages/TeacherPortal";
import Classes from "@/pages/Classes";
import Progress from "@/pages/Progress";
import DhorBook from "@/pages/DhorBook";
import Schedule from "@/pages/Schedule";
import Attendance from "@/pages/Attendance";
import StudentProgress from "@/pages/StudentProgress";
import TeacherAccounts from "@/pages/TeacherAccounts";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/admin/Dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Settings from "@/pages/Settings";
import Preferences from "@/pages/Preferences";
import CreateDemoAccount from "@/pages/CreateDemoAccount";
import CreateTeacherProfileForTestAccount from "@/pages/CreateTeacherProfileForTestAccount";
import DatabaseSeeder from "@/pages/admin/DatabaseSeeder";
import SetupAdmin from "@/pages/admin/SetupAdmin";
import ManualRoleSetup from "@/pages/admin/ManualRoleSetup";

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
            path="/teacher-portal"
            element={
              <ProtectedRoute requireTeacher>
                <TeacherPortal />
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
            path="/dhor-book"
            element={
              <ProtectedRoute>
                <DhorBook />
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
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
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
