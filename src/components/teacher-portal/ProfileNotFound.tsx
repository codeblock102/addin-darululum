
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ProfileNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Teacher Profile Not Found</h2>
      <p className="text-gray-600 mb-6">
        We couldn't find a teacher profile associated with your account. This portal is only for registered teachers.
      </p>
      <div className="space-x-4">
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Dashboard
        </Button>
        <Button onClick={() => navigate('/auth')} variant="default">
          Sign in with a Different Account
        </Button>
      </div>
    </div>
  );
};
