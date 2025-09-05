import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { AppearanceSettings } from "@/types/settings.ts";
import { Palette, PanelRightClose, ScanLine, Sparkles } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface AppearanceSettingsSectionProps {
  settings: AppearanceSettings;
  onUpdate: (settings: AppearanceSettings) => void;
}

export function AppearanceSettingsSection(
  { settings, onUpdate }: AppearanceSettingsSectionProps,
) {
  const { t } = useI18n();
  const handleChange = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
      icon={<Palette className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-medium">{t("settings.appearance.theme")}</Label>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) =>
              handleChange("theme", value as AppearanceSettings["theme"])}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light">{t("settings.appearance.themes.light")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark">{t("settings.appearance.themes.dark")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system">{t("settings.appearance.themes.system")}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PanelRightClose className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sidebar-compact">{t("settings.appearance.compactSidebar")}</Label>
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
              <Label htmlFor="high-contrast">{t("settings.appearance.highContrast")}</Label>
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
              <Label htmlFor="animations">{t("settings.appearance.enableAnimations")}</Label>
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
