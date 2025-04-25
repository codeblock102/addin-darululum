
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, Bell, Shield, BookOpen, Globe, 
  Network, Database, UserCheck, Bug 
} from "lucide-react";

export function SettingsTabs() {
  return (
    <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
      <TabsTrigger
        value="appearance"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <LayoutDashboard className="h-4 w-4 mr-2" />
        <span>Appearance</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="notifications"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <Bell className="h-4 w-4 mr-2" />
        <span>Notifications</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="security"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <Shield className="h-4 w-4 mr-2" />
        <span>Security</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="academic"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        <span>Academic</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="localization"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <Globe className="h-4 w-4 mr-2" />
        <span>Localization</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="integrations"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <Network className="h-4 w-4 mr-2" />
        <span>Integrations</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="data-management"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <Database className="h-4 w-4 mr-2" />
        <span>Data</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="user-experience"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <UserCheck className="h-4 w-4 mr-2" />
        <span>UX</span>
      </TabsTrigger>
      
      <TabsTrigger
        value="advanced"
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <Bug className="h-4 w-4 mr-2" />
        <span>Advanced</span>
      </TabsTrigger>
    </TabsList>
  );
}
