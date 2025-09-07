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
import { useI18n } from "@/contexts/I18nContext.tsx";

export function SettingsTabs() {
  const { t } = useI18n();
  const tabs = [
    { value: "appearance", label: t("settings.tabs.appearance"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { value: "notifications", label: t("settings.tabs.notifications"), icon: <Bell className="h-5 w-5" /> },
    { value: "security", label: t("settings.tabs.security"), icon: <Shield className="h-5 w-5" /> },
    { value: "academic", label: t("settings.tabs.academic"), icon: <BookOpen className="h-5 w-5" /> },
    { value: "localization", label: t("settings.tabs.localization"), icon: <Globe className="h-5 w-5" /> },
    { value: "integrations", label: t("settings.tabs.integrations"), icon: <Network className="h-5 w-5" /> },
    { value: "email-schedule", label: t("settings.tabs.emailSchedule"), icon: <Mail className="h-5 w-5" /> },
    { value: "data-management", label: t("settings.tabs.dataManagement"), icon: <Database className="h-5 w-5" /> },
    { value: "user-experience", label: t("settings.tabs.userExperience"), icon: <UserCheck className="h-5 w-5" /> },
    { value: "advanced", label: t("settings.tabs.advanced"), icon: <Bug className="h-5 w-5" /> },
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
