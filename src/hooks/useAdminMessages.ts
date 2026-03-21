import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Message } from "@/types/progress.ts";

const ADMIN_SENDER_ID = null; // admin messages have null sender_id by convention

export const useAdminMessages = () => {
  const queryClient = useQueryClient();

  const receivedQuery = useQuery<Message[]>({
    queryKey: ["admin-inbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .not("sender_id", "is", ADMIN_SENDER_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Message[]) || [];
    },
  });

  const sentQuery = useQuery<Message[]>({
    queryKey: ["admin-sent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .is("sender_id", ADMIN_SENDER_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Message[]) || [];
    },
  });

  const refetchMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sent"] });
  };

  return {
    receivedMessages: receivedQuery.data ?? [],
    sentMessages: sentQuery.data ?? [],
    receivedLoading: receivedQuery.isLoading,
    sentLoading: sentQuery.isLoading,
    refetchMessages,
  };
};
