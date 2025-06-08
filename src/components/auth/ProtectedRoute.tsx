import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { Loader2 } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { RolePermission } from "@/utils/roleUtils.ts";
import { Button } from "@/components/ui/button.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requiredPermissions?: RolePermission[];
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireTeacher = false,
  requiredPermissions = [] 
}: ProtectedRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const { 
    isAdmin, 
    isTeacher,
    isLoading: rbacLoading, 
    hasPermission
  } = useRBAC();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [redirectCount, setRedirectCount] = useState(0);
  
  const isLoading = authLoading || (rbacLoading && !timeoutReached);

  useEffect(() => {
    // Set up timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!permissionChecked) {
        console.warn("Permission check timed out after 3 seconds");
        setTimeoutReached(true);
        
        // Show error toast
        toast({
          title: "Permission check timeout",
          description: "We'll continue with limited access. Please contact support if you experience issues.",
          variant: "destructive"
        });
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [permissionChecked, toast]);

  useEffect(() => {
    // Only redirect after loading is complete or timeout is reached
    if (isLoading && !timeoutReached) return;
    
    // Mark permissions as checked
    setPermissionChecked(true);
    
    // Check if user is authenticated
    if (!session) {
      console.log("No session detected, redirecting to auth");
      navigate("/auth");
      return;
    }

    // Prevent infinite redirect loop
    if (redirectCount >= 3) {
      console.log("Too many redirects, allowing access to prevent loop");
      return;
    }
    
    // Store role in localStorage for recovery in case of RBAC issues
    if (isAdmin) {
      localStorage.setItem('userRole', 'admin');
      setRedirectCount(0); // Reset redirect count on successful role determination
    }
    else if (isTeacher) {
      localStorage.setItem('userRole', 'teacher');
      setRedirectCount(0); // Reset redirect count on successful role determination
    }
    
    // Check for required roles
    if (requireAdmin && !isAdmin) {
      console.log("Admin access required but not admin, redirecting");
      setRedirectCount(prev => prev + 1);
      toast({
        title: "Access Denied",
        description: "This area requires administrator privileges",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    if (requireTeacher && !isTeacher && !isAdmin) {
      console.log("Teacher access required but not teacher or admin, redirecting");
      setRedirectCount(prev => prev + 1);
      toast({
        title: "Access Denied",
        description: "This area requires teacher privileges",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // We're bypassing detailed permission checks if we've hit the timeout
    if (timeoutReached) {
      console.log("Timeout reached - bypassing detailed permission checks");
      return;
    }
    
    // Only do detailed permission check if we have reliable role information and permissions are required
    if (requiredPermissions.length > 0 && !rbacLoading) {
      try {
        const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
        
        if (!hasAllPermissions) {
          setRedirectCount(prev => prev + 1);
          toast({
            title: "Permission Denied",
            description: "You don't have the necessary permissions to access this feature",
            variant: "destructive"
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        // Continue with limited access
      }
    }
  }, [session, isLoading, isAdmin, isTeacher, rbacLoading, requireAdmin, requireTeacher, 
      requiredPermissions, navigate, toast, hasPermission, timeoutReached, redirectCount]);

  if (isLoading && !timeoutReached) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="mb-4 text-muted-foreground">Checking permissions...</p>
        <div className="flex flex-col gap-2">
          <Button 
            variant="link" 
            onClick={() => setTimeoutReached(true)}
          >
            Continue with limited access
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              localStorage.removeItem('userRole');
              navigate('/auth');
            }}
          >
            Go to login page
          </Button>
        </div>
      </div>
    );
  }

  // If we've done all checks or hit timeout, render the children
  return <>{children}</>;
};
