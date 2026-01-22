import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";

export const useDeleteClass = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);
        
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Class Deleted",
        description: "The class has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete class: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}; 