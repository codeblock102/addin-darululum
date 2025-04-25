
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useSettings } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Tabs } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";
import { SettingsContent } from "@/components/admin/settings/SettingsContent";
import { SettingsHeader } from "@/components/admin/settings/SettingsHeader";

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
      <div className="container mx-auto py-6 max-w-7xl">
        <SettingsHeader isSaving={isSaving} onSave={handleUpdateSettings} />
        <div className="flex flex-col gap-6">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
                <SettingsTabs />
              </div>
              <SettingsContent settings={settings} updateSettings={updateSettings} />
            </Tabs>
          </ScrollArea>
        </div>
      </div>
    </DashboardLayout>
  );
}
