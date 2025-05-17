
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { RefreshCcw, UserPlus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileNotFoundProps {
  email?: string;
  onRefresh?: () => void;
}

export const ProfileNotFound = ({ email, onRefresh }: ProfileNotFoundProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  
  const handleManualCheck = async () => {
    if (!email) return;
    
    setIsChecking(true);
    
    try {
      // Check if profile already exists
      const { data, error } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (data && !error) {
        // Profile exists, refresh the page to show it
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        // Profile doesn't exist, navigate to create profile page
        navigate('/create-teacher-profile');
      }
    } catch (error) {
      console.error("Error checking for profile:", error);
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
        
        {onRefresh ? (
          <Button 
            onClick={onRefresh} 
            variant="default"
            disabled={isChecking}
            className="w-full"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {isChecking ? "Checking..." : "Refresh"}
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/auth')} 
            variant="default"
            className="w-full"
          >
            Sign in with a Different Account
          </Button>
        )}
        
        <Button 
          onClick={handleManualCheck}
          variant="default"
          disabled={isChecking || !email}
          className="w-full"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          {isChecking ? "Checking..." : "Check for Profile"}
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
