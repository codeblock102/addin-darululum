
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
  requiredPermissions?: RolePermission[];
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requiredPermissions = [] 
}: ProtectedRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const { 
    isAdmin, 
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
    
    // Check for admin role if required
    if (requireAdmin && !rbacLoading && !isAdmin && session) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this area",
        variant: "destructive"
      });
      navigate("/");
      return;
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
  }, [session, isLoading, isAdmin, rbacLoading, requireAdmin, requiredPermissions, navigate, toast, hasPermission]);

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
