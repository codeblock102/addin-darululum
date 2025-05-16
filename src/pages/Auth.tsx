
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "signIn" | "forgotPassword";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "username">("email");
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
        // Handle sign in based on selected method
        if (authMethod === "email") {
          // Sign in with email and password
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          navigate("/");
        } else {
          // Username login requires checking for the user in profiles first
          if (!username || !password) {
            throw new Error("Username and password are required");
          }
          
          // Attempt to get the email associated with the username from user metadata
          // We'll check for a user with this username
          const { data: userData, error: userError } = await supabase
            .from('profiles')  
            .select('id')
            .eq('username', username)
            .single();
          
          if (userError || !userData) {
            throw new Error("Username not found. Please check your credentials.");
          }
          
          // Get the user by ID to find their email
          const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userData.id);
          
          if (authError || !authData) {
            throw new Error("Could not retrieve user details. Please try again or use email login.");
          }
          
          // Now sign in with the email and provided password
          const { error } = await supabase.auth.signInWithPassword({
            email: authData.user.email,
            password,
          });
          
          if (error) throw error;
          navigate("/");
        }
      } else if (mode === "forgotPassword") {
        // Handle password reset
        if (authMethod === "email") {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });
          if (error) throw error;
          toast({
            title: "Password Reset Email Sent",
            description: "Check your email for a password reset link",
          });
          setMode("signIn");
        } else {
          toast({
            title: "Information",
            description: "Please use the email tab to reset your password",
          });
          setAuthMethod("email");
          setMode("forgotPassword");
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
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
      <Tabs defaultValue="email" value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "username")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="username">Username</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
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
          </form>
        </TabsContent>
        
        <TabsContent value="username">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username-password">Password</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username-password"
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
              className="w-full -mt-2 text-sm text-right invisible"
            >
              &nbsp;
            </Button>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Sign In"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
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
        
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-gray-500 text-center">
            Only admin-created accounts can access this system. Public registration is disabled.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
