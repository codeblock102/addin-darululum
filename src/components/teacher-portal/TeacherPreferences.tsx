
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { TeacherPreferences } from '@/types/teacher';

export function TeacherPreferencesComponent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teacher data with potential preferences
  const { data: teacherData } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*, preferences')
        .single();
      
      if (error) throw error;
      return data as TeacherPreferences;
    }
  });

  // Mutation to update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Record<string, any>) => {
      const { data, error } = await supabase
        .from('teachers')
        .update({ preferences })
        .eq('id', teacherData?.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been successfully saved.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update preferences: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handler for preference updates
  const handlePreferencesUpdate = () => {
    // Implement preference update logic
    const newPreferences = {
      // Example preferences
      notificationPreference: 'email',
      languagePreference: 'en'
    };
    
    updatePreferencesMutation.mutate(newPreferences);
  };

  return (
    <div>
      <h2>Teacher Preferences</h2>
      <div className="space-y-4">
        {teacherData?.preferences && (
          <pre>{JSON.stringify(teacherData.preferences, null, 2)}</pre>
        )}
        <Button onClick={handlePreferencesUpdate}>
          Update Preferences
        </Button>
      </div>
    </div>
  );
}
