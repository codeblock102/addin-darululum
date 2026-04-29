/**
 * Security & Notification Settings - Groups Security and Notification settings
 * This file consolidates two related settings sections for easier maintenance.
 */
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SecuritySettings, NotificationSettings } from "@/types/settings.ts";
import { Bell, Shield } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

// =============================================================================
// SECURITY SETTINGS SECTION
// =============================================================================
interface SecuritySettingsSectionProps {
  settings: SecuritySettings;
  onUpdate: (settings: SecuritySettings) => void;
}

export function SecuritySettingsSection(
  { settings, onUpdate }: SecuritySettingsSectionProps,
) {
  const { t } = useI18n();
  const handleChange = <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title={t("settings.security.title")}
      description={t("settings.security.description")}
      icon={<Shield className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="2fa" className="font-medium">{t("settings.security.twoFactor.title")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.security.twoFactor.desc")}</p>
          </div>
          <Switch
            id="2fa"
            checked={settings.twoFactorAuth}
            onCheckedChange={(checked) =>
              handleChange("twoFactorAuth", checked)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="session-timeout" className="font-medium">{t("settings.security.sessionTimeout.label")}</Label>
            <span className="text-sm text-muted-foreground">{settings.sessionTimeout} {t("settings.security.sessionTimeout.suffixMinutes")}</span>
          </div>
          <Slider
            id="session-timeout"
            min={15}
            max={240}
            step={15}
            value={[settings.sessionTimeout]}
            onValueChange={(value) => handleChange("sessionTimeout", value[0])}
          />
          <p className="text-xs text-muted-foreground">{t("settings.security.sessionTimeout.help")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-expiry" className="font-medium">{t("settings.security.passwordExpiry.label")}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="password-expiry"
              type="number"
              min={30}
              max={365}
              value={settings.passwordExpiry}
              onChange={(e) =>
                handleChange("passwordExpiry", parseInt(e.target.value, 10))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{t("settings.security.passwordExpiry.suffixDays")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("settings.security.passwordExpiry.help")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-attempts" className="font-medium">{t("settings.security.loginAttempts.label")}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="login-attempts"
              type="number"
              min={3}
              max={10}
              value={settings.loginAttempts}
              onChange={(e) =>
                handleChange("loginAttempts", parseInt(e.target.value, 10))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{t("settings.security.loginAttempts.suffixAttempts")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("settings.security.loginAttempts.help")}</p>
        </div>
      </div>
    </SettingsCard>
  );
}

// =============================================================================
// NOTIFICATION SETTINGS SECTION
// =============================================================================
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
