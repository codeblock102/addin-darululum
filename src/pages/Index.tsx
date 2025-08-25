import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useAuth } from "@/hooks/use-auth.ts";

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const { session } = useAuth();

  // Function to check if the user's email is associated with a teacher or parent profile
  const checkTeacherProfile = useCallback(async (email: string | undefined) => {
    if (!email) {
      setIsLoading(false);
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client.ts");
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .eq("role", "teacher")
        .maybeSingle();

      if (data) {
        console.log("Found teacher profile, redirecting");
        localStorage.setItem("userRole", "teacher");
        navigate("/teacher-portal");
      } else {
        // Check for parent via parent_teachers by auth id (requires session)
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        const { data: parentData } = uid
          ? await supabase.from("parent_teachers").select("id").eq("id", uid).maybeSingle()
          : { data: null } as any;
        if (parentData?.id) {
          console.log("Found parent profile, redirecting");
          localStorage.setItem("userRole", "parent");
          navigate("/parent");
        } else {
          // No specific role found, show the dashboard navigation options
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error checking teacher profile:", error);
      setIsLoading(false);
      setErrorOccurred(true);
    }
  }, [navigate]);

  useEffect(() => {
    // Set a maximum timeout for the loading state (even shorter timeout)
    const timeoutId = setTimeout(() => {
      console.log("Timeout reached, showing escape options");
      setIsLoading(false);
      setErrorOccurred(true);
    }, 1000); // 1 second timeout for better UX

    // Direct access to auth page - should always be immediately available
    const authPath = globalThis.location.pathname;
    if (authPath === "/auth") {
      console.log("On auth page, clearing timeout");
      setIsLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    // If the user is logged in, check their role and redirect accordingly
    if (session) {
      // Check user metadata for admin role (fastest)
      const isAdmin = session.user.user_metadata?.role === "admin";

      if (isAdmin) {
        console.log("User is admin based on metadata, redirecting");
        localStorage.setItem("userRole", "admin");
        navigate("/dashboard");
        clearTimeout(timeoutId);
        return;
      }
      // Try to redirect based on local storage role if available
      const role = localStorage.getItem("userRole");
      if (role === "admin") {
        console.log("Found admin role in localStorage, redirecting");
        navigate("/dashboard");
        clearTimeout(timeoutId);
        return;
      } else if (role === "teacher") {
        console.log("Found teacher role in localStorage, redirecting");
        navigate("/teacher-portal");
        clearTimeout(timeoutId);
        return;
      } else if (role === "parent") {
        console.log("Found parent role in localStorage, redirecting");
        navigate("/parent");
        clearTimeout(timeoutId);
        return;
      } else {
        // If no role found but user is logged in, check email for teacher profile
        // This could be a first-time login or cache was cleared
        checkTeacherProfile(session.user.email);
      }
    } else {
      // If user is not logged in, redirect to auth page
      console.log("No session detected, redirecting to auth");
      navigate("/auth");
      clearTimeout(timeoutId);
      return;
    }

    // Clean up timeout on component unmount
    return () => clearTimeout(timeoutId);
  }, [navigate, session, checkTeacherProfile]);

  const handleGoToAuth = () => {
    navigate("/auth");
  };

  const handleGoToAdmin = () => {
    localStorage.setItem("userRole", "admin");
    navigate("/admin");
  };

  const handleGoToTeacher = () => {
    localStorage.setItem("userRole", "teacher");
    navigate("/teacher-portal");
  };

  const handleRefresh = () => {
    globalThis.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {isLoading
        ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-medium mb-2">
              Loading your dashboard...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we determine your role.
            </p>
            <Button
              variant="link"
              onClick={handleGoToAuth}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Click here to login
            </Button>
          </>
        )
        : (
          <div className="max-w-md w-full space-y-6 p-6 bg-card border rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center">
              Dashboard Navigation
            </h1>

            {errorOccurred && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4 dark:bg-amber-900/20 dark:border-amber-800">
                <h2 className="font-semibold text-amber-800 dark:text-amber-300">
                  System Notice
                </h2>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  We're experiencing issues with role determination. Please use
                  one of the options below to continue.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleGoToAuth}
                className="w-full bg-primary text-primary-foreground"
              >
                Go to Login Page
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or access portal directly
                  </span>
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
