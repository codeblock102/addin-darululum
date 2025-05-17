
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { RefreshCcw, UserPlus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ProfileNotFoundProps {
  email?: string;
  onRefresh?: () => void;
}

export const ProfileNotFound = ({ email, onRefresh }: ProfileNotFoundProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
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
          window.location.reload();
        }
      } else {
        // Profile doesn't exist, navigate to create profile page
        toast({
          title: "No profile found",
          description: "No teacher profile was found. Redirecting to create one...",
          variant: "default"
        });
        navigate('/create-teacher-profile');
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
  
  return (
    <Card className="p-6 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold mb-4">Teacher Profile Not Found</h2>
      <p className="text-gray-600 mb-6">
        {email 
          ? `We couldn't find a teacher profile associated with your email (${email}). You need to create a teacher profile to access the teacher portal.`
          : "We couldn't find a teacher profile associated with your account. This portal is only for registered teachers."
        }
      </p>
      <div className="flex flex-col space-y-3 w-full max-w-xs">
        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
          Return to Dashboard
        </Button>
        
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
          onClick={onRefresh} 
          variant="outline"
          disabled={isChecking || !onRefresh}
          className="w-full"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
        
        <Button asChild variant="link" className="w-full">
          <Link to="/create-teacher-profile" className="flex items-center justify-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Teacher Profile
          </Link>
        </Button>
      </div>
    </Card>
  );
};
