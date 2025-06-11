import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout.tsx";
import { Link } from "react-router-dom";

const CreateTeacherProfileForTestAccount = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const testEmail = "ammarmulla21@gmail.com";

  // Check if the teacher profile already exists
  useEffect(() => {
    const checkTeacherProfile = async () => {
      try {
        setIsChecking(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", testEmail)
          .maybeSingle();

        if (error) throw error;

        setExistingProfile(!!data);
      } catch (error) {
        console.error("Error checking teacher profile:", error);
        setError("Failed to check if teacher profile exists");
      } finally {
        setIsChecking(false);
      }
    };

    checkTeacherProfile();
  }, []);

  const createTeacherProfile = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .insert([
          {
            name: "Mufti Ammar Mulla",
            email: testEmail,
            subject: "Islamic Studies",
            bio:
              "Islamic studies educator with expertise in Quranic teachings.",
            role: "teacher",
          },
        ])
        .select("id, name, email, subject, bio, phone");

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Success",
        description:
          "Teacher profile created successfully for the test account.",
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to create teacher profile";
      console.error("Error creating teacher profile:", message);
      setError(message);
      toast({
        title: "Error",
        description: "Failed to create teacher profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">
              Create Teacher Profile for Test Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isChecking
              ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Checking for existing profile...</span>
                </div>
              )
              : existingProfile
              ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <h3 className="font-medium text-green-800">
                        Teacher profile already exists
                      </h3>
                      <p className="text-green-700 mt-1">
                        A teacher profile for {testEmail}{" "}
                        has already been created.
                      </p>
                      <div className="mt-4">
                        <Button asChild variant="outline">
                          <Link to="/teacher-portal">Go to Teacher Portal</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
              : (
                <>
                  <p className="text-gray-600">
                    This utility will create a teacher profile for the test
                    account with email: <strong>{testEmail}</strong>
                  </p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <h3 className="font-medium text-red-800">Error</h3>
                          <p className="text-red-700 mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isSuccess
                    ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <h3 className="font-medium text-green-800">
                              Success!
                            </h3>
                            <p className="text-green-700 mt-1">
                              Teacher profile created successfully for{" "}
                              {testEmail}.
                            </p>
                            <div className="mt-4">
                              <Button asChild variant="outline">
                                <Link to="/teacher-portal">
                                  Go to Teacher Portal
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                    : (
                      <Button
                        onClick={createTeacherProfile}
                        disabled={isCreating}
                        className="w-full md:w-auto"
                      >
                        {isCreating
                          ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          )
                          : (
                            "Create Teacher Profile"
                          )}
                      </Button>
                    )}
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateTeacherProfileForTestAccount;
