import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { Loader2, UserCog, CheckCircle, ArrowLeft } from "lucide-react";
import { setupAdminAccount } from "@/utils/adminUtils.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export default function SetupAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Could not get current user's email.");

      const success = await setupAdminAccount(user.email);
      if (success) {
        toast({
          title: "Admin Setup Complete",
          description: "Your account is now an admin. Redirecting...",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        throw new Error("Failed to set up admin account. Please try again.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-[hsl(142.8,64.2%,24.1%)] border-[hsl(142.8,64.2%,24.1%)] hover:bg-[hsl(142.8,64.2%,24.1%)] hover:text-white transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center mb-6">
        <div className="bg-blue-500 text-white rounded-full p-3 mr-4">
          <UserCog className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Account Setup</h2>
          <p className="text-gray-600">
            Elevate your account to have administrator privileges.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-gray-700">
        <p>
          This process will configure your currently logged-in account as an 
          <strong>administrator</strong>. This action is irreversible and grants full access.
        </p>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">This will:</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <span>Set your user role to <strong>admin</strong> in the database.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <span>Create an associated admin profile for extended details.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
              <span>Grant you access to all administrative panels and features.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Button
          onClick={handleSetupAdmin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Setting up Admin...
            </>
          ) : (
            "Confirm and Set Up Admin Account"
          )}
        </Button>
      </div>
    </div>
  );
}
