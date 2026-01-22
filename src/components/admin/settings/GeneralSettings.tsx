/**
 * General Settings - Groups Appearance, Localization, and User Experience settings
 * This file consolidates three related settings sections for easier maintenance.
 */
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  AppearanceSettings,
  LocalizationSettings,
  UserExperienceSettings,
} from "@/types/settings.ts";
import {
  Globe,
  Palette,
  PanelRightClose,
  ScanLine,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { type LanguageCode } from "@/i18n/translations.ts";

// =============================================================================
// APPEARANCE SETTINGS SECTION
// =============================================================================
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

// =============================================================================
// LOCALIZATION SETTINGS SECTION
// =============================================================================
interface LocalizationSettingsSectionProps {
  settings: LocalizationSettings;
  onUpdate: (settings: LocalizationSettings) => void;
}

export function LocalizationSettingsSection(
  { settings, onUpdate }: LocalizationSettingsSectionProps,
) {
  const { t, setLanguage } = useI18n();
  const handleChange = <K extends keyof LocalizationSettings>(
    key: K,
    value: LocalizationSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
    if (key === "language") {
      const mapped = (value === "french" ? "fr" : value === "english" ? "en" : undefined) as LanguageCode | undefined;
      if (mapped) setLanguage(mapped);
    }
  };

  return (
    <SettingsCard
      title={t("settings.localization.title")}
      description={t("settings.localization.description")}
      icon={<Globe className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-medium">{t("settings.localization.language")}</Label>
          <Select
            value={settings.language}
            onValueChange={(value: LocalizationSettings["language"]) =>
              handleChange("language", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("settings.localization.placeholders.selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">{t("settings.localization.languages.en")}</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
              <SelectItem value="urdu">Urdu</SelectItem>
              <SelectItem value="french">{t("settings.localization.languages.fr")}</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("settings.localization.interfaceLanguageHelp")}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="font-medium">{t("settings.localization.timeFormat")}</Label>
          <RadioGroup
            value={settings.timeFormat}
            onValueChange={(value: LocalizationSettings["timeFormat"]) =>
              handleChange("timeFormat", value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12h" id="time-12h" />
              <Label htmlFor="time-12h">{t("settings.localization.h12")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24h" id="time-24h" />
              <Label htmlFor="time-24h">{t("settings.localization.h24")}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="font-medium">{t("settings.localization.dateFormat")}</Label>
          <RadioGroup
            value={settings.dateFormat}
            onValueChange={(value: LocalizationSettings["dateFormat"]) =>
              handleChange("dateFormat", value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MM/DD/YYYY" id="date-us" />
              <Label htmlFor="date-us">{t("settings.localization.dateUS")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DD/MM/YYYY" id="date-eu" />
              <Label htmlFor="date-eu">{t("settings.localization.dateEU")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="YYYY-MM-DD" id="date-iso" />
              <Label htmlFor="date-iso">{t("settings.localization.dateISO")}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="font-medium">{t("settings.localization.firstDayOfWeek")}</Label>
          <Select
            value={settings.firstDayOfWeek}
            onValueChange={(value: LocalizationSettings["firstDayOfWeek"]) =>
              handleChange("firstDayOfWeek", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("settings.localization.placeholders.selectFirstDay")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday">{t("settings.localization.days.sunday")}</SelectItem>
              <SelectItem value="monday">{t("settings.localization.days.monday")}</SelectItem>
              <SelectItem value="saturday">{t("settings.localization.days.saturday")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="region" className="font-medium">{t("settings.localization.regionCode")}</Label>
          <Input
            id="region"
            value={settings.region}
            onChange={(e) => handleChange("region", e.target.value)}
            placeholder="US, UK, AE, etc."
            maxLength={2}
            className="w-24 uppercase"
          />
          <p className="text-xs text-muted-foreground">
            ISO country code for regional settings
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}

// =============================================================================
// USER EXPERIENCE SETTINGS SECTION
// =============================================================================
interface UserExperienceSettingsSectionProps {
  settings: UserExperienceSettings;
  onUpdate: (settings: UserExperienceSettings) => void;
}

export function UserExperienceSettingsSection(
  { settings, onUpdate }: UserExperienceSettingsSectionProps,
) {
  const handleChange = <K extends keyof UserExperienceSettings>(
    key: K,
    value: UserExperienceSettings[K],
  ) => {
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
            <Label htmlFor="guided-tours" className="font-medium">
              Guided Tours
            </Label>
            <p className="text-sm text-muted-foreground">
              Show interactive feature tours for new users
            </p>
          </div>
          <Switch
            id="guided-tours"
            checked={settings.guidedTours}
            onCheckedChange={(checked) => handleChange("guidedTours", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="keyboard-shortcuts" className="font-medium">
              Keyboard Shortcuts
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable keyboard shortcuts for common actions
            </p>
          </div>
          <Switch
            id="keyboard-shortcuts"
            checked={settings.keyboardShortcuts}
            onCheckedChange={(checked) =>
              handleChange("keyboardShortcuts", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="landing-page" className="font-medium">
            Default Landing Page
          </Label>
          <Select
            value={settings.defaultLandingPage}
            onValueChange={(
              value: UserExperienceSettings["defaultLandingPage"],
            ) => handleChange("defaultLandingPage", value)}
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
          <p className="text-xs text-muted-foreground mt-1">
            Page shown after login
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="widget-customization" className="font-medium">
              Widget Customization
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow users to customize dashboard widgets
            </p>
          </div>
          <Switch
            id="widget-customization"
            checked={settings.widgetCustomization}
            onCheckedChange={(checked) =>
              handleChange("widgetCustomization", checked)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
