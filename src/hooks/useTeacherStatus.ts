
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";

export const useTeacherStatus = () => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) {
        setIsTeacher(false);
        setIsAdmin(false);
        setTeacherId(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if user is an admin from metadata
        const isUserAdmin = session.user.user_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Check if user is a teacher by looking for their record in the teachers table
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        
        const isUserTeacher = data && data.length > 0;
        // Set teacher status based on database or admin status
        const finalTeacherStatus = isUserTeacher || isUserAdmin;
        setIsTeacher(finalTeacherStatus);
        
        // Set teacher ID if found
        if (isUserTeacher && data && data.length > 0) {
          setTeacherId(data[0].id);
        } else {
          setTeacherId(null);
        }
        
        console.log(`Teacher status check: isTeacher=${finalTeacherStatus}, isAdmin=${isUserAdmin}, teacherId=${isUserTeacher ? data[0].id : null}`);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
        setIsAdmin(false);
        setTeacherId(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  return { isTeacher, isAdmin, teacherId, isLoading };
};
