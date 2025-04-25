
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NotificationSettings } from "@/types/settings";
import { Bell } from "lucide-react";
import { SettingsCard } from "./SettingsCard";

interface NotificationSettingsSectionProps {
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => void;
}

export function NotificationSettingsSection({ settings, onUpdate }: NotificationSettingsSectionProps) {
  const handleChange = (key: keyof NotificationSettings, value: boolean) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title="Notifications"
      description="Configure notification preferences"
      icon={<Bell className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive important updates via email</p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="progress-alerts" className="font-medium">Progress Alerts</Label>
            <p className="text-sm text-muted-foreground">Get notified about student progress</p>
          </div>
          <Switch
            id="progress-alerts"
            checked={settings.progressAlerts}
            onCheckedChange={(checked) => handleChange('progressAlerts', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="attendance-reminders" className="font-medium">Attendance Reminders</Label>
            <p className="text-sm text-muted-foreground">Send reminders about recording attendance</p>
          </div>
          <Switch
            id="attendance-reminders"
            checked={settings.attendanceReminders}
            onCheckedChange={(checked) => handleChange('attendanceReminders', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="system-announcements" className="font-medium">System Announcements</Label>
            <p className="text-sm text-muted-foreground">Receive updates about system changes</p>
          </div>
          <Switch
            id="system-announcements"
            checked={settings.systemAnnouncements}
            onCheckedChange={(checked) => handleChange('systemAnnouncements', checked)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
