import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { ProgressFormData } from "@/types/progress.ts";

export const useProgressSubmit = (studentId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [contributorName, setContributorName] = useState<string | null>(null);

  // Get contributor information
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.user?.email) return;

      try {
        // First, check if user is a teacher
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("email", session.user.email)
          .single();

        if (!profileError && profileData) {
          setContributorName(`Teacher ${profileData.name}`);
          return;
        }

        // If not a teacher, perhaps an admin or other role
        setContributorName(`User ${session.user.email.split("@")[0]}`);
      } catch (error) {
        console.error("Error fetching user info:", error);
        setContributorName(`User ${session.user.email.split("@")[0]}`);
      }
    };

    fetchUserInfo();
  }, [session]);

  const getUserInfo = async () => {
    if (!session?.user?.email) return null;

    try {
      // First, check if user is a teacher
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("email", session.user.email)
        .single();

      if (!profileError && profileData) {
        return {
          contributor_id: profileData.id,
          contributor_name: `Teacher ${profileData.name}`,
        };
      }

      // If not a teacher, perhaps an admin or other role
      return {
        contributor_id: session.user.id,
        contributor_name: `User ${session.user.email.split("@")[0]}`,
      };
    } catch (error) {
      console.error("Error fetching user info:", error);
      return {
        contributor_id: session.user.id,
        contributor_name: `User ${session.user.email.split("@")[0]}`,
      };
    }
  };

  const submitProgress = async (
    data: ProgressFormData,
    onSuccess?: () => void,
  ) => {
    setIsProcessing(true);
    try {
      // Get contributor information
      const contributorInfo = await getUserInfo();

      // Calculate verses memorized if not provided
      const verses_memorized = data.verses_memorized ||
        (data.end_ayat - data.start_ayat + 1);

      // Insert progress entry with contributor info
      const { error } = await supabase
        .from("progress")
        .insert([{
          student_id: studentId,
          ...data,
          verses_memorized,
          date: new Date().toISOString().split("T")[0],
          last_revision_date: new Date().toISOString().split("T")[0],
          ...contributorInfo, // Add contributor information
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress entry has been saved",
      });

      // Invalidate both progress queries
      queryClient.invalidateQueries({
        queryKey: ["student-progress", studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["progress"] });

      if (onSuccess) onSuccess();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to save progress entry";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    submitProgress,
    isProcessing,
    contributorName,
  };
};
