import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ManualRoleSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher'>('admin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  // Get current user info for display
  const [userInfo, setUserInfo] = useState<{email: string, metadata: any} | null>(null);
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserInfo({
          email: user.email || 'Unknown Email',
          metadata: user.user_metadata || {}
        });
      }
    };
    fetchUserInfo();
  }, []);

  const handleRoleSetup = async () => {
    setIsLoading(true);
    
    try {
      // Direct call to updateUser using Supabase JS client
      console.log(`Setting user role to: ${selectedRole}`);
      
      const updateResponse = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });
      
      console.log("Update response:", updateResponse);
      
      if (updateResponse.error) {
        throw new Error(`Failed to update user metadata: ${updateResponse.error.message}`);
      }
      
      // Also set in localStorage for immediate use
      localStorage.setItem('userRole', selectedRole);
      
      // Force a session refresh to ensure the auth context has the latest data
      await refreshSession();
      
      toast({
        title: "Role Setup Complete",
        description: `Your account has been set up as a ${selectedRole}. You will be redirected to the ${selectedRole} dashboard.`,
      });
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate(selectedRole === 'admin' ? "/admin" : "/teacher-portal");
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up role:", error);
      toast({
        title: "Setup Failed",
        description: error.message || "An unexpected error occurred while setting up your role.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manual Role Setup</CardTitle>
          <CardDescription>
            Set your account role manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userInfo && (
            <div className="mb-6 text-sm">
              <p><strong>Current User:</strong> {userInfo.email}</p>
              <p><strong>Current Metadata:</strong> {JSON.stringify(userInfo.metadata)}</p>
            </div>
          )}
        
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Select Your Role</h3>
              <p className="text-sm text-gray-500">Choose the role you want to assign to your account</p>
            </div>
            
            <RadioGroup 
              value={selectedRole} 
              onValueChange={(value) => setSelectedRole(value as 'admin' | 'teacher')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="font-medium">Administrator</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher" className="font-medium">Teacher</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRoleSetup} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up role...
              </>
            ) : (
              "Set Up Role"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 