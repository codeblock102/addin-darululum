
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";

export const useUserRole = () => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
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
        // Check if user is an admin from metadata
        const isUserAdmin = session.user.user_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Check for teacher profile data
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();
        
        // Set teacher status based on database result
        const isUserTeacher = !!teacherData || isUserAdmin; // Admins have teacher access
        setIsTeacher(isUserTeacher);
        
        console.log(`Role check in useUserRole: isAdmin=${isUserAdmin}, isTeacher=${isUserTeacher}`);
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(false);
        setIsTeacher(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [session]);

  return { isAdmin, isTeacher, isLoading };
};
