/**
 * @file src/contexts/AuthContext.tsx
 * @summary This file defines the authentication context and provider for the application.
 *
 * It uses Supabase for authentication and provides the session state, loading status,
 * sign-out functionality, session refresh, and any authentication errors to its children components.
 *
 * The `AuthProvider` component initializes the Supabase session and listens for authentication state changes.
 * It handles session refresh and sign-out operations, providing user feedback via toasts.
 *
 * The `useAuth` hook is a convenience hook for consuming the `AuthContext`.
 */
import { ReactNode, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { AuthContext } from "@/types/auth.ts";

/**
 * @component AuthProvider
 * @description Provides authentication state and methods to the application.
 *
 * Manages the user's session with Supabase, including:
 *  - Initializing the session on load.
 *  - Listening to `onAuthStateChange` events from Supabase to keep the session state up-to-date.
 *  - Providing a `signOut` method.
 *  - Providing a `refreshSession` method.
 *  - Tracking loading states and errors related to authentication.
 *
 * @param {{ children: ReactNode }} props - Props for the component.
 * @param {ReactNode} props.children - The child components that will have access to the auth context.
 * @returns {JSX.Element} The AuthContext.Provider wrapping the children components.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * @function refreshSession
   * @description Attempts to refresh the current Supabase authentication session.
   * Updates the session state and handles any errors, providing feedback via console and state.
   * @async
   * @returns {Promise<void>}
   */
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

        // Update the session state
        setSession(currentSession);

        // If we have a new session, let's fetch user role metadata
        if (currentSession?.user) {
          console.log("User metadata:", currentSession.user.user_metadata);
        }

        // We only set isLoading to false here, after the initial check or an auth event.
        // Avoids showing logout toast on initial load if there was no session.
        if (!currentSession && !isLoadingInitialCheck) {
          toast({
            title: "Logged out",
            description: "You have been logged out of your account.",
            variant: "default",
          });
        }
        setIsLoading(false);
      },
    );

    // THEN check for existing session
    let isLoadingInitialCheck = true;
    supabase.auth.getSession().then(
      ({ data: { session: currentSession }, error }) => {
        console.log("Initial session check:", !!currentSession, error);
        if (error) {
          console.error("Error retrieving session:", error);
          setError("Failed to retrieve session");
        }
        setSession(currentSession);
        setIsLoading(false);
        isLoadingInitialCheck = false;
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]); // Removed isLoading from dependency array

  /**
   * @function signOut
   * @description Signs the current user out of the Supabase session.
   * Clears the local session state and handles potential errors, providing feedback via toasts.
   * @async
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Handle missing-session case with a local sign-out fallback
        const message = (error as Error).message || "";
        const isSessionMissing =
          message.includes("Auth session missing") ||
          (error as any)?.name === "AuthSessionMissingError";

        if (isSessionMissing) {
          console.warn("Auth session missing on signOut - performing local sign-out fallback");
          await supabase.auth.signOut({ scope: "local" });
        } else {
          console.error("Error signing out:", error);
          setError("Failed to sign out");
          toast({
            title: "Sign out failed",
            description: "There was a problem signing you out. Please try again.",
            variant: "destructive",
          });
          // Proceed with local cleanup anyway to unblock the user
        }
      }

      // Local cleanup to ensure UI updates even if remote sign-out failed
      localStorage.removeItem("userRole");
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
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, signOut, refreshSession, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @function useAuth
 * @description Custom hook to access the authentication context.
 *
 * This hook is a simple wrapper around `useContext(AuthContext)` that provides a more
 * convenient way to access the auth state. It ensures that the hook is used within an
 * `AuthProvider` tree.
 *
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If the hook is used outside of an `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
