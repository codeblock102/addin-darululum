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
  CardHeader,
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";

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

      console.log("Checking user metadata:", refreshedUser.user_metadata);
      if (refreshedUser.user_metadata?.role === "admin") {
        localStorage.setItem("userRole", "admin");
        toast({
          title: "Login Successful",
          description: "Welcome back, Admin! Redirecting...",
        });
        navigate("/dashboard");
        return;
      }

      if (refreshedUser.email) {
        console.log(
          "Checking for teacher profile with email:",
          refreshedUser.email,
        );
        const { data: teacherData, error: teacherError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", refreshedUser.email)
          .maybeSingle();

        if (teacherError) {
          console.error(
            "Error checking teacher profile:",
            teacherError.message,
          );
        } else if (teacherData) {
          localStorage.setItem("userRole", "teacher");
          toast({
            title: "Login Successful",
            description: "Welcome back, Teacher! Redirecting...",
          });
          navigate("/dashboard");
          return;
        }
      }

      console.log("No role found, redirecting to role setup");
      toast({
        title: "Role Setup Required",
        description:
          "Your account needs a role assignment. Please select your role.",
      });
      navigate("/role-setup");
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--auth-gradient)' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0" style={{ background: 'var(--auth-pattern)' }} />
      
      {/* Floating Geometric Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-float">
          <polygon points="50,0 100,50 50,100 0,50" fill="currentColor" className="text-sky-400" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-20 w-24 h-24 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-float" style={{ animationDelay: '2s' }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-300" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" className="text-sky-300" />
        </svg>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl text-white relative z-10 border-0 animate-slideIn backdrop-blur-xl" 
            style={{ 
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 25px 50px -12px hsla(0, 0%, 0%, 0.5), 0 0 0 1px hsla(210, 40%, 30%, 0.2)'
            }}>
        <CardHeader className="text-center relative">
          {/* Shimmer effect behind logo */}
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" 
                 style={{ background: 'var(--shimmer-bg)' }} />
          </div>
          
          <div className="relative">
            <img
              src="/logo.png"
              alt="Darul Uloom Logo"
              className="w-20 h-20 mx-auto mb-6 rounded-full ring-4 ring-sky-400/20 shadow-lg transition-transform duration-300 hover:scale-105"
            />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-300 to-sky-400 bg-clip-text text-transparent font-arabic">
              Darul Uloom Login
            </CardTitle>
            <CardDescription className="text-slate-300 mt-2 text-lg">
              Access your dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {errorMessage && (
            <Alert
              variant="destructive"
              className="mb-6 bg-red-500/10 border-red-400/30 text-red-200 backdrop-blur-sm animate-slideIn"
              style={{
                background: 'hsla(0, 60%, 30%, 0.1)',
                border: '1px solid hsla(0, 60%, 50%, 0.3)'
              }}
            >
              <AlertTriangle className="h-4 w-4 !text-red-400" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-slate-200 font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-sky-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 focus:bg-slate-700/70 hover:bg-slate-700/60"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-slate-200 font-medium">
                Password
              </Label>
              <div className="relative group">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-sky-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 focus:bg-slate-700/70 hover:bg-slate-700/60"
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 text-slate-400 hover:text-sky-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-white relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, hsl(210, 100%, 50%) 0%, hsl(200, 100%, 55%) 100%)',
                boxShadow: '0 10px 20px hsla(210, 100%, 50%, 0.3)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isLoading
                ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                )
                : (
                  "Sign In"
                )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pt-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-4" />
          <p className="text-xs text-slate-400 font-arabic">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Darul Uloom. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="text-sky-400 hover:text-sky-300 transition-colors hover:underline"
            >
              Contact Support
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
