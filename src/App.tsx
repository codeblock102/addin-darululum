
import { AuthProvider } from '@/components/auth/AuthProvider';
import Attendance from '@/pages/Attendance';
import Classes from '@/pages/Classes';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Preferences from '@/pages/preferences'; // Changed from @/pages/Preferences to match actual file casing
import Progress from '@/pages/Progress';
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/students" element={<Students />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/student-progress" element={<StudentProgressPage />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
