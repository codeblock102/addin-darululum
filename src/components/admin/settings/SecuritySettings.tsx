import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { SecuritySettings } from "@/types/settings.ts";
import { Shield } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

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
