import { useState } from "react";
import { SettingsHeader } from "@/components/admin/settings/SettingsHeader";
import { SettingsContent } from "@/components/admin/settings/SettingsContent";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";
import { useSettings } from "@/hooks/useSettings";
import { LoadingState } from "@/components/teacher-portal/LoadingState";
import { Tabs } from "@/components/ui/tabs";

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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <SettingsHeader isSaving={isLoading} onSave={handleSave} />
      
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} value={activeTab} className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          <SettingsTabs />
          
          {settings ? (
            <SettingsContent 
              settings={settings} 
              updateSettings={updateSettings} 
            />
          ) : (
            <div className="col-span-1 md:col-span-1 flex items-center justify-center h-full">
              <p className="text-muted-foreground">Settings data is currently unavailable.</p>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
