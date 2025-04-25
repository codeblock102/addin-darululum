
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

interface TeacherPreferences {
  emailNotifications: boolean;
  reminderTime: number;
}

export function TeacherPreferences() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState(15);
  const [saving, setSaving] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['teacher-preferences'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      // First check if the teacher record exists and if it has preferences
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return null;
      }

      // If teacher has preferences column and it's populated, use those values
      if (data && data.preferences) {
        setEmailNotifications(data.preferences.emailNotifications ?? true);
        setReminderTime(data.preferences.reminderTime ?? 15);
        return data.preferences as TeacherPreferences;
      } else {
        // If no preferences yet, use defaults
        return { emailNotifications: true, reminderTime: 15 } as TeacherPreferences;
      }
    }
  });

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to save preferences",
        });
        return;
      }

      // Check if teacher exists
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (teacherError) {
        console.error('Error finding teacher:', teacherError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not find your teacher profile",
        });
        return;
      }

      // Update teacher record with preferences
      const { error } = await supabase
        .from('teachers')
        .update({
          preferences: {
            emailNotifications,
            reminderTime
          }
        })
        .eq('email', session.user.email);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Preferences</h2>
        <p className="text-muted-foreground">
          Manage your notification settings and other preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about class updates and student progress
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="space-y-2">
            <Label>Reminder Time</Label>
            <p className="text-sm text-muted-foreground mb-2">
              How many minutes before class should we send you a reminder?
            </p>
            <select
              className="w-full p-2 border rounded-md"
              value={reminderTime}
              onChange={(e) => setReminderTime(Number(e.target.value))}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <Button 
            onClick={handleSavePreferences} 
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!saving && <Save className="mr-2 h-4 w-4" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
