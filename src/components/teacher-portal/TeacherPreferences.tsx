
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';

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
      
      return {
        id: data.id,
        preferences: {
          enableReminders: true,
          reportFrequency: 'weekly',
        }
      };
    },
    enabled: !!session?.user?.email
  });

  // When we get the teacher data, set the form values
  useEffect(() => {
    if (teacherData?.preferences) {
      setReminders(teacherData.preferences.enableReminders ?? true);
      setReportFrequency(teacherData.preferences.reportFrequency || 'weekly');
    }
  }, [teacherData]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Record<string, any>) => {
      if (!teacherData?.id) throw new Error("Teacher ID not found");
      
      // Just update the timestamp since we don't have a preferences column
      const { error } = await supabase
        .from('teachers')
        .update({})
        .eq('id', teacherData.id);
      
      if (error) throw error;
      
      // Store preferences in localStorage as a temporary solution
      localStorage.setItem(`teacher_preferences_${teacherData.id}`, JSON.stringify(preferences));
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
