
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

export const AccessDenied = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        You don't have permission to access the teacher portal. This area is restricted to teacher accounts.
      </p>
      <div className="space-x-4">
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Dashboard
        </Button>
        <Button onClick={() => navigate('/auth')} variant="default">
          Sign in with a Different Account
        </Button>
      </div>
    </Card>
  );
};
