import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AuthMode = "signIn" | "signUp" | "forgotPassword";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, refreshSession } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === "signIn") {
        // Handle sign in with email and password
        console.log(`Attempting to login with email: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setErrorMessage("Email not confirmed. Please check your inbox for a confirmation email or create a new demo account.");
          } else if (error.message.includes("Invalid login credentials")) {
            setErrorMessage("Invalid email or password. Please try again or reset your password.");
          } else {
            setErrorMessage(error.message);
          }
          throw error;
        }
        
        await refreshSession();
        
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        navigate("/");
      } else if (mode === "signUp") {
        // Handle sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: 'teacher' },
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });
        
        if (error) {
          if (error.message.includes("User already registered")) {
            setErrorMessage("This email is already registered. Please sign in instead.");
          } else {
            setErrorMessage(error.message);
          }
          throw error;
        }
        
        toast({
          title: "Registration successful",
          description: "Please check your email for confirmation link.",
        });
        setMode("signIn");
      } else if (mode === "forgotPassword") {
        // Handle password reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        
        if (error) {
          setErrorMessage(error.message);
          throw error;
        }
        
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for a password reset link",
        });
        setMode("signIn");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      toast({
        title: "Error",
        description: errorMessage || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthForm = () => {
    if (mode === "forgotPassword") {
      return (
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Send Reset Link"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setMode("signIn")}
          >
            Back to Sign In
          </Button>
        </form>
      );
    }

    return (
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-password">Password</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {mode === "signIn" && (
          <Button
            type="button"
            variant="link"
            className="w-full -mt-2 text-sm text-right"
            onClick={() => setMode("forgotPassword")}
          >
            Forgot Password?
          </Button>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : mode === "signIn" ? "Sign In" : "Sign Up"}
        </Button>
        
        <div className="text-center mt-4">
          {mode === "signIn" ? (
            <Button 
              type="button" 
              variant="link" 
              onClick={() => setMode("signUp")}
            >
              Don't have an account? Sign up
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="link" 
              onClick={() => setMode("signIn")}
            >
              Already have an account? Sign in
            </Button>
          )}
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2" />
        Back
      </Button>
      
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "forgotPassword" 
              ? "Reset Password" 
              : mode === "signUp" 
                ? "Create an Account"
                : "Sign In"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "forgotPassword"
              ? "Enter your email to receive a password reset link"
              : mode === "signUp"
                ? "Create your account to get started"
                : "Sign in to your account to continue"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {renderAuthForm()}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-gray-500 text-center">
            {mode === "signUp" 
              ? "By signing up, you agree to our Terms of Service and Privacy Policy."
              : "Access the system with your account credentials."}
          </p>
          <div className="flex flex-col items-center space-y-2">
            <Link 
              to="/create-demo-account" 
              className="text-sm text-primary hover:underline text-center font-medium"
            >
              Create demo teacher account
            </Link>
            <Link 
              to="/create-teacher-profile" 
              className="text-sm text-primary hover:underline text-center font-medium"
            >
              Create teacher profile for test account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
