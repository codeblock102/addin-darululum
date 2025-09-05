import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { NotificationSettings } from "@/types/settings.ts";
import { Bell } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface NotificationSettingsSectionProps {
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => void;
}

export function NotificationSettingsSection(
  { settings, onUpdate }: NotificationSettingsSectionProps,
) {
  const { t } = useI18n();
  const handleChange = (key: keyof NotificationSettings, value: boolean) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title={t("settings.notifications.title")}
      description={t("settings.notifications.description")}
      icon={<Bell className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications" className="font-medium">{t("settings.notifications.email.title")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifications.email.desc")}</p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) =>
              handleChange("emailNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="progress-alerts" className="font-medium">{t("settings.notifications.progress.title")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifications.progress.desc")}</p>
          </div>
          <Switch
            id="progress-alerts"
            checked={settings.progressAlerts}
            onCheckedChange={(checked) =>
              handleChange("progressAlerts", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="attendance-reminders" className="font-medium">{t("settings.notifications.attendance.title")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifications.attendance.desc")}</p>
          </div>
          <Switch
            id="attendance-reminders"
            checked={settings.attendanceReminders}
            onCheckedChange={(checked) =>
              handleChange("attendanceReminders", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="system-announcements" className="font-medium">{t("settings.notifications.system.title")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifications.system.desc")}</p>
          </div>
          <Switch
            id="system-announcements"
            checked={settings.systemAnnouncements}
            onCheckedChange={(checked) =>
              handleChange("systemAnnouncements", checked)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
