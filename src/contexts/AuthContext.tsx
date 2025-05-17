
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  error: null
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshSession = async () => {
    try {
      console.log("Refreshing session...");
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error);
        setError("Failed to refresh session");
        return;
      }
      
      console.log("Session refreshed successfully:", !!data.session);
      setSession(data.session);
      setError(null);
    } catch (err) {
      console.error("Unexpected error during session refresh:", err);
      setError("An unexpected error occurred");
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        console.log("Auth state changed:", _event, !!currentSession);
        setSession(currentSession);
        if (!currentSession && !isLoading) {
          // Only show toast for actual logouts, not initial loading
          toast({
            title: "Logged out",
            description: "You have been logged out of your account.",
            variant: "default"
          });
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      console.log("Initial session check:", !!currentSession, error);
      if (error) {
        console.error("Error retrieving session:", error);
        setError("Failed to retrieve session");
      }
      setSession(currentSession);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, isLoading]);

  const signOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        setError("Failed to sign out");
        toast({
          title: "Sign out failed",
          description: "There was a problem signing you out. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Signed out successfully");
      setSession(null);
      setError(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      setError("An unexpected error occurred");
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut, refreshSession, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
