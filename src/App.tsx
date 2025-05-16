
import { AuthProvider } from '@/contexts/AuthContext';
import Attendance from '@/pages/Attendance';
import Classes from '@/pages/Classes';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Preferences from '@/pages/Preferences';
import DhorBook from '@/pages/DhorBook';
import Schedule from '@/pages/Schedule';
import Settings from '@/pages/Settings';
import Students from '@/pages/Students';
import Teachers from '@/pages/Teachers';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import StudentProgressPage from './pages/StudentProgress';
import TeacherPortal from './pages/TeacherPortal';
import Auth from './pages/Auth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AdminDashboard from './pages/admin/Dashboard';
import CreateDemoAccount from './pages/CreateDemoAccount';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/create-demo-account" element={<CreateDemoAccount />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/teacher-portal" element={
                <ProtectedRoute>
                  <TeacherPortal />
                </ProtectedRoute>
              } />
              <Route path="/teachers" element={
                <ProtectedRoute requireAdmin={true}>
                  <Teachers />
                </ProtectedRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute>
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="/classes" element={
                <ProtectedRoute>
                  <Classes />
                </ProtectedRoute>
              } />
              <Route path="/dhor-book" element={
                <ProtectedRoute>
                  <DhorBook />
                </ProtectedRoute>
              } />
              <Route path="/schedule" element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute>
                  <Attendance />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/student-progress/:studentId" element={
                <ProtectedRoute>
                  <StudentProgressPage />
                </ProtectedRoute>
              } />
              <Route path="/preferences" element={
                <ProtectedRoute>
                  <Preferences />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
