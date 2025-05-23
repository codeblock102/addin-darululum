
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useRBAC } from '@/hooks/useRBAC';
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Index() {
  const { isAdmin, isTeacher, isLoading, error } = useRBAC();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  useEffect(() => {
    // Show fallback message after multiple failed attempts
    if (redirectAttempts > 5) {
      setShowFallbackMessage(true);
      
      // Show toast with error message
      if (error) {
        toast({
          title: "Authentication issue",
          description: "We're having trouble determining your role. Please try logging out and back in.",
          variant: "destructive"
        });
      }
    }
  }, [redirectAttempts, error]);

  useEffect(() => {
    // Increment redirect attempts counter when loading completes
    if (!isLoading) {
      setRedirectAttempts(prev => prev + 1);
    }
  }, [isLoading]);

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
      
      {showFallbackMessage && (
        <div className="mt-8 p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20 max-w-md">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-300">Having trouble?</h2>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            We're experiencing issues determining your role. Please try:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-red-600 dark:text-red-400">
            <li>Refreshing the page</li>
            <li>Logging out and logging back in</li>
            <li>Clearing your browser cache</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
