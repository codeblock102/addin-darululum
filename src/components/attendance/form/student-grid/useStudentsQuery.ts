
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student } from './types';

export function useStudentsQuery(selectedClassId: string) {
  return useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: async (): Promise<Student[]> => {
      if (!selectedClassId) {
        return [];
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      
      return data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status as 'active' | 'inactive',
        section: item.section
      })) || [];
    },
    enabled: !!selectedClassId,
  });
}
