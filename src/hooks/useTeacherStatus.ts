
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTeacherStatus = () => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) {
        setIsTeacher(false);
        setIsAdmin(false);
        setTeacherId(null);
        return;
      }
      
      try {
        // Check if user is a teacher by looking for their record in the teachers table
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        
        const isUserTeacher = data && data.length > 0;
        setIsTeacher(isUserTeacher);
        
        // Set teacher ID if found
        if (isUserTeacher && data && data.length > 0) {
          setTeacherId(data[0].id);
        } else {
          setTeacherId(null);
        }
        
        // Check if user is admin from metadata or role
        const isUserAdmin = session.user.user_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        console.log(`Teacher status check: isTeacher=${isUserTeacher}, isAdmin=${isUserAdmin}, teacherId=${isUserTeacher ? data[0].id : null}`);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
        setIsAdmin(false);
        setTeacherId(null);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  return { isTeacher, isAdmin, teacherId };
};
