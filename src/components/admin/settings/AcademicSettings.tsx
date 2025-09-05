import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { AcademicSettings } from "@/types/settings.ts";
import { BookOpen } from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface AcademicSettingsSectionProps {
  settings: AcademicSettings;
  onUpdate: (settings: AcademicSettings) => void;
}

export function AcademicSettingsSection(
  { settings, onUpdate }: AcademicSettingsSectionProps,
) {
  const { t } = useI18n();
  const handleChange = <K extends keyof AcademicSettings>(
    key: K,
    value: AcademicSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title={t("settings.academic.title")}
      description={t("settings.academic.description")}
      icon={<BookOpen className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="default-juz" className="font-medium">{t("settings.academic.defaultJuzPerWeek.label")}</Label>
          <Input
            id="default-juz"
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            value={settings.defaultJuzPerWeek}
            onChange={(e) =>
              handleChange("defaultJuzPerWeek", parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">{t("settings.academic.defaultJuzPerWeek.help")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendance-threshold" className="font-medium">{t("settings.academic.attendanceThreshold.label")}</Label>
          <Input
            id="attendance-threshold"
            type="number"
            min={50}
            max={100}
            value={settings.attendanceThreshold}
            onChange={(e) =>
              handleChange("attendanceThreshold", parseInt(e.target.value, 10))}
          />
          <p className="text-xs text-muted-foreground">{t("settings.academic.attendanceThreshold.help")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-frequency" className="font-medium">{t("settings.academic.reportFrequency.label")}</Label>
          <Select
            value={settings.progressReportFrequency}
            onValueChange={(value: "daily" | "weekly" | "monthly") =>
              handleChange("progressReportFrequency", value)}
          >
            <SelectTrigger id="report-frequency">
              <SelectValue placeholder={t("settings.academic.reportFrequency.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("settings.academic.reportFrequency.options.daily")}</SelectItem>
              <SelectItem value="weekly">{t("settings.academic.reportFrequency.options.weekly")}</SelectItem>
              <SelectItem value="monthly">{t("settings.academic.reportFrequency.options.monthly")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("settings.academic.reportFrequency.help")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="academic-year-start" className="font-medium">{t("settings.academic.yearStart.label")}</Label>
            <Input
              id="academic-year-start"
              type="text"
              pattern="\d{2}-\d{2}"
              placeholder={t("settings.academic.yearStart.placeholder")}
              value={settings.academicYearStart}
              onChange={(e) =>
                handleChange("academicYearStart", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("settings.academic.yearStart.help")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="academic-year-end" className="font-medium">{t("settings.academic.yearEnd.label")}</Label>
            <Input
              id="academic-year-end"
              type="text"
              pattern="\d{2}-\d{2}"
              placeholder={t("settings.academic.yearEnd.placeholder")}
              value={settings.academicYearEnd}
              onChange={(e) => handleChange("academicYearEnd", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("settings.academic.yearEnd.help")}</p>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
