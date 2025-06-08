import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { AdvancedSettings } from "@/types/settings.ts";
import { Bug } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";

interface AdvancedSettingsSectionProps {
  settings: AdvancedSettings;
  onUpdate: (settings: AdvancedSettings) => void;
}

export function AdvancedSettingsSection({ settings, onUpdate }: AdvancedSettingsSectionProps) {
  const handleChange = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleFeatureFlagChange = <K extends keyof AdvancedSettings['featureFlags']>(
    key: K,
    value: AdvancedSettings['featureFlags'][K]
  ) => {
    onUpdate({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [key]: value,
      },
    });
  };

  return (
    <SettingsCard
      title="Advanced Options"
      description="Configure technical and developer settings"
      icon={<Bug className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="developer-mode" className="font-medium">Developer Mode</Label>
            <p className="text-sm text-muted-foreground">Show advanced developer options and information</p>
          </div>
          <Switch
            id="developer-mode"
            checked={settings.developerMode}
            onCheckedChange={(checked) => handleChange('developerMode', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="detailed-logs" className="font-medium">Detailed Logs</Label>
            <p className="text-sm text-muted-foreground">Enable verbose logging for troubleshooting</p>
          </div>
          <Switch
            id="detailed-logs"
            checked={settings.detailedLogs}
            onCheckedChange={(checked) => handleChange('detailedLogs', checked)}
          />
        </div>
        
        <div className="space-y-4">
          <Label className="font-medium">Feature Flags</Label>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="beta-features" className="text-sm">Beta Features</Label>
              <p className="text-xs text-muted-foreground">Enable access to upcoming features</p>
            </div>
            <Switch
              id="beta-features"
              checked={settings.featureFlags.betaFeatures}
              onCheckedChange={(checked) => handleFeatureFlagChange('betaFeatures', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="experimental-ui" className="text-sm">Experimental UI</Label>
              <p className="text-xs text-muted-foreground">Try new interface designs</p>
            </div>
            <Switch
              id="experimental-ui"
              checked={settings.featureFlags.experimentalUi}
              onCheckedChange={(checked) => handleFeatureFlagChange('experimentalUi', checked)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="font-medium">Performance Mode</Label>
          <RadioGroup
            value={settings.performanceMode}
            onValueChange={(value: AdvancedSettings['performanceMode']) => handleChange('performanceMode', value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="balanced" id="perf-balanced" />
              <Label htmlFor="perf-balanced">Balanced (Default)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="performance" id="perf-speed" />
              <Label htmlFor="perf-speed">Performance (Faster, less visual effects)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quality" id="perf-quality" />
              <Label htmlFor="perf-quality">Quality (More visual effects)</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </SettingsCard>
  );
}
