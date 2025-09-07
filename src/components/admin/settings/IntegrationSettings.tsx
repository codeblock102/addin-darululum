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
import { useI18n } from "@/contexts/I18nContext.tsx";

interface IntegrationSettingsSectionProps {
  settings: IntegrationSettings;
  onUpdate: (settings: IntegrationSettings) => void;
}

export function IntegrationSettingsSection(
  { settings, onUpdate }: IntegrationSettingsSectionProps,
) {
  const { t } = useI18n();
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
      title={t("settings.integrations.title")}
      description={t("settings.integrations.description")}
      icon={<Network className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="calendar-sync" className="font-medium">{t("settings.integrations.calendar.title")}</Label>
                <p className="text-sm text-muted-foreground">{t("settings.integrations.calendar.desc")}</p>
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
              <Label className="text-sm">{t("settings.integrations.calendar.providerLabel")}</Label>
              <Select
                value={settings.calendarSync.provider}
                onValueChange={(
                  value: IntegrationSettings["calendarSync"]["provider"],
                ) => handleCalendarChange("provider", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("settings.integrations.calendar.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">{t("settings.integrations.calendar.providers.google")}</SelectItem>
                  <SelectItem value="outlook">{t("settings.integrations.calendar.providers.outlook")}</SelectItem>
                  <SelectItem value="apple">{t("settings.integrations.calendar.providers.apple")}</SelectItem>
                  <SelectItem value="none">{t("settings.integrations.calendar.providers.none")}</SelectItem>
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
                <Label htmlFor="communication-tools" className="font-medium">{t("settings.integrations.comms.title")}</Label>
                <p className="text-sm text-muted-foreground">{t("settings.integrations.comms.desc")}</p>
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
              <Label className="text-sm">{t("settings.integrations.comms.platformLabel")}</Label>
              <Select
                value={settings.communicationTools.preferredPlatform}
                onValueChange={(
                  value: IntegrationSettings["communicationTools"][
                    "preferredPlatform"
                  ],
                ) => handleCommunicationChange("preferredPlatform", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("settings.integrations.comms.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">{t("settings.integrations.comms.platforms.email")}</SelectItem>
                  <SelectItem value="slack">{t("settings.integrations.comms.platforms.slack")}</SelectItem>
                  <SelectItem value="teams">{t("settings.integrations.comms.platforms.teams")}</SelectItem>
                  <SelectItem value="discord">{t("settings.integrations.comms.platforms.discord")}</SelectItem>
                  <SelectItem value="none">{t("settings.integrations.comms.platforms.none")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="external-apis" className="font-medium">{t("settings.integrations.externalApis.label")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.integrations.externalApis.desc")}</p>
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
              <Label htmlFor="automations" className="font-medium">{t("settings.integrations.automations.label")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.integrations.automations.desc")}</p>
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
