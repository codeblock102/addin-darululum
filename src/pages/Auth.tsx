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

        // Check if the user is a parent via consolidated parents table keyed by auth id
        const { data: parentRow, error: parentError } = await (supabase as any)
          .from("parents")
          .select("id")
          .eq("id", refreshedUser.id)
          .maybeSingle();

        if (parentError) {
          console.error("Error checking parents:", parentError.message);
        } else if (parentRow?.id) {
          localStorage.setItem("userRole", "parent");
          toast({
            title: "Login Successful",
            description: "Welcome! Redirecting to Parent Portal...",
          });
          navigate("/parent");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center">
          <img
            src="/logo.png"
            alt="Darul Uloom Logo"
            className="w-20 h-20 mx-auto mb-4 rounded-full"
          />
          <CardTitle className="text-3xl font-bold text-sky-400">
            Dār Al-Ulūm Montréal
          </CardTitle>
          <CardDescription className="text-slate-200">
            Access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert
              variant="destructive"
              className="mb-4 bg-red-500/10 border-red-500/50 text-red-300"
            >
              <AlertTriangle className="h-4 w-4 !text-red-400" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-100">Email</Label>
              <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-300 focus:ring-sky-500 focus:border-sky-500"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-100">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder-slate-300 focus:ring-sky-500 focus:border-sky-500"
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 text-slate-300 hover:text-sky-400"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-5 w-5" />
                    : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 transition-colors duration-150 ease-in-out"
              disabled={isLoading}
            >
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
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-xs text-slate-300">
            &copy; {new Date().getFullYear()} Dār Al-Ulūm Montréal. All rights reserved.
          </p>
          <p className="text-xs text-slate-300">
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="text-sky-400 hover:underline"
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
