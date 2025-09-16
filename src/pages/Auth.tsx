/**
 * @file src/pages/Auth.tsx
 * @summary This file defines the authentication page component for user login.
 *
 * It provides a form for users to sign in using their email and password.
 * The component handles the sign-in process using Supabase authentication, displays error messages,
 * and redirects users based on their role (admin or teacher) or to a role setup page if no role is defined.
 *
 * Key Features:
 * - Email and password input fields.
 * - Show/hide password functionality.
 * - Loading state indication during sign-in.
 * - Error message display for failed login attempts.
 * - Role-based redirection after successful login:
 *   - Admins are redirected to `/dashboard`.
 *   - Teachers are redirected to `/dashboard`.
 *   - Users without a defined role (or not found as a teacher) are redirected to `/role-setup`.
 * - Uses `useAuth` context for session refresh and `useToast` for notifications.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader as _CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import DumLogo from "@/assets/Logo-01.jpg";

/**
 * @component Auth
 * @description Renders the user authentication (login) page.
 *
 * This component provides a user interface for email/password login.
 * It interacts with Supabase for authentication, handles user feedback (loading states, errors, success toasts),
 * and navigates the user to the appropriate part of the application upon successful authentication.
 *
 * State Management:
 *  - `email`: Stores the content of the email input field.
 *  - `password`: Stores the content of the password input field.
 *  - `isLoading`: Boolean to indicate if the sign-in process is active.
 *  - `showPassword`: Boolean to toggle password visibility.
 *  - `errorMessage`: Stores error messages to be displayed to the user.
 *
 * Hooks:
 *  - `useNavigate`: For programmatic navigation after login.
 *  - `useToast`: For displaying toast notifications.
 *  - `useAuth`: For accessing `refreshSession` to update auth state post-login.
 *
 * @returns {JSX.Element} The rendered authentication page with a login form.
 */
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  /**
   * @function handleSignIn
   * @description Handles the user sign-in process when the login form is submitted.
   * It prevents the default form submission, sets loading states, and calls Supabase `signInWithPassword`.
   * After a successful sign-in, it refreshes the session, checks the user's role (admin or teacher),
   * and navigates them accordingly. Displays errors using state and toasts.
   *
   * Input:
   *  - `e`: React.FormEvent, the form submission event.
   *
   * Output:
   *  - Navigates the user to `/dashboard` or `/role-setup` on success.
   *  - Sets `errorMessage` and shows a toast on failure.
   * @async
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log(`Attempting to login with email: ${email}`);
      const { data, error: signInError } = await supabase.auth
        .signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setErrorMessage("Invalid email or password. Please try again.");
        } else {
          setErrorMessage(signInError.message);
        }
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
        setErrorMessage(
          "Login failed. Could not retrieve user details after session refresh.",
        );
        if (refreshedUserError) throw refreshedUserError;
        throw new Error("Refreshed user is null after session refresh.");
      }

      // Simplified, strict DB-first routing by auth id only
      const userId = refreshedUser.id;

      // 1) profiles.role by id
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile role:", profileError.message);
      } else if (profileRow?.role === "admin") {
        toast({ title: "Login Successful", description: "Welcome back, Admin! Redirecting..." });
        navigate("/dashboard");
        return;
      } else if (profileRow?.role === "teacher") {
        toast({ title: "Login Successful", description: "Welcome back, Teacher! Redirecting..." });
        navigate("/dashboard");
        return;
      }

      // 2) parents by id
      const { data: parentRow, error: parentError } = await supabase
        .from("parents")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (parentError) {
        console.error("Error checking parents:", parentError.message);
      } else if (parentRow?.id) {
        toast({ title: "Login Successful", description: "Welcome! Redirecting to Parent Portal..." });
        navigate("/parent");
        return;
      }

      console.log("No role found, redirecting to dashboard fallback");
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "An unexpected error occurred during login. Please try again.";
      console.error("Authentication error:", message);
      toast({
        title: "Login Error",
        description: errorMessage || message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    if (!email) {
      setErrorMessage("Please enter your email above, then click 'Forgot password?'");
      return;
    }
    setIsLoading(true);
    try {
      const redirectTo = `${globalThis.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      toast({ title: "Reset link sent", description: "Check your email for the reset link." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] via-[hsl(142.8,64.2%,20%)] to-[hsl(142.8,64.2%,16%)] p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Premium Card */}
        <Card className="backdrop-blur-xl bg-white/95 shadow-2xl border-0 rounded-3xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[hsl(142.8,64.2%,24.1%)] to-[hsl(142.8,64.2%,28%)] p-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>
            
            {/* Logo Container */}
            <div className="relative mb-6 flex justify-center">
              <div className="bg-white/95 rounded-xl p-3 shadow-md border border-white/50 w-[220px] sm:w-[260px]">
                <img
                  src={DumLogo}
                  alt="Dār Al-Ulūm Montréal Logo"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Dār Al-Ulūm Montréal
            </CardTitle>
            <CardDescription className="text-emerald-100/90 text-lg font-medium">
              Welcome to Excellence
            </CardDescription>
            <p className="text-emerald-200/70 text-sm mt-2">
              Secure access to your educational portal
            </p>
          </div>

          <CardContent className="p-8">
            {errorMessage && (
              <Alert
                variant="destructive"
                className="mb-6 bg-red-50 border-red-200 text-red-800 rounded-xl"
              >
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
                <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[hsl(142.8,64.2%,24.1%)] transition-colors duration-200" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 pr-4 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[hsl(142.8,64.2%,24.1%)] focus:border-[hsl(142.8,64.2%,24.1%)] transition-all duration-200 rounded-xl"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockKeyhole className="h-5 w-5 text-gray-400 group-focus-within:text-[hsl(142.8,64.2%,24.1%)] transition-colors duration-200" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[hsl(142.8,64.2%,24.1%)] focus:border-[hsl(142.8,64.2%,24.1%)] transition-all duration-200 rounded-xl"
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-[hsl(142.8,64.2%,24.1%)] hover:bg-gray-100 rounded-lg transition-all duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-[hsl(142.8,64.2%,24.1%)] hover:text-[hsl(142.8,64.2%,32%)] font-medium transition-colors duration-200"
                  onClick={handleForgotPassword}
                >
                  Forgot your password?
                </button>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[hsl(142.8,64.2%,24.1%)] to-[hsl(142.8,64.2%,28%)] hover:from-[hsl(142.8,64.2%,28%)] hover:to-[hsl(142.8,64.2%,32%)] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-3 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="w-full text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-xs font-medium">Secure Connection</span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
              
              <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} Dār Al-Ulūm Montréal. All rights reserved.
              </p>
              
              <p className="text-xs text-gray-500">
                Need assistance?{" "}
                <a
                  href="mailto:support@darululum-montreal.com"
                  className="text-[hsl(142.8,64.2%,24.1%)] hover:text-[hsl(142.8,64.2%,32%)] font-medium transition-colors duration-200"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
