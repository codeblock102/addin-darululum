
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SettingsHeader } from "@/components/admin/settings/SettingsHeader";
import { SettingsContent } from "@/components/admin/settings/SettingsContent";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";
import { useSettings } from "@/hooks/useSettings";
import { LoadingState } from "@/components/teacher-portal/LoadingState";
import { Tabs } from "@/components/ui/tabs";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const [isSaving, setIsSaving] = useState(false);
  const { settings, isLoading, updateSettings } = useSettings();
  
  const handleSave = () => {
    setIsSaving(true);
    // Call updateSettings, and when it's done, set isSaving to false
    const result = updateSettings(settings);
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingState />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <SettingsHeader isSaving={isSaving} onSave={handleSave} />
        
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} value={activeTab}>
            <SettingsTabs />
            
            <div className="space-y-6">
              <SettingsContent 
                settings={settings} 
                updateSettings={updateSettings} 
              />
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
