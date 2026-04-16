import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, TrendingUp, Users } from "lucide-react";
import { SummaryData } from "@/types/teacher";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface DashboardSummaryProps {
  summaryData: SummaryData | undefined;
}

export const DashboardSummary = ({ summaryData }: DashboardSummaryProps) => {
  const { t } = useI18n();

  const cards = [
    {
      label: t("pages.teacherPortal.summary.totalStudents"),
      value: summaryData?.studentsCount || 0,
      icon: <Users className="h-4 w-4 text-green-600" />,
      iconBg: "bg-green-100",
      meta: `${summaryData?.recentProgressEntries || 0} ${t("pages.teacherPortal.summary.entriesSuffix")}`,
      metaLabel: t("pages.teacherPortal.summary.recentProgress"),
      metaColor: "text-green-600",
    },
    {
      label: t("pages.teacherPortal.summary.todaysClasses"),
      value: summaryData?.todayClasses || 0,
      icon: <BookOpen className="h-4 w-4 text-amber-600" />,
      iconBg: "bg-amber-100",
      meta: summaryData?.averageQuality || t("pages.teacherPortal.summary.na"),
      metaLabel: t("pages.teacherPortal.summary.averageQuality"),
      metaColor: "text-amber-600",
    },
    {
      label: t("pages.teacherPortal.summary.totalRevisions"),
      value: summaryData?.totalRevisions || 0,
      icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      meta: `${summaryData?.pendingRevisions || 0} ${t("pages.teacherPortal.summary.revisionsSuffix")}`,
      metaLabel: t("pages.teacherPortal.summary.pending"),
      metaColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <Card key={i} className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>{card.icon}</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-3">{card.value}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>{card.metaLabel}:</span>
              <span className={`font-semibold ${card.metaColor}`}>{card.meta}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
