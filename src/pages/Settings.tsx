import { useState } from "react";
import { SettingsHeader } from "@/components/admin/settings/SettingsHeader.tsx";
import { SettingsContent } from "@/components/admin/settings/SettingsContent.tsx";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs.tsx";
import { useSettings } from "@/hooks/useSettings.ts";
import { LoadingState } from "@/components/teacher-portal/LoadingState.tsx";
import { Tabs } from "@/components/ui/tabs.tsx";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const { settings, isLoading, updateSettings } = useSettings();

  const handleSave = () => {
    if (settings) {
      updateSettings(settings);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <SettingsHeader isSaving={isLoading} onSave={handleSave} />

        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          value={activeTab}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8"
        >
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <SettingsTabs />
            </div>
          </div>

          <div className="lg:col-span-9">
            {settings
              ? (
                <SettingsContent
                  settings={settings}
                  updateSettings={updateSettings}
                />
              )
              : (
                <div className="flex items-center justify-center h-full bg-white p-12 rounded-lg shadow-sm">
                  <p className="text-gray-500">
                    Settings data is currently unavailable.
                  </p>
                </div>
              )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
