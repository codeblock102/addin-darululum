import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Loader2, LockKeyhole } from "lucide-react";

function useHashParams() {
  return useMemo(() => {
    const hash = globalThis.location?.hash?.replace(/^#/, "") ?? "";
    const params = new URLSearchParams(hash);
    return {
      accessToken: params.get("access_token"),
      refreshToken: params.get("refresh_token"),
      type: params.get("type"),
    } as const;
  }, []);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { accessToken, refreshToken, type } = useHashParams();

  const [isExchanging, setIsExchanging] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const exchange = async () => {
      try {
        // For recovery links, Supabase sends access_token/refresh_token in the URL hash
        if (accessToken && refreshToken && type === "recovery") {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setError(error.message);
          } else if (!data.session) {
            setError("Could not establish a recovery session.");
          }
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "An unexpected error occurred while preparing the reset form.";
        setError(message);
      } finally {
        if (!cancelled) {
          setIsExchanging(false);
          setReady(true);
        }
      }
    };
    void exchange();
    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshToken, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      navigate("/auth", { replace: true });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to reset password. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showForm = ready && !isExchanging;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-sky-400">Reset your password</CardTitle>
          <CardDescription className="text-slate-200">Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {isExchanging && (
            <div className="flex items-center justify-center py-6 text-slate-200">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing secure session...
            </div>
          )}

          {!isExchanging && error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/50 text-red-300">
              <AlertTitle>Unable to reset password</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showForm && !error && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-slate-100">New Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-300 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-slate-100">Confirm Password</label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-300 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating...</>) : ("Update Password")}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" className="text-sky-400" onClick={() => navigate("/auth")}>Back to Sign In</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

