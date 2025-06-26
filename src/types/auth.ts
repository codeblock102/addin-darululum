import { createContext } from "react";
import { Session } from "@supabase/supabase-js";

/**
 * @interface AuthContextType
 * @description Defines the shape of the authentication context data.
 * @property {Session | null} session - The current Supabase session object, or null if not authenticated.
 * @property {boolean} isLoading - True if the authentication state is currently being determined or an operation is in progress, false otherwise.
 * @property {() => Promise<void>} signOut - Function to sign the current user out.
 * @property {() => Promise<void>} refreshSession - Function to attempt to refresh the current session.
 * @property {string | null} error - Stores any error message related to authentication operations.
 */
export interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: () => {
    console.warn("signOut called outside of AuthProvider");
    return Promise.resolve();
  },
  refreshSession: () => {
    console.warn("refreshSession called outside of AuthProvider");
    return Promise.resolve();
  },
  error: null,
});
