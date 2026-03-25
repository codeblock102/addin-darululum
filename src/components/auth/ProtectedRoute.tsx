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
  requireParent?: boolean;
  requireAttendanceTaker?: boolean;
  requiredPermissions?: RolePermission[];
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireTeacher = false,
  requireParent = false,
  requireAttendanceTaker = false,
  requiredPermissions = [],
}: ProtectedRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const {
    isAdmin,
    isTeacher,
    isAttendanceTaker,
    isParent,
    isLoading: rbacLoading,
    hasPermission,
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
        setTimeoutReached(true);
        toast({
          title: "Session check timed out",
          description: "Please log in again.",
          variant: "destructive",
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
      navigate("/auth");
      return;
    }

    // Prevent infinite redirect loop
    if (redirectCount >= 3) {
      return;
    }

    // Check for required roles
    if (requireAdmin && !isAdmin) {
      setRedirectCount((prev) => prev + 1);
      toast({
        title: "Access Denied",
        description: "This area requires administrator privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (requireTeacher && !isTeacher && !isAdmin) {
      setRedirectCount((prev) => prev + 1);
      toast({
        title: "Access Denied",
        description: "This area requires teacher privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (requireAttendanceTaker && !isAttendanceTaker && !isAdmin) {
      setRedirectCount((prev) => prev + 1);
      toast({
        title: "Access Denied",
        description: "This area requires attendance taker privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (requireParent && !isParent && !isAdmin) {
      setRedirectCount((prev) => prev + 1);
      toast({
        title: "Access Denied",
        description: "This area requires parent privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // If RBAC timed out, send to login rather than granting uncertain access
    if (timeoutReached) {
      navigate("/auth");
      return;
    }

    // Only do detailed permission check if we have reliable role information and permissions are required
    if (requiredPermissions.length > 0 && !rbacLoading) {
      try {
        const hasAllPermissions = requiredPermissions.every((permission) =>
          hasPermission(permission)
        );

        if (!hasAllPermissions) {
          setRedirectCount((prev) => prev + 1);
          toast({
            title: "Permission Denied",
            description:
              "You don't have the necessary permissions to access this feature",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        // Continue with limited access
      }
    }
  }, [
    session,
    isLoading,
    isAdmin,
    isTeacher,
    isParent,
    rbacLoading,
    requireAdmin,
    requireTeacher,
    requireParent,
    requiredPermissions,
    navigate,
    toast,
    hasPermission,
    timeoutReached,
    redirectCount,
  ]);

  if (isLoading && !timeoutReached) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="mb-4 text-muted-foreground">Checking permissions...</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/auth")}
        >
          Go to login page
        </Button>
      </div>
    );
  }

  // If we've done all checks, render the children
  return <>{children}</>;
};
