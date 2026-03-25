import { useEffect, useRef } from "react";
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

  // Use a ref so we only fire redirect + toast once per mount
  const hasRedirected = useRef(false);

  const isLoading = authLoading || rbacLoading;

  useEffect(() => {
    // Wait until both auth and RBAC are fully resolved
    if (isLoading) return;
    // Only redirect once — prevents double toasts on re-renders
    if (hasRedirected.current) return;

    if (!session) {
      hasRedirected.current = true;
      navigate("/auth");
      return;
    }

    if (requireAdmin && !isAdmin) {
      hasRedirected.current = true;
      toast({
        title: "Access Denied",
        description: "This area requires administrator privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (requireTeacher && !isTeacher && !isAdmin) {
      hasRedirected.current = true;
      toast({
        title: "Access Denied",
        description: "This area requires teacher privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (requireAttendanceTaker && !isAttendanceTaker && !isAdmin) {
      hasRedirected.current = true;
      toast({
        title: "Access Denied",
        description: "This area requires attendance taker privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (requireParent && !isParent && !isAdmin) {
      hasRedirected.current = true;
      toast({
        title: "Access Denied",
        description: "This area requires parent privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (requiredPermissions.length > 0) {
      try {
        const hasAllPermissions = requiredPermissions.every((permission) =>
          hasPermission(permission)
        );
        if (!hasAllPermissions) {
          hasRedirected.current = true;
          toast({
            title: "Permission Denied",
            description: "You don't have the necessary permissions to access this feature",
            variant: "destructive",
          });
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    }
  }, [
    session,
    isLoading,
    isAdmin,
    isTeacher,
    isParent,
    isAttendanceTaker,
    requireAdmin,
    requireTeacher,
    requireParent,
    requireAttendanceTaker,
    requiredPermissions,
    navigate,
    toast,
    hasPermission,
  ]);

  if (isLoading) {
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

  return <>{children}</>;
};
