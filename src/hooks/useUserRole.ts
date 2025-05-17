
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(true); // Default to true for now
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user?.email) {
        setIsAdmin(false);
        setIsTeacher(false);
        setIsLoading(false);
        return;
      }

      try {
        // For now, always set isTeacher to true
        setIsTeacher(true);
        
        // Check if user is an admin
        if (session.user.user_metadata?.role === 'admin') {
          setIsAdmin(true);
        } else {
          // Check for admin role in database
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', session.user.email);
          
          // If we have teacher data, confirm teacher status
          setIsTeacher(true);
          
          // Admin check (could be based on some other criteria)
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        // Default to teacher for now
        setIsAdmin(false);
        setIsTeacher(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [session]);

  return { isAdmin, isTeacher, isLoading };
};
