
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { RefreshCcw, UserPlus } from "lucide-react";

interface ProfileNotFoundProps {
  email?: string;
  onRefresh?: () => void;
}

export const ProfileNotFound = ({ email, onRefresh }: ProfileNotFoundProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold mb-4">Teacher Profile Not Found</h2>
      <p className="text-gray-600 mb-6">
        {email 
          ? `We couldn't find a teacher profile associated with your email (${email}). You need to create a teacher profile to access the teacher portal.`
          : "We couldn't find a teacher profile associated with your account. This portal is only for registered teachers."
        }
      </p>
      <div className="space-x-4 space-y-3">
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Dashboard
        </Button>
        {onRefresh ? (
          <Button onClick={onRefresh} variant="default">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        ) : (
          <Button onClick={() => navigate('/auth')} variant="default">
            Sign in with a Different Account
          </Button>
        )}
        <div className="pt-2">
          <Button asChild variant="link">
            <Link to="/create-teacher-profile" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Teacher Profile
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};
