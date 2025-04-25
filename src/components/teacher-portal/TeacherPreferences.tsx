
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { TeacherPreferences as TeacherPreferencesType } from '@/types/teacher';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function TeacherPreferencesComponent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationPreference, setNotificationPreference] = useState<string>('email');
  const [languagePreference, setLanguagePreference] = useState<string>('en');
  const [enableReminders, setEnableReminders] = useState<boolean>(true);

  // Fetch teacher data with potential preferences
  const { data: teacherData } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*, preferences')
        .single();
      
      if (error) throw error;
      return data as TeacherPreferencesType;
    }
  });

  // Initialize preference states from data
  useEffect(() => {
    if (teacherData?.preferences) {
      setNotificationPreference(teacherData.preferences.notificationPreference || 'email');
      setLanguagePreference(teacherData.preferences.languagePreference || 'en');
      setEnableReminders(teacherData.preferences.enableReminders !== false);
    }
  }, [teacherData]);

  // Mutation to update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Record<string, any>) => {
      if (!teacherData?.id) throw new Error('Teacher ID not available');
      
      const { data, error } = await supabase
        .from('teachers')
        .update({ 
          preferences: preferences 
        })
        .eq('id', teacherData.id);
      
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
        description: `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  // Handler for preference updates
  const handlePreferencesUpdate = () => {
    const newPreferences = {
      notificationPreference,
      languagePreference,
      enableReminders
    };
    
    updatePreferencesMutation.mutate(newPreferences);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Teacher Preferences</CardTitle>
        <CardDescription>
          Customize your teaching experience by adjusting your preferences below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-preference">Notification Preference</Label>
            <Select 
              value={notificationPreference} 
              onValueChange={setNotificationPreference}
            >
              <SelectTrigger id="notification-preference">
                <SelectValue placeholder="Select notification method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">Both Email & SMS</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language-preference">Language Preference</Label>
            <Select 
              value={languagePreference} 
              onValueChange={setLanguagePreference}
            >
              <SelectTrigger id="language-preference">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="ur">Urdu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-reminders" className="block mb-1">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders about upcoming classes and reviews
              </p>
            </div>
            <Switch 
              id="enable-reminders" 
              checked={enableReminders} 
              onCheckedChange={setEnableReminders} 
            />
          </div>
        </div>

        {teacherData?.preferences && (
          <div className="bg-muted p-4 rounded-md border border-muted-foreground/20">
            <h3 className="text-sm font-medium mb-1">Current Preferences</h3>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(teacherData.preferences, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePreferencesUpdate}
          disabled={updatePreferencesMutation.isPending}
        >
          {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Re-export with the name expected by the import
export const TeacherPreferences = TeacherPreferencesComponent;
