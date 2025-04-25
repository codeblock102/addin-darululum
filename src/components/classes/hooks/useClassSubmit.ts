
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { hasPermission } from "@/utils/roleUtils";
import { ClassFormData } from "../validation/classFormSchema";

interface UseClassSubmitProps {
  selectedClass: any;
  onSuccess: () => void;
}

export const useClassSubmit = ({ selectedClass, onSuccess }: UseClassSubmitProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ClassFormData) => {
      const hasCreatePermission = await hasPermission('manage_classes');
      if (!hasCreatePermission) {
        throw new Error("You don't have permission to manage classes");
      }

      const formattedValues = {
        ...values,
        days_of_week: values.days_of_week,
      };

      if (selectedClass) {
        const { error } = await supabase
          .from('classes')
          .update(formattedValues)
          .eq('id', selectedClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('classes')
          .insert([formattedValues]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: selectedClass ? "Class Updated" : "Class Created",
        description: `Class has been ${selectedClass ? 'updated' : 'created'} successfully.`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
