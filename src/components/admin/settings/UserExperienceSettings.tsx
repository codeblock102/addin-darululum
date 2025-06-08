import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { UserExperienceSettings } from "@/types/settings.ts";
import { SettingsCard } from "./SettingsCard.tsx";
import { UserCheck } from "lucide-react";

interface UserExperienceSettingsSectionProps {
  settings: UserExperienceSettings;
  onUpdate: (settings: UserExperienceSettings) => void;
}

export function UserExperienceSettingsSection({ settings, onUpdate }: UserExperienceSettingsSectionProps) {
  const handleChange = <K extends keyof UserExperienceSettings>(key: K, value: UserExperienceSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title="User Experience"
      description="Configure features that enhance user interaction"
      icon={<UserCheck className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="guided-tours" className="font-medium">Guided Tours</Label>
            <p className="text-sm text-muted-foreground">Show interactive feature tours for new users</p>
          </div>
          <Switch
            id="guided-tours"
            checked={settings.guidedTours}
            onCheckedChange={(checked) => handleChange('guidedTours', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="keyboard-shortcuts" className="font-medium">Keyboard Shortcuts</Label>
            <p className="text-sm text-muted-foreground">Enable keyboard shortcuts for common actions</p>
          </div>
          <Switch
            id="keyboard-shortcuts"
            checked={settings.keyboardShortcuts}
            onCheckedChange={(checked) => handleChange('keyboardShortcuts', checked)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="landing-page" className="font-medium">Default Landing Page</Label>
          <Select 
            value={settings.defaultLandingPage}
            onValueChange={(value: UserExperienceSettings['defaultLandingPage']) => handleChange('defaultLandingPage', value)}
          >
            <SelectTrigger id="landing-page" className="bg-background">
              <SelectValue placeholder="Select default page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="students">Students</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Page shown after login</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="widget-customization" className="font-medium">Widget Customization</Label>
            <p className="text-sm text-muted-foreground">Allow users to customize dashboard widgets</p>
          </div>
          <Switch
            id="widget-customization"
            checked={settings.widgetCustomization}
            onCheckedChange={(checked) => handleChange('widgetCustomization', checked)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
