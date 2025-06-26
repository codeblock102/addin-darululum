import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { AppearanceSettings } from "@/types/settings.ts";
import { Palette, PanelRightClose, ScanLine, Sparkles } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";

interface AppearanceSettingsSectionProps {
  settings: AppearanceSettings;
  onUpdate: (settings: AppearanceSettings) => void;
}

export function AppearanceSettingsSection(
  { settings, onUpdate }: AppearanceSettingsSectionProps,
) {
  const handleChange = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title="Appearance"
      description="Customize the look and feel of the application"
      icon={<Palette className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-medium">Theme</Label>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) =>
              handleChange("theme", value as AppearanceSettings["theme"])}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system">System</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PanelRightClose className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sidebar-compact">Compact sidebar</Label>
            </div>
            <Switch
              id="sidebar-compact"
              checked={settings.sidebarCompact}
              onCheckedChange={(checked) =>
                handleChange("sidebarCompact", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ScanLine className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="high-contrast">High contrast mode</Label>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrastMode}
              onCheckedChange={(checked) =>
                handleChange("highContrastMode", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="animations">Enable animations</Label>
            </div>
            <Switch
              id="animations"
              checked={settings.animationsEnabled}
              onCheckedChange={(checked) =>
                handleChange("animationsEnabled", checked)}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
