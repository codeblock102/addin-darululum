
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "signIn" | "forgotPassword";

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signIn") {
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
        </div>
        
        <Button
          type="button"
          variant="link"
          className="w-full -mt-2 text-sm text-right"
          onClick={() => setMode("forgotPassword")}
        >
          Forgot Password?
        </Button>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Sign In"}
        </Button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Only admin-created accounts can access this system. Public registration is disabled.
          </p>
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
              : "Sign In"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "forgotPassword"
              ? "Enter your email to receive a password reset link"
              : "Sign in to your account to continue"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderAuthForm()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
