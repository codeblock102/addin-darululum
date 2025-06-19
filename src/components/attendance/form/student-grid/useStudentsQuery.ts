
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student } from './types';

export function useStudentsQuery(selectedClassId: string) {
  return useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) {
        return [] as Student[];
      }

      const { data, error } = await supabase
        .from('students')
        .select('id, name, status, section')
        .eq('class_id', selectedClassId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      
      return (data || []) as Student[];
    },
    enabled: !!selectedClassId,
  });
}
