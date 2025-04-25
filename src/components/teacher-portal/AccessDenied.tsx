import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
export const AccessDenied = () => {
  const navigate = useNavigate();
  return <Card className="border-destructive">
      <CardHeader className="bg-red-800">
        <CardTitle className="flex items-center text-destructive">
          <Lock className="h-5 w-5 mr-2" />
          Access Restricted
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <p>
            You don't have permission to access the Teacher Portal. This area is reserved for registered teachers only.
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe you should have access, please contact the system administrator.
          </p>
          <div className="flex space-x-4 pt-2">
            <Button onClick={() => navigate('/')} variant="outline" className="bg-slate-800 hover:bg-slate-700">
              Return to Dashboard
            </Button>
            <Button onClick={() => navigate('/auth')} variant="default">
              Sign in with Another Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};