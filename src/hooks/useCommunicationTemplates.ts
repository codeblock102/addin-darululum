import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export type TemplateCategory = "absence" | "progress" | "general" | "reminder";

export interface CommunicationTemplate {
  id: string;
  title: string;
  body: string;
  category: TemplateCategory;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  title: string;
  body: string;
  category: TemplateCategory;
}

export interface UpdateTemplateInput extends CreateTemplateInput {
  id: string;
}

const QUERY_KEY = ["communication-templates"] as const;

export function useCommunicationTemplates() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<CommunicationTemplate[]> => {
      const { data, error } = await supabase
        .from("communication_templates")
        .select("*")
        .order("category", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommunicationTemplate[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data, error } = await supabase
        .from("communication_templates")
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data as CommunicationTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTemplateInput) => {
      const { data, error } = await supabase
        .from("communication_templates")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as CommunicationTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("communication_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
