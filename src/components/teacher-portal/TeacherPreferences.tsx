
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Teacher, TeacherPreferences as TeacherPreferencesType } from '@/types/teacher';

export const TeacherPreferences = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reminders, setReminders] = useState(true);
  const [reportFrequency, setReportFrequency] = useState('weekly');
  const [savedChanges, setSavedChanges] = useState(false);

  const { data: teacherData, isLoading } = useQuery({
    queryKey: ['teacher-profile', session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('email', session.user.email)
        .single();
      
      if (error) throw error;
      
      // Get teacher preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', data.id)
        .single();
      
      if (preferencesError) throw preferencesError;
      
      // Initialize with default values if no preferences found
      const preferences = {
        enableReminders: true,
        reportFrequency: 'weekly',
      };
      
      return {
        id: data.id, 
        preferences
      };
    },
    enabled: !!session?.user?.email
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Record<string, any>) => {
      if (!teacherData?.id) throw new Error("Teacher ID not found");
      
      const { error } = await supabase
        .from('teachers')
        .update({
          // Use preferences directly instead of updated_at
          preferences
        })
        .eq('id', teacherData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully."
      });
      setSavedChanges(true);
      
      // Reset the saved message after a delay
      setTimeout(() => {
        setSavedChanges(false);
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update preferences: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate({
      enableReminders: reminders,
      reportFrequency
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Preferences</CardTitle>
        <CardDescription>
          Customize your teaching experience by setting your preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reminders" 
                checked={reminders}
                onCheckedChange={(value) => setReminders(!!value)} 
              />
              <Label htmlFor="reminders" className="font-normal">
                Enable class reminders
              </Label>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              Receive notifications about upcoming classes and assignments
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reportFrequency">Progress Report Frequency</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={reportFrequency === 'daily' ? 'default' : 'outline'}
                onClick={() => setReportFrequency('daily')}
              >
                Daily
              </Button>
              <Button
                type="button"
                variant={reportFrequency === 'weekly' ? 'default' : 'outline'}
                onClick={() => setReportFrequency('weekly')}
              >
                Weekly
              </Button>
              <Button
                type="button"
                variant={reportFrequency === 'monthly' ? 'default' : 'outline'}
                onClick={() => setReportFrequency('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={updatePreferencesMutation.isPending}
            className="w-full"
          >
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
          
          {savedChanges && (
            <p className="text-center text-sm text-green-600">
              Preferences saved successfully!
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
