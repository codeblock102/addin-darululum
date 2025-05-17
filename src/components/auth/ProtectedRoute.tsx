
import { useEffect } from "react";
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
    hasPermission 
  } = useRBAC();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isLoading = authLoading || rbacLoading;

  useEffect(() => {
    // Check if user is authenticated
    if (!isLoading && !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    // Check for required roles
    if (!isLoading && session) {
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
    }
    
    // Check for specific permissions if required
    if (requiredPermissions.length > 0 && !rbacLoading && session) {
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

  // Show content only if authenticated and has proper role/permissions
  if (session) {
    if (requireAdmin && !isAdmin) {
      return null;
    }
    
    if (requireTeacher && !isTeacher && !isAdmin) {
      return null;
    }
    
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
      if (!hasAllPermissions) {
        return null;
      }
    }
    
    return <>{children}</>;
  }
  
  return null;
};
