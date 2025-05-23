
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
    if (isLoading) {
      console.log("RBAC is still loading, waiting...");
      return;
    }

    if (!session) {
      // If not logged in, redirect to auth page
      console.log("No session, redirecting to auth");
      navigate('/auth');
      return;
    }
    
    console.log("Role check on Index page: isAdmin=", isAdmin, "isTeacher=", isTeacher);
    
    // Add a more robust check to ensure we only redirect when we have definitive role information
    if (isAdmin === true) {
      console.log("User is admin, redirecting to admin dashboard");
      navigate('/admin');
      return;
    } 
    
    if (isTeacher === true) {
      console.log("User is teacher, redirecting to teacher portal");
      navigate('/teacher-portal');
      return;
    }

    // Only redirect to auth if we've completed the role check and found no roles
    if (!isAdmin && !isTeacher && !isLoading) {
      console.log("No specific role portal available, redirecting to auth");
      navigate('/auth');
    }
  }, [isAdmin, isTeacher, isLoading, session, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-medium mb-2">Loading your dashboard...</h1>
      <p className="text-muted-foreground">Please wait while we determine your role.</p>
      {isLoading && <p className="text-sm text-muted-foreground mt-2">Checking your permissions...</p>}
      {!isLoading && <p className="text-sm text-muted-foreground mt-2">Redirecting to the appropriate dashboard...</p>}
    </div>
  );
}
