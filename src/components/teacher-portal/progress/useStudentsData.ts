
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentsData = () => {
  return useQuery({
    queryKey: ['all-students-for-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('status', 'active')
        .order('name', { ascending: true });
        
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      return data;
    }
  });
};
