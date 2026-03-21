import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Message } from "@/types/progress.ts";

export const useTeacherMessages = (teacherId: string) => {
  const queryClient = useQueryClient();

  const inboxQuery = useQuery<Message[]>({
    queryKey: ["teacher-inbox", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .eq("recipient_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Message[]) || [];
    },
    enabled: !!teacherId,
  });

  const sentQuery = useQuery<Message[]>({
    queryKey: ["teacher-sent", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .eq("sender_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Message[]) || [];
    },
    enabled: !!teacherId,
  });

  const recipientsQuery = useQuery({
    queryKey: ["message-recipients", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, role")
        .neq("id", teacherId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.role as "teacher" | "admin",
      }));
    },
    enabled: !!teacherId,
  });

  const unreadCount =
    inboxQuery.data?.filter((m) => !m.read).length ?? 0;

  const refetchMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["teacher-inbox", teacherId] });
    queryClient.invalidateQueries({ queryKey: ["teacher-sent", teacherId] });
  };

  return {
    inboxMessages: inboxQuery.data ?? [],
    sentMessages: sentQuery.data ?? [],
    recipients: recipientsQuery.data ?? [],
    inboxLoading: inboxQuery.isLoading,
    sentLoading: sentQuery.isLoading,
    recipientsLoading: recipientsQuery.isLoading,
    refetchMessages,
    unreadCount,
  };
};
