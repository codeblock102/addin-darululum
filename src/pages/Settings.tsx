
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SettingsHeader } from "@/components/admin/settings/SettingsHeader";
import { SettingsContent } from "@/components/admin/settings/SettingsContent";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";
import { useSettings } from "@/hooks/useSettings";
import { LoadingState } from "@/components/teacher-portal/LoadingState";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const { settings, isLoading, updateSettings } = useSettings();
  
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
        <SettingsHeader />
        
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="space-y-6">
            <SettingsContent 
              activeTab={activeTab} 
              settings={settings} 
              updateSettings={updateSettings} 
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
