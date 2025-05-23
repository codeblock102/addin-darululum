
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useRBAC } from '@/hooks/useRBAC';
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { isAdmin, isTeacher, isLoading } = useRBAC();
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only navigate after loading is complete
    if (isLoading) return;

    if (!session) {
      // If not logged in, redirect to auth page
      console.log("No session, redirecting to auth");
      navigate('/auth');
      return;
    }
    
    console.log("Role check on Index page: isAdmin=", isAdmin, "isTeacher=", isTeacher);
    
    // Be explicit about the admin check to ensure proper redirection
    if (isAdmin) {
      console.log("User is admin, redirecting to admin dashboard");
      navigate('/admin');
    } else if (isTeacher) {
      console.log("User is teacher, redirecting to teacher portal");
      navigate('/teacher-portal');
    } else {
      // Default fallback for other roles
      console.log("No specific role portal available, redirecting to auth");
      navigate('/auth');
    }
  }, [isAdmin, isTeacher, isLoading, session, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-medium mb-2">Loading your dashboard...</h1>
        <p className="text-muted-foreground">Please wait while we determine your role.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="animate-pulse">
        <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-primary animate-spin mb-4 mx-auto"></div>
      </div>
      <h1 className="text-2xl font-medium mb-2">Redirecting to your dashboard...</h1>
      <p className="text-muted-foreground">Please wait while we determine your role.</p>
    </div>
  );
}
