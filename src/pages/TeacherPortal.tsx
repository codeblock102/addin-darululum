
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherDashboard } from "@/components/teacher-portal/TeacherDashboard";
import { toast } from "@/components/ui/use-toast";
import { LoadingState } from "@/components/teacher-portal/LoadingState";
import { AccessDenied } from "@/components/teacher-portal/AccessDenied";
import { ProfileNotFound } from "@/components/teacher-portal/ProfileNotFound";
import { Teacher } from "@/types/teacher";

const TeacherPortal = () => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        setIsTeacher(data && data.length > 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  const { data: teacherData, isLoading, error } = useQuery({
    queryKey: ['teacher-profile', session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, subject, experience, email, bio, phone')
        .eq('email', session.user.email)
        .single();
      
      if (error) {
        console.error('Error fetching teacher profile:', error);
        throw error;
      }
      
      return data as Teacher;
    },
    enabled: !!session?.user?.email && isTeacher === true
  });

  if (error) {
    toast({
      title: "Error loading profile",
      description: "Could not load your teacher profile. Please try again later.",
      variant: "destructive"
    });
  }

  return (
    <DashboardLayout>
      {isLoading || isTeacher === null ? (
        <LoadingState />
      ) : !isTeacher ? (
        <AccessDenied />
      ) : !teacherData && !isLoading ? (
        <ProfileNotFound />
      ) : (
        teacherData && <TeacherDashboard teacher={teacherData} />
      )}
    </DashboardLayout>
  );
};

export default TeacherPortal;
