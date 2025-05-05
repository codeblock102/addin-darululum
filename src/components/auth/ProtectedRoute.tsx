
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuth();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // First check for authentication
    if (!isLoading && !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    // Then check for admin role if required
    if (requireAdmin && !isRoleLoading && !isAdmin && session) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this area",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [session, isLoading, isAdmin, isRoleLoading, requireAdmin, navigate, toast]);

  if (isLoading || (requireAdmin && isRoleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show content only if authenticated and has proper role
  if (session && (!requireAdmin || isAdmin)) {
    return <>{children}</>;
  }
  
  return null;
};
