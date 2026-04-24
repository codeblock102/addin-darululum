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
    <div className="min-h-screen bg-[#f5f6fa] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <SettingsHeader isSaving={isLoading} onSave={handleSave} />

        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          value={activeTab}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <div className="lg:col-span-3">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SettingsTabs />
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {settings
                ? <SettingsContent settings={settings} updateSettings={updateSettings} />
                : (
                  <div className="flex items-center justify-center p-16">
                    <p className="text-gray-400 text-sm">Settings data is currently unavailable.</p>
                  </div>
                )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
