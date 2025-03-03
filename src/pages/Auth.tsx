
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

type AuthMode = "signIn" | "signUp" | "forgotPassword";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    return strength;
  }, [password]);

  const getPasswordColor = () => {
    if (passwordStrength < 50) return "bg-red-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signUp") {
        // For sign up, ensure password is strong enough
        if (passwordStrength < 75) {
          toast({
            title: "Weak Password",
            description: "Please create a stronger password with uppercase, numbers, and special characters",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Please check your email to verify your account",
        });
      } else if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      } else if (mode === "forgotPassword") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for a password reset link",
        });
        setMode("signIn");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirements = () => {
    if (mode !== "signUp" || !password) return null;
    
    return (
      <div className="space-y-2 text-sm mt-2">
        <p className="font-medium">Password requirements:</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            {password.length >= 8 ? (
              <Check className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <X className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span>At least 8 characters</span>
          </div>
          <div className="flex items-center">
            {/[A-Z]/.test(password) ? (
              <Check className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <X className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span>Uppercase letter</span>
          </div>
          <div className="flex items-center">
            {/[0-9]/.test(password) ? (
              <Check className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <X className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span>Number</span>
          </div>
          <div className="flex items-center">
            {/[^A-Za-z0-9]/.test(password) ? (
              <Check className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <X className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span>Special character</span>
          </div>
        </div>
      </div>
    );
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
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
          
          {mode === "signUp" && password && (
            <>
              <div className="mt-2">
                <Progress value={passwordStrength} className={getPasswordColor()} />
                <p className="text-xs mt-1 text-right">
                  {passwordStrength < 50 
                    ? "Weak password" 
                    : passwordStrength < 75 
                      ? "Moderate password" 
                      : "Strong password"}
                </p>
              </div>
              {renderPasswordRequirements()}
            </>
          )}
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
          {isLoading
            ? "Processing..."
            : mode === "signUp"
            ? "Create Account"
            : "Sign In"}
        </Button>
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
                ? "Create Account" 
                : "Sign In"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "forgotPassword"
              ? "Enter your email to receive a password reset link"
              : mode === "signUp"
              ? "Create a new account to access the system"
              : "Sign in to your account to continue"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderAuthForm()}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t p-4">
          <Button
            variant="link"
            onClick={() => setMode(mode === "signUp" ? "signIn" : "signUp")}
          >
            {mode === "signUp"
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
