
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user?.email) {
        setIsAdmin(true);
        setIsTeacher(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
        
        setIsTeacher(teacherData && teacherData.length > 0);
        setIsAdmin(!teacherData || teacherData.length === 0);
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(true);
        setIsTeacher(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [session]);

  return { isAdmin, isTeacher, isLoading };
};

