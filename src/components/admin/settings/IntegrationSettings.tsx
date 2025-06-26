import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { IntegrationSettings } from "@/types/settings.ts";
import { Calendar, MessageSquare, Network } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";

interface IntegrationSettingsSectionProps {
  settings: IntegrationSettings;
  onUpdate: (settings: IntegrationSettings) => void;
}

export function IntegrationSettingsSection(
  { settings, onUpdate }: IntegrationSettingsSectionProps,
) {
  const handleChange = <K extends keyof IntegrationSettings>(
    key: K,
    value: IntegrationSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleCalendarChange = <
    K extends keyof IntegrationSettings["calendarSync"],
  >(
    key: K,
    value: IntegrationSettings["calendarSync"][K],
  ) => {
    onUpdate({
      ...settings,
      calendarSync: {
        ...settings.calendarSync,
        [key]: value,
      },
    });
  };

  const handleCommunicationChange = <
    K extends keyof IntegrationSettings["communicationTools"],
  >(
    key: K,
    value: IntegrationSettings["communicationTools"][K],
  ) => {
    onUpdate({
      ...settings,
      communicationTools: {
        ...settings.communicationTools,
        [key]: value,
      },
    });
  };

  return (
    <SettingsCard
      title="Integrations"
      description="Connect with external services and tools"
      icon={<Network className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="calendar-sync" className="font-medium">
                  Calendar Synchronization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Sync schedules with your calendar
                </p>
              </div>
            </div>
            <Switch
              id="calendar-sync"
              checked={settings.calendarSync.enabled}
              onCheckedChange={(checked) =>
                handleCalendarChange("enabled", checked)}
            />
          </div>

          {settings.calendarSync.enabled && (
            <div className="pl-6 space-y-2">
              <Label className="text-sm">Calendar Provider</Label>
              <Select
                value={settings.calendarSync.provider}
                onValueChange={(
                  value: IntegrationSettings["calendarSync"]["provider"],
                ) => handleCalendarChange("provider", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="outlook">Microsoft Outlook</SelectItem>
                  <SelectItem value="apple">Apple Calendar</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="communication-tools" className="font-medium">
                  Communication Tools
                </Label>
                <p className="text-sm text-muted-foreground">
                  Connect with messaging platforms
                </p>
              </div>
            </div>
            <Switch
              id="communication-tools"
              checked={settings.communicationTools.enabled}
              onCheckedChange={(checked) =>
                handleCommunicationChange("enabled", checked)}
            />
          </div>

          {settings.communicationTools.enabled && (
            <div className="pl-6 space-y-2">
              <Label className="text-sm">Preferred Platform</Label>
              <Select
                value={settings.communicationTools.preferredPlatform}
                onValueChange={(
                  value: IntegrationSettings["communicationTools"][
                    "preferredPlatform"
                  ],
                ) => handleCommunicationChange("preferredPlatform", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="external-apis" className="font-medium">
                External APIs
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable connections to third-party APIs
              </p>
            </div>
            <Switch
              id="external-apis"
              checked={settings.externalApis}
              onCheckedChange={(checked) =>
                handleChange("externalApis", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="automations" className="font-medium">
                Automations
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable automated workflows and actions
              </p>
            </div>
            <Switch
              id="automations"
              checked={settings.automations}
              onCheckedChange={(checked) =>
                handleChange("automations", checked)}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
