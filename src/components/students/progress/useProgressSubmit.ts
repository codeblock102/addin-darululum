
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProgressFormData } from "./types";

export const useProgressSubmit = (studentId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get contributor information
  const getUserInfo = async () => {
    if (!session?.user?.email) return null;
    
    try {
      // First, check if user is a teacher
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('email', session.user.email)
        .single();
      
      if (!teacherError && teacherData) {
        return {
          contributor_id: teacherData.id,
          contributor_name: `Teacher ${teacherData.name}`
        };
      }
      
      // If not a teacher, perhaps an admin or other role
      return {
        contributor_id: session.user.id,
        contributor_name: `User ${session.user.email.split('@')[0]}`
      };
    } catch (error) {
      console.error("Error fetching user info:", error);
      return {
        contributor_id: session.user.id,
        contributor_name: `User ${session.user.email.split('@')[0]}`
      };
    }
  };

  const submitProgress = async (data: ProgressFormData, onSuccess?: () => void) => {
    setIsProcessing(true);
    try {
      // Get contributor information
      const contributorInfo = await getUserInfo();
      
      // Insert progress entry with contributor info
      const { error } = await supabase
        .from('progress')
        .insert([{
          student_id: studentId,
          ...data,
          date: new Date().toISOString().split('T')[0],
          last_revision_date: new Date().toISOString().split('T')[0],
          ...contributorInfo // Add contributor information
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress entry has been saved",
      });
      
      // Invalidate both progress queries
      queryClient.invalidateQueries({ queryKey: ['student-progress', studentId] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save progress entry",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    submitProgress,
    isProcessing
  };
};
