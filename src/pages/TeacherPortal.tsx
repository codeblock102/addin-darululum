
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherDashboard } from "@/components/teacher-portal/TeacherDashboard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  email?: string;
  bio?: string;
  phone?: string;
}

const TeacherPortal = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Get teacher information based on the authenticated user's email
  const { data: teacherData, isLoading: teacherLoading } = useQuery({
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
        return null;
      }
      
      return data as Teacher;
    },
    enabled: !!session?.user?.email,
  });

  // Handle loading state
  if (teacherLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // If no teacher profile found, show a message
  if (!teacherData && !teacherLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find a teacher profile associated with your account. This portal is only for registered teachers.
          </p>
          <Button onClick={() => navigate('/')} variant="default">
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {teacherData && <TeacherDashboard teacher={teacherData} />}
    </DashboardLayout>
  );
};

export default TeacherPortal;
