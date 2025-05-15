
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTeacherData = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-details', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('id', teacherId)
        .single();
        
      if (error) {
        console.error('Error fetching teacher details:', error);
        return null;
      }
      return data;
    }
  });
};
