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
import React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";

/**
 * @interface AuthContextType
 * @description Defines the shape of the authentication context data.
 * @property {Session | null} session - The current Supabase session object, or null if not authenticated.
 * @property {boolean} isLoading - True if the authentication state is currently being determined or an operation is in progress, false otherwise.
 * @property {() => Promise<void>} signOut - Function to sign the current user out.
 * @property {() => Promise<void>} refreshSession - Function to attempt to refresh the current session.
 * @property {string | null} error - Stores any error message related to authentication operations.
 */
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
  signOut: async () => { console.warn("signOut called outside of AuthProvider"); },
  refreshSession: async () => { console.warn("refreshSession called outside of AuthProvider"); },
  error: null
});

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
            variant: "default"
          });
        }
        setIsLoading(false); 
      }
    );

    // THEN check for existing session
    let isLoadingInitialCheck = true;
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      console.log("Initial session check:", !!currentSession, error);
      if (error) {
        console.error("Error retrieving session:", error);
        setError("Failed to retrieve session");
      }
      setSession(currentSession);
      setIsLoading(false);
      isLoadingInitialCheck = false;
    });

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

/**
 * @hook useAuth
 * @description Custom hook to easily consume the authentication context.
 * 
 * Ensures that the hook is used within an `AuthProvider` to prevent runtime errors.
 * @throws {Error} If used outside of an `AuthProvider`.
 * @returns {AuthContextType} The authentication context values (session, isLoading, signOut, etc.).
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
