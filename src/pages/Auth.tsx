import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { Label } from "@/components/ui/label.tsx";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import DumLogo from "@/assets/Logo-01.jpg";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setErrorMessage(
          signInError.message.includes("Invalid login credentials")
            ? "Invalid email or password. Please try again."
            : signInError.message
        );
        throw signInError;
      }

      if (!data.user) {
        setErrorMessage("Login failed. User data not found.");
        throw new Error("User data not found after sign in.");
      }

      await refreshSession();

      const { data: { user: refreshedUser }, error: refreshedUserError } =
        await supabase.auth.getUser();

      if (refreshedUserError || !refreshedUser) {
        setErrorMessage("Login failed. Could not retrieve user details after session refresh.");
        if (refreshedUserError) throw refreshedUserError;
        throw new Error("Refreshed user is null after session refresh.");
      }

      const userId = refreshedUser.id;

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile role:", profileError.message);
      } else if (profileRow?.role === "admin" || profileRow?.role === "teacher") {
        toast({ title: "Welcome back!", description: "Redirecting to your dashboard..." });
        navigate("/dashboard");
        return;
      }

      const { data: parentRow, error: parentError } = await supabase
        .from("parents")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (parentError) {
        console.error("Error checking parents:", parentError.message);
      } else if (parentRow?.id) {
        toast({ title: "Welcome back!", description: "Redirecting to Parent Portal..." });
        navigate("/parent");
        return;
      }

      toast({ title: "Welcome back!", description: "Redirecting..." });
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Authentication error:", message);
      toast({ title: "Login Error", description: errorMessage || message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    if (!email) {
      setErrorMessage("Enter your email above first, then click 'Forgot password?'");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent", description: "Check your email for the password reset link." });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d4a23 0%, #166534 45%, #15803d 100%)" }}>

        {/* Geometric Islamic pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 0L53.66 26.34 80 40 53.66 53.66 40 80 26.34 53.66 0 40 26.34 26.34z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }} />

        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          {/* Logo */}
          <div className="bg-white rounded-2xl p-4 shadow-2xl mb-10 w-56">
            <img src={DumLogo} alt="Dār Al-Ulūm Montréal" className="w-full h-auto object-contain" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            Dār Al-Ulūm<br />Montréal
          </h1>
          <p className="text-emerald-200 text-lg mb-12 leading-relaxed">
            Islamic Education Management System
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { label: "Student Progress Tracking" },
              { label: "Attendance Management" },
              { label: "Parent Communication" },
            ].map((f) => (
              <div key={f.label}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/15">
                <div className="w-2 h-2 bg-emerald-300 rounded-full flex-shrink-0" />
                <span className="text-white/90 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer credit */}
        <p className="absolute bottom-6 text-emerald-300/50 text-xs">
          © {new Date().getFullYear()} Dār Al-Ulūm Montréal
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <div className="bg-white rounded-xl p-3 shadow-md w-44 mx-auto">
            <img src={DumLogo} alt="Dār Al-Ulūm Montréal" className="w-full h-auto object-contain" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@daralulummontreal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Bottom note */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Need help?{" "}
              <a href="mailto:mufti.zain@daralulummontreal.com"
                className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors">
                Contact your administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
