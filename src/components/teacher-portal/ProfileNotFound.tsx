import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card.tsx";
import { RefreshCcw, UserPlus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

interface ProfileNotFoundProps {
  email?: string;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export const ProfileNotFound = ({ email, onRefresh, isAdmin = false }: ProfileNotFoundProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const handleManualCheck = async () => {
    if (!email) {
      toast({
        title: "No email provided",
        description: "Cannot check for a profile without an email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsChecking(true);
    
    try {
      // Check if profile already exists
      const { data, error } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data && data.id) {
        // Profile exists, refresh the page to show it
        toast({
          title: "Profile found!",
          description: "Your teacher profile has been found. Refreshing...",
          variant: "default"
        });
        
        if (onRefresh) {
          onRefresh();
        } else {
          globalThis.location.reload();
        }
      } else {
        // Profile doesn't exist, show message
        toast({
          title: "No profile found",
          description: "No teacher profile was found with your email. Please create one.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error checking for profile:", error);
      toast({
        title: "Error checking profile",
        description: "There was a problem checking for your teacher profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateProfile = () => {
    setIsCreating(true);
    navigate('/create-teacher-profile');
  };
  
  return (
    <Card className="p-6 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold mb-4">Teacher Profile Not Found</h2>
      <p className="text-gray-600 mb-6">
        {email 
          ? `We couldn't find a teacher profile associated with your email (${email}). You need to create a teacher profile to access the teacher portal.`
          : "We couldn't find a teacher profile associated with your account. This portal is only for registered teachers."
        }
      </p>
      
      {isAdmin ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 w-full max-w-md">
          <p className="text-blue-800 text-sm">
            <strong>Admin Note:</strong> As an administrator, you can create a teacher profile for yourself to test the teacher portal features, 
            or you can go back to the admin dashboard where you can access all system features.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 w-full max-w-md">
          <p className="text-amber-800 text-sm">
            <strong>Note:</strong> Your user account has the teacher role, but requires a matching teacher profile in our database.
            Please create a teacher profile or contact an administrator for assistance.
          </p>
        </div>
      )}
      
      <div className="flex flex-col space-y-3 w-full max-w-xs">
        <Button 
          onClick={handleManualCheck}
          variant="default"
          disabled={isChecking || !email}
          className="w-full"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking..." : "Check for Profile"}
        </Button>
        
        <Button 
          onClick={handleCreateProfile}
          variant="default" 
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isCreating}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {isCreating ? "Redirecting..." : "Create Teacher Profile"}
        </Button>
        
        <Button 
          onClick={onRefresh} 
          variant="outline"
          disabled={isChecking || !onRefresh}
          className="w-full"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
        
        <Button 
          onClick={() => navigate(isAdmin ? '/admin' : '/')} 
          variant="outline" 
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isAdmin ? "Return to Admin Dashboard" : "Return to Dashboard"}
        </Button>
      </div>
    </Card>
  );
};
