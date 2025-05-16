
import { useState } from "react";
import { createMuftiAmmarAccount } from "@/utils/createTeacherAccount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const CreateDemoAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      const result = await createMuftiAmmarAccount();
      setResult(result);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `Teacher account created for Mufti Ammar. Username: ${result.username}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToLogin = () => {
    navigate("/auth");
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Create Demo Account</CardTitle>
          <CardDescription>Create a demo teacher account for Mufti Ammar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Name:</strong> Mufti Ammar</p>
            <p><strong>Email:</strong> Ammarmulla21@gmail.com</p>
            <p><strong>Password:</strong> Ammarmulla2021</p>
            <p><strong>Username:</strong> mufti.ammar</p>
          </div>
          
          {result && (
            <div className={`p-4 rounded-md text-sm mt-4 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">{result.success ? 'Success!' : 'Error'}</p>
              <p>{result.success 
                ? `Teacher account created. Username: ${result.username}`
                : result.error}
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            
            <Button
              onClick={goToLogin}
              variant="outline"
              className="w-full"
            >
              Go to Login Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDemoAccount;
