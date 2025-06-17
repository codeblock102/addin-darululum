import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { Loader2 } from "lucide-react";
import { setupAdminAccount } from "@/utils/adminUtils.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export default function SetupAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    setIsLoading(true);

    try {
      // Get current user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.email) {
        throw new Error("Could not get current user's email");
      }

      const success = await setupAdminAccount(user.email);

      if (success) {
        toast({
          title: "Admin Setup Complete",
          description: "Your account has been set up as an admin. You will be redirected to the dashboard.",
        });

        // Wait a moment before redirecting
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        toast({
          title: "Setup Failed",
          description: "Failed to set up admin account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error setting up admin:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while setting up admin account.",
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
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Set up your account as an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will set your current account as an administrator. You will
            have access to all admin features after this setup.
          </p>
          <p className="text-sm text-muted-foreground">
            This process will:
            <ul className="list-disc list-inside mt-2">
              <li>Set your user role to admin in metadata</li>
              <li>Create necessary database entries</li>
              <li>Set up your admin profile</li>
            </ul>
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSetupAdmin}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up Admin...
                </>
              )
              : (
                "Set Up Admin Account"
              )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
