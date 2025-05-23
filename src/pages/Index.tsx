
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    // Set a maximum timeout for the loading state (shorter timeout)
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached, showing escape options");
      setIsLoading(false);
      setErrorOccurred(true);
    }, 2000); // 2 seconds timeout for better UX

    // Try to redirect based on local storage role if available
    const role = localStorage.getItem('userRole');
    if (role === 'admin') {
      console.log("Found admin role in localStorage, redirecting");
      navigate('/admin');
      clearTimeout(timeoutId);
      return;
    } else if (role === 'teacher') {
      console.log("Found teacher role in localStorage, redirecting");
      navigate('/teacher-portal');
      clearTimeout(timeoutId);
      return;
    }

    // Clean up timeout on component unmount
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  const handleGoToAdmin = () => {
    localStorage.setItem('userRole', 'admin');
    navigate('/admin');
  };
  
  const handleGoToTeacher = () => {
    localStorage.setItem('userRole', 'teacher');
    navigate('/teacher-portal');
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {isLoading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-medium mb-2">Loading your dashboard...</h1>
          <p className="text-muted-foreground">Please wait while we determine your role.</p>
          <Button 
            variant="link" 
            onClick={handleGoToAuth}
            className="mt-4"
          >
            Click here if loading takes too long
          </Button>
        </>
      ) : (
        <div className="max-w-md w-full space-y-6 p-6 bg-card border rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center">Dashboard Navigation</h1>
          
          {errorOccurred && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4 dark:bg-amber-900/20 dark:border-amber-800">
              <h2 className="font-semibold text-amber-800 dark:text-amber-300">System Notice</h2>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                We're experiencing issues with role determination. Please use one of the options below to continue.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={handleGoToAuth} 
              className="w-full" 
              variant="outline"
            >
              Go to Login Page
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or access portal directly</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGoToAdmin} 
              className="w-full"
            >
              Go to Admin Dashboard
            </Button>
            
            <Button 
              onClick={handleGoToTeacher} 
              variant="secondary"
              className="w-full"
            >
              Go to Teacher Portal
            </Button>
            
            <Button 
              onClick={handleRefresh} 
              variant="ghost"
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
