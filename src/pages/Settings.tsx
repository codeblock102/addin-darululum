import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AppearanceSettingsSection } from "@/components/admin/settings/AppearanceSettings";
import { NotificationSettingsSection } from "@/components/admin/settings/NotificationSettings";
import { SecuritySettingsSection } from "@/components/admin/settings/SecuritySettings";
import { AcademicSettingsSection } from "@/components/admin/settings/AcademicSettings";
import { LocalizationSettingsSection } from "@/components/admin/settings/LocalizationSettings";
import { IntegrationSettingsSection } from "@/components/admin/settings/IntegrationSettings";
import { DataManagementSettingsSection } from "@/components/admin/settings/DataManagementSettings";
import { UserExperienceSettingsSection } from "@/components/admin/settings/UserExperienceSettings";
import { AdvancedSettingsSection } from "@/components/admin/settings/AdvancedSettings";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, Bell, Shield, BookOpen, Globe, Network, Database, UserCheck, Bug } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appearance");
  const { settings, updateSettings, isLoading, error } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();

  if (!isRoleLoading && !isAdmin) {
    toast({
      title: "Access Denied",
      description: "Only administrators can access the settings page",
      variant: "destructive"
    });
    navigate("/");
    return null;
  }

  if (isLoading || isRoleLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2">
          <p className="text-destructive">Error loading settings</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    const result = await updateSettings(settings);
    setIsSaving(false);
    
    if (result.success) {
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully."
      });
    } else {
      toast({
        title: "Failed to update settings",
        description: "There was an error saving your changes.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure application settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6 overflow-x-auto">
              <TabsList className="inline-flex min-w-full p-1 h-auto flex-nowrap">
                <TabsTrigger value="appearance" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <BookOpen className="h-4 w-4" />
                  <span>Academic</span>
                </TabsTrigger>
                <TabsTrigger value="localization" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <Globe className="h-4 w-4" />
                  <span>Localization</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <Network className="h-4 w-4" />
                  <span>Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="data-management" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <Database className="h-4 w-4" />
                  <span>Data</span>
                </TabsTrigger>
                <TabsTrigger value="user-experience" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <UserCheck className="h-4 w-4" />
                  <span>UX</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-1 py-2 px-3 transition-all duration-200 hover:scale-105">
                  <Bug className="h-4 w-4" />
                  <span>Advanced</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-6">
              <TabsContent value="appearance" className="animate-slideIn">
                <AppearanceSettingsSection
                  settings={settings.appearance}
                  onUpdate={(newSettings) => updateSettings({ ...settings, appearance: newSettings })}
                />
              </TabsContent>
              
              <TabsContent value="notifications" className="animate-slideIn">
                <NotificationSettingsSection
                  settings={settings.notifications}
                  onUpdate={(newSettings) => updateSettings({ ...settings, notifications: newSettings })}
                />
              </TabsContent>
              
              <TabsContent value="security" className="animate-slideIn">
                <SecuritySettingsSection
                  settings={settings.security}
                  onUpdate={(newSettings) => updateSettings({ ...settings, security: newSettings })}
                />
              </TabsContent>
              
              <TabsContent value="academic" className="animate-slideIn">
                <AcademicSettingsSection
                  settings={settings.academic}
                  onUpdate={(newSettings) => updateSettings({ ...settings, academic: newSettings })}
                />
              </TabsContent>

              <TabsContent value="localization" className="animate-slideIn">
                <LocalizationSettingsSection
                  settings={settings.localization}
                  onUpdate={(newSettings) => updateSettings({ ...settings, localization: newSettings })}
                />
              </TabsContent>

              <TabsContent value="integrations" className="animate-slideIn">
                <IntegrationSettingsSection
                  settings={settings.integrations}
                  onUpdate={(newSettings) => updateSettings({ ...settings, integrations: newSettings })}
                />
              </TabsContent>

              <TabsContent value="data-management" className="animate-slideIn">
                <DataManagementSettingsSection
                  settings={settings.dataManagement}
                  onUpdate={(newSettings) => updateSettings({ ...settings, dataManagement: newSettings })}
                />
              </TabsContent>

              <TabsContent value="user-experience" className="animate-slideIn">
                <UserExperienceSettingsSection
                  settings={settings.userExperience}
                  onUpdate={(newSettings) => updateSettings({ ...settings, userExperience: newSettings })}
                />
              </TabsContent>

              <TabsContent value="advanced" className="animate-slideIn">
                <AdvancedSettingsSection
                  settings={settings.advancedOptions}
                  onUpdate={(newSettings) => updateSettings({ ...settings, advancedOptions: newSettings })}
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end">
            <Button 
              onClick={handleUpdateSettings} 
              disabled={isSaving}
              className="px-6 transition-all duration-200 hover:scale-105"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
