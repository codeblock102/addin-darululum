import { useI18n } from "@/contexts/I18nContext.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

export const TeacherPreferences = () => {
  const { t, language, setLanguage } = useI18n();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("settings.tabs.preferences", t("nav.preferences"))}</h2>

      <div className="p-4 border rounded-lg space-y-4 bg-white">
        <div className="space-y-2">
          <Label className="font-medium">{t("settings.localization.language")}</Label>
          <Select
            value={language}
            onValueChange={(val) => setLanguage(val as "en" | "fr")}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t("settings.localization.placeholders.selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("settings.localization.languages.en")}</SelectItem>
              <SelectItem value="fr">{t("settings.localization.languages.fr")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("settings.localization.interfaceLanguageHelp")}
        </p>
      </div>
    </div>
  );
};
