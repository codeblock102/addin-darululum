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

interface AcademicSettingsSectionProps {
  settings: AcademicSettings;
  onUpdate: (settings: AcademicSettings) => void;
}

export function AcademicSettingsSection(
  { settings, onUpdate }: AcademicSettingsSectionProps,
) {
  const handleChange = <K extends keyof AcademicSettings>(
    key: K,
    value: AcademicSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <SettingsCard
      title="Academic Settings"
      description="Configure academic parameters and thresholds"
      icon={<BookOpen className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="default-juz" className="font-medium">
            Default Juz Per Week
          </Label>
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
          <p className="text-xs text-muted-foreground">
            Default expected progress rate for students
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendance-threshold" className="font-medium">
            Attendance Threshold (%)
          </Label>
          <Input
            id="attendance-threshold"
            type="number"
            min={50}
            max={100}
            value={settings.attendanceThreshold}
            onChange={(e) =>
              handleChange("attendanceThreshold", parseInt(e.target.value, 10))}
          />
          <p className="text-xs text-muted-foreground">
            Minimum attendance percentage required
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-frequency" className="font-medium">
            Progress Report Frequency
          </Label>
          <Select
            value={settings.progressReportFrequency}
            onValueChange={(value: "daily" | "weekly" | "monthly") =>
              handleChange("progressReportFrequency", value)}
          >
            <SelectTrigger id="report-frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How often to generate progress reports
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="academic-year-start" className="font-medium">
              Academic Year Start
            </Label>
            <Input
              id="academic-year-start"
              type="text"
              pattern="\d{2}-\d{2}"
              placeholder="MM-DD"
              value={settings.academicYearStart}
              onChange={(e) =>
                handleChange("academicYearStart", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Format: MM-DD</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="academic-year-end" className="font-medium">
              Academic Year End
            </Label>
            <Input
              id="academic-year-end"
              type="text"
              pattern="\d{2}-\d{2}"
              placeholder="MM-DD"
              value={settings.academicYearEnd}
              onChange={(e) => handleChange("academicYearEnd", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Format: MM-DD</p>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
