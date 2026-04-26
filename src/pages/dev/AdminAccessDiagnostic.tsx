import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { fixAdminProfile } from "@/utils/adminUtils.ts";
import { Loader2, AlertTriangle, CheckCircle, User, Key } from "lucide-react";

interface DiagnosticInfo {
  userId: string;
  email: string;
  authMetadataRole: string | null;
  profileExists: boolean;
  profileRole: string | null;
  madrassahId: string | null;
}

export default function AdminAccessDiagnostic() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (session?.user) {
      runDiagnostic();
    }
  }, [session]);

  const runDiagnostic = async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const userId = session.user.id;
      const email = session.user.email || "unknown";
      const authMetadataRole = session.user.user_metadata?.role || null;

      // Check profile table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, madrassah_id")
        .eq("id", userId)
        .single();

      const profileExists = !profileError;
      const profileRole = profile?.role || null;
      const madrassahId = profile?.madrassah_id || null;

      setDiagnosticInfo({
        userId,
        email,
        authMetadataRole,
        profileExists,
        profileRole,
        madrassahId,
      });
    } catch (error) {
      console.error("Diagnostic error:", error);
      toast({
        title: "Diagnostic Failed",
        description: "Could not run diagnostic check",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixAdminAccess = async () => {
    if (!session?.user || !diagnosticInfo) return;

    setIsFixing(true);
    try {
      const success = await fixAdminProfile(diagnosticInfo.userId, diagnosticInfo.email);
      
      if (success) {
        toast({
          title: "Fix Applied",
          description: "Admin profile has been fixed. Please refresh the page.",
        });
        // Re-run diagnostic to show updated info
        await runDiagnostic();
      } else {
        toast({
          title: "Fix Failed",
          description: "Could not fix admin profile. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fix error:", error);
      toast({
        title: "Fix Failed",
        description: "An error occurred while fixing the profile",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Running diagnostic...</span>
        </div>
      </Card>
    );
  }

  if (!diagnosticInfo) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to run diagnostic</h2>
          <p className="text-gray-600 mb-4">Please ensure you are logged in</p>
          <Button onClick={runDiagnostic}>Retry</Button>
        </div>
      </Card>
    );
  }

  const hasIssues = !diagnosticInfo.profileExists || 
                   diagnosticInfo.profileRole !== 'admin' ||
                   diagnosticInfo.authMetadataRole !== 'admin';

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <User className="h-8 w-8 text-blue-500 mr-3" />
        <div>
          <h2 className="text-2xl font-bold">Admin Access Diagnostic</h2>
          <p className="text-gray-600">Checking your admin permissions and profile setup</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">User ID:</span>
          <span className="text-sm font-mono">{diagnosticInfo.userId}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Email:</span>
          <span>{diagnosticInfo.email}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Auth Metadata Role:</span>
          <div className="flex items-center">
            {diagnosticInfo.authMetadataRole === 'admin' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>{diagnosticInfo.authMetadataRole || 'Not set'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Profile Record:</span>
          <div className="flex items-center">
            {diagnosticInfo.profileExists ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>{diagnosticInfo.profileExists ? 'Exists' : 'Missing'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Profile Role:</span>
          <div className="flex items-center">
            {diagnosticInfo.profileRole === 'admin' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>{diagnosticInfo.profileRole || 'Not set'}</span>
          </div>
        </div>

        {/* user_roles table removed; no longer checking this */}

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Dār Al-Ulūm Montréal Assignment:</span>
          <span>{diagnosticInfo.madrassahId || 'Not assigned'}</span>
        </div>
      </div>

      {hasIssues && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="font-semibold text-red-700">Issues Detected</span>
          </div>
          <p className="text-red-600 mb-4">
            Your admin access may not be working properly due to missing or incorrect configuration.
          </p>
          <Button 
            onClick={fixAdminAccess} 
            disabled={isFixing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isFixing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Key className="h-4 w-4 mr-2" />
            Fix Admin Access
          </Button>
        </div>
      )}

      {!hasIssues && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-semibold text-green-700">All checks passed!</span>
          </div>
          <p className="text-green-600 mt-2">
            Your admin access is properly configured.
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={runDiagnostic}>
          Re-run Diagnostic
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </Card>
  );
} 