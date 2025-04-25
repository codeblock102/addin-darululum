
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTeacherStatus = () => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) {
        setIsAdmin(true);
        setIsTeacher(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        
        setIsTeacher(data && data.length > 0);
        setIsAdmin(!data || data.length === 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
        setIsAdmin(true);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  return { isTeacher, isAdmin };
};
