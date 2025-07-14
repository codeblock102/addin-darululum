import { TabsContent } from "@/components/ui/tabs.tsx";
import { SystemSettings } from "@/types/settings.ts";
import { AppearanceSettingsSection } from "./AppearanceSettings.tsx";
import { NotificationSettingsSection } from "./NotificationSettings.tsx";
import { SecuritySettingsSection } from "./SecuritySettings.tsx";
import { AcademicSettingsSection } from "./AcademicSettings.tsx";
import { LocalizationSettingsSection } from "./LocalizationSettings.tsx";
import { IntegrationSettingsSection } from "./IntegrationSettings.tsx";
import { DataManagementSettingsSection } from "./DataManagementSettings.tsx";
import { UserExperienceSettingsSection } from "./UserExperienceSettings.tsx";
import { AdvancedSettingsSection } from "./AdvancedSettings.tsx";
import { EmailScheduleManager } from "../EmailScheduleManager.tsx";

interface SettingsContentProps {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export function SettingsContent(
  { settings, updateSettings }: SettingsContentProps,
) {
  const commonProps = {
    className: "mt-0 data-[state=active]:animate-fadeIn"
  };

  return (
    <>
      <TabsContent value="appearance" {...commonProps}>
        <AppearanceSettingsSection
          settings={settings.appearance}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, appearance: newSettings })}
        />
      </TabsContent>

      <TabsContent value="notifications" {...commonProps}>
        <NotificationSettingsSection
          settings={settings.notifications}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, notifications: newSettings })}
        />
      </TabsContent>

      <TabsContent value="security" {...commonProps}>
        <SecuritySettingsSection
          settings={settings.security}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, security: newSettings })}
        />
      </TabsContent>

      <TabsContent value="academic" {...commonProps}>
        <AcademicSettingsSection
          settings={settings.academic}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, academic: newSettings })}
        />
      </TabsContent>

      <TabsContent value="localization" {...commonProps}>
        <LocalizationSettingsSection
          settings={settings.localization}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, localization: newSettings })}
        />
      </TabsContent>

      <TabsContent value="integrations" className="animate-slideIn">
        <IntegrationSettingsSection
          settings={settings.integrations}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, integrations: newSettings })}
        />
      </TabsContent>

      <TabsContent value="email-schedule" className="animate-slideIn">
        <EmailScheduleManager />
      </TabsContent>

      <TabsContent value="data-management" className="animate-slideIn">
        <DataManagementSettingsSection
          settings={settings.dataManagement}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, dataManagement: newSettings })}
        />
      </TabsContent>

      <TabsContent value="user-experience" className="animate-slideIn">
        <UserExperienceSettingsSection
          settings={settings.userExperience}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, userExperience: newSettings })}
        />
      </TabsContent>

      <TabsContent value="advanced" className="animate-slideIn">
        <AdvancedSettingsSection
          settings={settings.advancedOptions}
          onUpdate={(newSettings) =>
            updateSettings({ ...settings, advancedOptions: newSettings })}
        />
      </TabsContent>
    </>
  );
}
