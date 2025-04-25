import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AppearanceSettingsSection } from "@/components/admin/settings/AppearanceSettings";
import { NotificationSettingsSection } from "@/components/admin/settings/NotificationSettings";
import { SecuritySettingsSection } from "@/components/admin/settings/SecuritySettings";
import { AcademicSettingsSection } from "@/components/admin/settings/AcademicSettings";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="appearance" className="transition-all duration-200 hover:scale-105">Appearance</TabsTrigger>
              <TabsTrigger value="notifications" className="transition-all duration-200 hover:scale-105">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="transition-all duration-200 hover:scale-105">Security</TabsTrigger>
              <TabsTrigger value="academic" className="transition-all duration-200 hover:scale-105">Academic</TabsTrigger>
            </TabsList>

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
