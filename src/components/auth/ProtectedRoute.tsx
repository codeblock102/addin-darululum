
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import { useToast } from "@/components/ui/use-toast";
import { RolePermission } from "@/utils/roleUtils";

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
    hasPermission,
    error
  } = useRBAC();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissionChecked, setPermissionChecked] = useState(false);
  
  const isLoading = authLoading || rbacLoading;

  useEffect(() => {
    // Set up timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!permissionChecked) {
        console.warn("Permission check timed out after 8 seconds");
        setPermissionChecked(true);
        
        // Show error toast
        if (error) {
          toast({
            title: "Permission check failed",
            description: "Failed to verify your permissions. You may have limited access.",
            variant: "destructive"
          });
        }
      }
    }, 8000);
    
    return () => clearTimeout(timeoutId);
  }, [error, permissionChecked, toast]);

  useEffect(() => {
    // Only redirect after loading is complete
    if (isLoading) return;
    
    // Mark permissions as checked
    setPermissionChecked(true);
    
    // Check if user is authenticated
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    // Check for required roles
    if (requireAdmin && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "This area requires administrator privileges",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    if (requireTeacher && !isTeacher && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "This area requires teacher privileges",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // Check for specific permissions if required
    // Only do this check if we have role information
    if (requiredPermissions.length > 0 && !rbacLoading) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
      
      if (!hasAllPermissions) {
        toast({
          title: "Permission Denied",
          description: "You don't have the necessary permissions to access this feature",
          variant: "destructive"
        });
        navigate("/");
      }
    }
  }, [session, isLoading, isAdmin, isTeacher, rbacLoading, requireAdmin, requireTeacher, requiredPermissions, navigate, toast, hasPermission]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we've done all checks and still not redirected, render the children
  return <>{children}</>;
};
