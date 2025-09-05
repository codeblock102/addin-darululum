import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { RecentActivity } from "./RecentActivity.tsx";
import { WeeklySchedule } from "./WeeklySchedule.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

export const DashboardTabs = () => {
  const { t } = useI18n();
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-3 mb-6 bg-gray-800">
        <TabsTrigger value="overview">{t("pages.dashboard.tabs.overview")}</TabsTrigger>
        <TabsTrigger value="progress">{t("pages.dashboard.tabs.progress")}</TabsTrigger>
        <TabsTrigger value="attendance">{t("pages.dashboard.tabs.attendance")}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-800">
          <RecentActivity />
          <WeeklySchedule />
        </div>
      </TabsContent>

      <TabsContent value="progress" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.dashboard.tabs.studentProgressTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="flex items-center justify-center h-64 text-muted-foreground">{t("pages.dashboard.tabs.progressPlaceholder")}</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attendance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.dashboard.tabs.attendanceTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="flex items-center justify-center h-64 text-muted-foreground">{t("pages.dashboard.tabs.attendancePlaceholder")}</div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
