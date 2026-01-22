/**
 * System Settings - Groups Academic, Data Management, Integration, and Advanced settings
 * This file consolidates four related settings sections for easier maintenance.
 */
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  AcademicSettings,
  DataManagementSettings,
  IntegrationSettings,
  AdvancedSettings,
} from "@/types/settings.ts";
import {
  BookOpen,
  Bug,
  Calendar,
  Database,
  MessageSquare,
  Network,
} from "lucide-react";
import { SettingsCard } from "./SettingsCard.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

// =============================================================================
// ACADEMIC SETTINGS SECTION
// =============================================================================
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

// =============================================================================
// DATA MANAGEMENT SETTINGS SECTION
// =============================================================================
interface DataManagementSettingsSectionProps {
  settings: DataManagementSettings;
  onUpdate: (settings: DataManagementSettings) => void;
}

export function DataManagementSettingsSection(
  { settings, onUpdate }: DataManagementSettingsSectionProps,
) {
  const handleAutoBackupChange = <
    K extends keyof DataManagementSettings["autoBackup"],
  >(
    key: K,
    value: DataManagementSettings["autoBackup"][K],
  ) => {
    onUpdate({
      ...settings,
      autoBackup: {
        ...settings.autoBackup,
        [key]: value,
      },
    });
  };

  const handleDataExportChange = <
    K extends keyof DataManagementSettings["dataExport"],
  >(
    key: K,
    value: DataManagementSettings["dataExport"][K],
  ) => {
    onUpdate({
      ...settings,
      dataExport: {
        ...settings.dataExport,
        [key]: value,
      },
    });
  };

  const handleArchivePolicyChange = <
    K extends keyof DataManagementSettings["archivePolicy"],
  >(
    key: K,
    value: DataManagementSettings["archivePolicy"][K],
  ) => {
    onUpdate({
      ...settings,
      archivePolicy: {
        ...settings.archivePolicy,
        [key]: value,
      },
    });
  };

  return (
    <SettingsCard
      title="Data Management"
      description="Configure backup, export, and archiving settings"
      icon={<Database className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-backup" className="font-medium">
                Automatic Backups
              </Label>
              <p className="text-sm text-muted-foreground">
                Regularly back up system data
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={settings.autoBackup.enabled}
              onCheckedChange={(checked) =>
                handleAutoBackupChange("enabled", checked)}
            />
          </div>

          {settings.autoBackup.enabled && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm">Backup Frequency</Label>
                <Select
                  value={settings.autoBackup.frequency}
                  onValueChange={(
                    value: DataManagementSettings["autoBackup"]["frequency"],
                  ) => handleAutoBackupChange("frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention-days" className="text-sm">
                  Retention Period (Days)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="retention-days"
                    type="number"
                    min={7}
                    max={365}
                    value={settings.autoBackup.retention}
                    onChange={(e) =>
                      handleAutoBackupChange(
                        "retention",
                        parseInt(e.target.value, 10),
                      )}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How long to keep backups before automatic deletion
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 border-b pb-6">
          <Label className="font-medium">Data Export Options</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select data types to include in exports
          </p>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-student-data"
                checked={settings.dataExport.includeStudentData}
                onCheckedChange={(checked) =>
                  handleDataExportChange(
                    "includeStudentData",
                    checked === true,
                  )}
              />
              <Label htmlFor="export-student-data">Student Data</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-teacher-data"
                checked={settings.dataExport.includeTeacherData}
                onCheckedChange={(checked) =>
                  handleDataExportChange(
                    "includeTeacherData",
                    checked === true,
                  )}
              />
              <Label htmlFor="export-teacher-data">Teacher Data</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-attendance"
                checked={settings.dataExport.includeAttendance}
                onCheckedChange={(checked) =>
                  handleDataExportChange("includeAttendance", checked === true)}
              />
              <Label htmlFor="export-attendance">Attendance Records</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-progress"
                checked={settings.dataExport.includeProgress}
                onCheckedChange={(checked) =>
                  handleDataExportChange("includeProgress", checked === true)}
              />
              <Label htmlFor="export-progress">Progress Data</Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-archive" className="font-medium">
                Automatic Archiving
              </Label>
              <p className="text-sm text-muted-foreground">
                Archive old data automatically
              </p>
            </div>
            <Switch
              id="auto-archive"
              checked={settings.archivePolicy.autoArchive}
              onCheckedChange={(checked) =>
                handleArchivePolicyChange("autoArchive", checked)}
            />
          </div>

          {settings.archivePolicy.autoArchive && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="archive-months" className="text-sm">
                Archive Data Older Than
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="archive-months"
                  type="number"
                  min={1}
                  max={60}
                  value={settings.archivePolicy.afterMonths}
                  onChange={(e) =>
                    handleArchivePolicyChange(
                      "afterMonths",
                      parseInt(e.target.value, 10),
                    )}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">months</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}

// =============================================================================
// INTEGRATION SETTINGS SECTION
// =============================================================================
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

// =============================================================================
// ADVANCED SETTINGS SECTION
// =============================================================================
interface AdvancedSettingsSectionProps {
  settings: AdvancedSettings;
  onUpdate: (settings: AdvancedSettings) => void;
}

export function AdvancedSettingsSection(
  { settings, onUpdate }: AdvancedSettingsSectionProps,
) {
  const handleChange = <K extends keyof AdvancedSettings>(
    key: K,
    value: AdvancedSettings[K],
  ) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleFeatureFlagChange = <
    K extends keyof AdvancedSettings["featureFlags"],
  >(
    key: K,
    value: AdvancedSettings["featureFlags"][K],
  ) => {
    onUpdate({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [key]: value,
      },
    });
  };

  return (
    <SettingsCard
      title="Advanced Options"
      description="Configure technical and developer settings"
      icon={<Bug className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="developer-mode" className="font-medium">
              Developer Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Show advanced developer options and information
            </p>
          </div>
          <Switch
            id="developer-mode"
            checked={settings.developerMode}
            onCheckedChange={(checked) =>
              handleChange("developerMode", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="detailed-logs" className="font-medium">
              Detailed Logs
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable verbose logging for troubleshooting
            </p>
          </div>
          <Switch
            id="detailed-logs"
            checked={settings.detailedLogs}
            onCheckedChange={(checked) => handleChange("detailedLogs", checked)}
          />
        </div>

        <div className="space-y-4">
          <Label className="font-medium">Feature Flags</Label>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="beta-features" className="text-sm">
                Beta Features
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable access to upcoming features
              </p>
            </div>
            <Switch
              id="beta-features"
              checked={settings.featureFlags.betaFeatures}
              onCheckedChange={(checked) =>
                handleFeatureFlagChange("betaFeatures", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="experimental-ui" className="text-sm">
                Experimental UI
              </Label>
              <p className="text-xs text-muted-foreground">
                Try new interface designs
              </p>
            </div>
            <Switch
              id="experimental-ui"
              checked={settings.featureFlags.experimentalUi}
              onCheckedChange={(checked) =>
                handleFeatureFlagChange("experimentalUi", checked)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-medium">Performance Mode</Label>
          <RadioGroup
            value={settings.performanceMode}
            onValueChange={(value: AdvancedSettings["performanceMode"]) =>
              handleChange("performanceMode", value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="balanced" id="perf-balanced" />
              <Label htmlFor="perf-balanced">Balanced (Default)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="performance" id="perf-speed" />
              <Label htmlFor="perf-speed">
                Performance (Faster, less visual effects)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quality" id="perf-quality" />
              <Label htmlFor="perf-quality">
                Quality (More visual effects)
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </SettingsCard>
  );
}
