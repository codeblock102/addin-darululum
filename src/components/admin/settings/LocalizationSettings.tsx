import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { LocalizationSettings } from "@/types/settings.ts";
import { Globe } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { type LanguageCode } from "@/i18n/translations.ts";

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
