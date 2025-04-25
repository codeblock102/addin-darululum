
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DataManagementSettings } from "@/types/settings";
import { Database } from "lucide-react";
import { SettingsCard } from "./SettingsCard";

interface DataManagementSettingsSectionProps {
  settings: DataManagementSettings;
  onUpdate: (settings: DataManagementSettings) => void;
}

export function DataManagementSettingsSection({ settings, onUpdate }: DataManagementSettingsSectionProps) {
  const handleAutoBackupChange = <K extends keyof DataManagementSettings['autoBackup']>(
    key: K,
    value: DataManagementSettings['autoBackup'][K]
  ) => {
    onUpdate({
      ...settings,
      autoBackup: {
        ...settings.autoBackup,
        [key]: value,
      },
    });
  };

  const handleDataExportChange = <K extends keyof DataManagementSettings['dataExport']>(
    key: K,
    value: DataManagementSettings['dataExport'][K]
  ) => {
    onUpdate({
      ...settings,
      dataExport: {
        ...settings.dataExport,
        [key]: value,
      },
    });
  };

  const handleArchivePolicyChange = <K extends keyof DataManagementSettings['archivePolicy']>(
    key: K,
    value: DataManagementSettings['archivePolicy'][K]
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
              <Label htmlFor="auto-backup" className="font-medium">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">Regularly back up system data</p>
            </div>
            <Switch
              id="auto-backup"
              checked={settings.autoBackup.enabled}
              onCheckedChange={(checked) => handleAutoBackupChange('enabled', checked)}
            />
          </div>
          
          {settings.autoBackup.enabled && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm">Backup Frequency</Label>
                <Select 
                  value={settings.autoBackup.frequency}
                  onValueChange={(value: DataManagementSettings['autoBackup']['frequency']) => 
                    handleAutoBackupChange('frequency', value)}
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
                <Label htmlFor="retention-days" className="text-sm">Retention Period (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="retention-days"
                    type="number"
                    min={7}
                    max={365}
                    value={settings.autoBackup.retention}
                    onChange={(e) => handleAutoBackupChange('retention', parseInt(e.target.value, 10))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground">How long to keep backups before automatic deletion</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4 border-b pb-6">
          <Label className="font-medium">Data Export Options</Label>
          <p className="text-sm text-muted-foreground mb-2">Select data types to include in exports</p>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-student-data" 
                checked={settings.dataExport.includeStudentData}
                onCheckedChange={(checked) => 
                  handleDataExportChange('includeStudentData', checked === true)}
              />
              <Label htmlFor="export-student-data">Student Data</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-teacher-data" 
                checked={settings.dataExport.includeTeacherData}
                onCheckedChange={(checked) => 
                  handleDataExportChange('includeTeacherData', checked === true)}
              />
              <Label htmlFor="export-teacher-data">Teacher Data</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-attendance" 
                checked={settings.dataExport.includeAttendance}
                onCheckedChange={(checked) => 
                  handleDataExportChange('includeAttendance', checked === true)}
              />
              <Label htmlFor="export-attendance">Attendance Records</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="export-progress" 
                checked={settings.dataExport.includeProgress}
                onCheckedChange={(checked) => 
                  handleDataExportChange('includeProgress', checked === true)}
              />
              <Label htmlFor="export-progress">Progress Data</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-archive" className="font-medium">Automatic Archiving</Label>
              <p className="text-sm text-muted-foreground">Archive old data automatically</p>
            </div>
            <Switch
              id="auto-archive"
              checked={settings.archivePolicy.autoArchive}
              onCheckedChange={(checked) => handleArchivePolicyChange('autoArchive', checked)}
            />
          </div>
          
          {settings.archivePolicy.autoArchive && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="archive-months" className="text-sm">Archive Data Older Than</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="archive-months"
                  type="number"
                  min={1}
                  max={60}
                  value={settings.archivePolicy.afterMonths}
                  onChange={(e) => handleArchivePolicyChange('afterMonths', parseInt(e.target.value, 10))}
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
