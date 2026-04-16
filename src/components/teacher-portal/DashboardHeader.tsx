import { Teacher } from "@/types/teacher.ts";
import { BookOpen, Mail, Loader2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface DashboardHeaderProps {
  teacher: Teacher;
  classes?: { id: string; name: string; subject: string }[];
  isLoadingClasses: boolean;
}

export const DashboardHeader = (
  { teacher, classes, isLoadingClasses }: DashboardHeaderProps,
) => {
  const { t } = useI18n();
  const isAdmin = teacher.subject === "Administration";

  const initials = teacher.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-sm ${
              isAdmin
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isAdmin
              ? <ShieldCheck className="h-6 w-6" />
              : <span>{initials}</span>}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {isAdmin
                  ? t("pages.teacherPortal.header.adminTitle")
                  : `${t("pages.teacherPortal.header.teacherWelcomePrefix")}, ${teacher.name}`}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                  isAdmin
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isAdmin ? "Admin" : "Teacher"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {isAdmin
                ? t("pages.teacherPortal.header.adminSubtitle")
                : t("pages.teacherPortal.header.teacherSubtitle")}
            </p>

            {/* Classes / capabilities row */}
            {isAdmin
              ? (
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-100">
                    {t("pages.teacherPortal.header.adminBadges.fullAccess")}
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                    {t("pages.teacherPortal.header.adminBadges.userManagement")}
                  </span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-100">
                    {t("pages.teacherPortal.header.adminBadges.dataAnalytics")}
                  </span>
                </div>
              )
              : isLoadingClasses
              ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("pages.teacherPortal.header.loadingClasses")}</span>
                </div>
              )
              : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  {classes && classes.length > 0
                    ? classes.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                      >
                        {c.name}
                      </span>
                    ))
                    : (
                      <span className="text-xs text-gray-400 italic">
                        {t("pages.teacherPortal.header.noClasses")}
                      </span>
                    )}
                </div>
              )}
          </div>

          {/* Email — desktop only, right-aligned */}
          {teacher.email && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate max-w-[160px]">{teacher.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
