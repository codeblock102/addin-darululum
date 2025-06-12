
import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";

interface UserInfo {
  email: string;
  metadata: Record<string, unknown>;
}

export default function ManualRoleSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "teacher">(
    "admin",
  );
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  // Get current user info for display
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserInfo({
          email: user.email || "Unknown Email",
          metadata: user.user_metadata || {},
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
        data: { role: selectedRole },
      });

      console.log("Update response:", updateResponse);

      if (updateResponse.error) {
        throw new Error(
          `Failed to update user metadata: ${updateResponse.error.message}`,
        );
      }

      // If the role is teacher, ensure a teacher record exists
      if (selectedRole === "teacher" && updateResponse.data.user?.email) {
        const userEmail = updateResponse.data.user.email;
        console.log(
          `Selected role is teacher. Checking/creating teacher record for ${userEmail}`,
        );

        const { data: existingTeacher, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", userEmail)
          .eq("role", "teacher")
          .maybeSingle();

        if (checkError) {
          console.error(
            "Error checking for existing teacher record:",
            checkError.message,
          );
          // Decide if this should be a fatal error or just a warning
        }

        if (!existingTeacher) {
          console.log(
            `No existing teacher record found for ${userEmail}. Creating one.`,
          );
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([{
              email: userEmail,
              name: userEmail, // Use email as name for now
              role: "teacher",
              subject: "To be determined", // Placeholder
              bio: "Profile to be completed.", // Placeholder for bio
              // Add any other required fields with default/placeholder values
            }]);

          if (insertError) {
            console.error(
              "Error creating teacher record:",
              insertError.message,
            );
            toast({
              title: "Teacher Record Creation Failed",
              description:
                `Could not create a teacher record for ${userEmail}. Please do this manually.`,
            });
          }
        }
      }

      // Store in localStorage for immediate client-side use
      globalThis.localStorage.setItem("user_role", selectedRole);

      // Refresh session to get updated claims
      await refreshSession();

      toast({
        title: "Role Set Successfully",
        description:
          `Your role has been set to ${selectedRole}. Redirecting...`,
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate(selectedRole === "admin" ? "/admin" : "/teacher-portal");
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "An unknown error occurred.";
      console.error("Role setup failed:", errorMessage);
      toast({
        variant: "destructive",
        title: "Role Setup Failed",
        description: `An error occurred: ${errorMessage}. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>Manual Role Setup</CardTitle>
          <CardDescription>
            Choose a role for the current user. This is for setup purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userInfo && (
            <div className="text-sm p-3 bg-muted rounded-md">
              <p>
                <strong>Email:</strong> {userInfo.email}
              </p>
              <p>
                <strong>Current Metadata:</strong>
              </p>
              <pre className="text-xs bg-background p-2 rounded-md mt-1 whitespace-pre-wrap">
                {JSON.stringify(userInfo.metadata, null, 2)}
              </pre>
            </div>
          )}
          <RadioGroup
            value={selectedRole}
            onValueChange={(value: "admin" | "teacher") =>
              setSelectedRole(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin" />
              <Label htmlFor="admin">Admin</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="teacher" id="teacher" />
              <Label htmlFor="teacher">Teacher</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleRoleSetup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Role and Proceed
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
