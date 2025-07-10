import { TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Bell,
  BookOpen,
  Bug,
  Database,
  Globe,
  LayoutDashboard,
  Mail,
  Network,
  Shield,
  UserCheck,
} from "lucide-react";

export function SettingsTabs() {
  const tabs = [
    { value: "appearance", label: "Appearance", icon: <LayoutDashboard className="h-5 w-5" /> },
    { value: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { value: "security", label: "Security", icon: <Shield className="h-5 w-5" /> },
    { value: "academic", label: "Academic", icon: <BookOpen className="h-5 w-5" /> },
    { value: "localization", label: "Localization", icon: <Globe className="h-5 w-5" /> },
    { value: "integrations", label: "Integrations", icon: <Network className="h-5 w-5" /> },
    { value: "email-schedule", label: "Email Schedule", icon: <Mail className="h-5 w-5" /> },
    { value: "data-management", label: "Data", icon: <Database className="h-5 w-5" /> },
    { value: "user-experience", label: "UX", icon: <UserCheck className="h-5 w-5" /> },
    { value: "advanced", label: "Advanced", icon: <Bug className="h-5 w-5" /> },
  ];

  return (
    <TabsList className="flex flex-col h-auto w-full items-start justify-start bg-white p-2 rounded-lg shadow-sm border border-gray-200/80">
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="w-full flex items-center justify-start text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold px-4 py-3 rounded-md transition-all duration-150"
        >
          <div className="mr-3 text-gray-500 data-[state=active]:text-blue-600">
            {tab.icon}
          </div>
          <span>{tab.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
