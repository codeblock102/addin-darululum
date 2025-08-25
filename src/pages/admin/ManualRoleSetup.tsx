import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2, User, Shield, Briefcase, ArrowLeft } from "lucide-react";
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
  const [selectedRole, setSelectedRole] = useState<"admin" | "teacher">("admin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
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
      const { data: { user } } = await supabase.auth.updateUser({
        data: { role: selectedRole },
      });

      if (!user) throw new Error("Failed to update user.");

      if (selectedRole === "teacher") {
        const { error } = await supabase
          .from("profiles")
          .upsert({ email: user.email!, role: 'teacher', name: user.email! }, { onConflict: 'email' });
        if (error) throw error;
      }

      await refreshSession();

      toast({
        title: "Role Set Successfully",
        description: `Your role is now ${selectedRole}. Redirecting...`,
      });

      setTimeout(() => navigate(selectedRole === "admin" ? "/admin/setup" : "/dashboard"), 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Role Setup Failed",
        description: errorMessage,
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
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manual Role Setup</h2>
          <p className="text-gray-600">Assign a role to the current user for setup.</p>
        </div>
      </div>

      {userInfo && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center">
            <User className="mr-2 h-5 w-5 text-gray-500" />
            Current User
          </h3>
          <p className="text-gray-700"><strong>Email:</strong> {userInfo.email}</p>
          <div className="mt-2">
            <p className="text-gray-700"><strong>Current Metadata:</strong></p>
            <pre className="text-xs bg-gray-100 p-3 rounded-md mt-1 whitespace-pre-wrap">
              {JSON.stringify(userInfo.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-800">Select a Role:</h3>
        <RadioGroup
          value={selectedRole}
          onValueChange={(value: "admin" | "teacher") => setSelectedRole(value)}
          className="space-y-3"
        >
          <Label
            htmlFor="admin-role"
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
              selectedRole === 'admin' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'border-gray-200 bg-white'
            }`}
          >
            <RadioGroupItem value="admin" id="admin-role" className="mr-4" />
            <Shield className="h-5 w-5 mr-3 text-blue-600" />
            <div>
              <p className="font-bold text-gray-800">Admin</p>
              <p className="text-sm text-gray-600">Full access to all settings and user management.</p>
            </div>
          </Label>
          <Label
            htmlFor="teacher-role"
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
              selectedRole === 'teacher' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'border-gray-200 bg-white'
            }`}
          >
            <RadioGroupItem value="teacher" id="teacher-role" className="mr-4" />
            <Briefcase className="h-5 w-5 mr-3 text-blue-600" />
            <div>
              <p className="font-bold text-gray-800">Teacher</p>
              <p className="text-sm text-gray-600">Access to teacher portal for managing students.</p>
            </div>
          </Label>
        </RadioGroup>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Button
          onClick={handleRoleSetup}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Setting Role...
            </>
          ) : (
            "Set Role and Proceed"
          )}
        </Button>
      </div>
    </div>
  );
}
