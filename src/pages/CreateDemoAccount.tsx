
import { useState } from "react";
import { createMuftiAmmarAccount, createNormalizedUsername } from "@/utils/createTeacherAccount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CreateDemoAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Pre-calculate the username that will be generated
  const demoName = "Mufti Ammar Mulla";
  const demoUsername = createNormalizedUsername(demoName);
  
  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      const result = await createMuftiAmmarAccount();
      setResult(result);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `Teacher account created for Mufti Ammar. Try logging in now.`,
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
          <CardDescription>Create a demo teacher account for Mufti Ammar Mulla</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Name:</strong> {demoName}</p>
            <p><strong>Email:</strong> Ammarmulla21@gmail.com</p>
            <p><strong>Password:</strong> Ammarmulla2021</p>
            <p><strong>Username:</strong> {demoUsername}</p>
            
            <Alert 
              variant="default" 
              className="bg-amber-50 text-amber-800 border-amber-200 mt-3"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important Login Information</AlertTitle>
              <AlertDescription className="text-sm mt-1">
                <p>After creating the account, you can log in using either:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Username: <span className="font-mono">{demoUsername}</span></li>
                  <li>Email: <span className="font-mono">Ammarmulla21@gmail.com</span></li>
                  <li>Password: <span className="font-mono">Ammarmulla2021</span></li>
                </ul>
                <p className="mt-2">
                  <strong>Note:</strong> If login fails, the email may need confirmation in the Supabase dashboard.
                </p>
              </AlertDescription>
            </Alert>
          </div>
          
          {result && (
            <Alert 
              variant={result.success ? "default" : "destructive"}
              className={`p-4 rounded-md text-sm mt-4 ${result.success ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
            >
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{result.success ? 'Success!' : 'Error'}</AlertTitle>
              <AlertDescription>
                {result.message || result.error || (result.success 
                  ? `Teacher account created. Try logging in now.`
                  : "Failed to create teacher account")}
              </AlertDescription>
            </Alert>
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
        <CardFooter className="flex justify-center">
          <p className="text-xs text-gray-500 text-center">
            This creates a demo account for testing purposes only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateDemoAccount;
