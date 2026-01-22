import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";

export function useRealtimeLeaderboard(
  teacherId?: string,
  refreshCallback?: () => void,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!teacherId) {
      console.log("No teacherId provided, skipping real-time subscriptions");
      return;
    }

    console.log("Setting up real-time subscriptions for teacher:", teacherId);

    // Set up subscriptions for all three tables: progress, sabaq_para, and juz_revisions
    const progressChannel = supabase
      .channel("leaderboard-progress-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "progress",
        },
        (payload) => {
          console.log("Progress change detected:", payload);
          // Invalidate the leaderboard queries to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["classroom-records"] });
          queryClient.invalidateQueries({
            queryKey: ["teacher-records", teacherId],
          });

          // Call additional refresh callback if provided
          if (refreshCallback) {
            console.log("Calling refresh callback due to progress change");
            refreshCallback();
          }

          if (payload.eventType === "INSERT") {
            toast({
              title: "New Progress Entry",
              description: "Records updated with new progress entry.",
              duration: 3000,
            });
          }
        },
      )
      .subscribe((status) => {
        console.log("Progress channel subscription status:", status);
      });

    const sabaqParaChannel = supabase
      .channel("leaderboard-sabaq-para-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sabaq_para",
        },
        (payload) => {
          console.log("Sabaq Para change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["classroom-records"] });
          queryClient.invalidateQueries({
            queryKey: ["teacher-records", teacherId],
          });

          // Call additional refresh callback if provided
          if (refreshCallback) {
            console.log("Calling refresh callback due to sabaq para change");
            refreshCallback();
          }

          if (payload.eventType === "INSERT") {
            toast({
              title: "New Sabaq Para Entry",
              description: "Records updated with new Sabaq Para entry.",
              duration: 3000,
            });
          }
        },
      )
      .subscribe((status) => {
        console.log("Sabaq Para channel subscription status:", status);
      });

    const juzRevisionsChannel = supabase
      .channel("leaderboard-juz-revisions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "juz_revisions",
        },
        (payload) => {
          console.log("Juz Revisions change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["classroom-records"] });
          queryClient.invalidateQueries({
            queryKey: ["teacher-records", teacherId],
          });

          // Call additional refresh callback if provided
          if (refreshCallback) {
            console.log("Calling refresh callback due to juz revision change");
            refreshCallback();
          }

          if (payload.eventType === "INSERT") {
            toast({
              title: "New Revision Entry",
              description: "Records updated with new Revision entry.",
              duration: 3000,
            });
          }
        },
      )
      .subscribe((status) => {
        console.log("Juz Revisions channel subscription status:", status);
      });

    console.log("Real-time subscriptions have been set up");

    // Clean up subscriptions when component unmounts
    return () => {
      console.log("Cleaning up real-time subscriptions");
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(sabaqParaChannel);
      supabase.removeChannel(juzRevisionsChannel);
    };
  }, [teacherId, queryClient, toast, refreshCallback]);

  return { isSubscribed: !!teacherId };
}
