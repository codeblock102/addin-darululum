import { Teacher } from "@/types/teacher.ts";
import { BookOpen, Mail, Phone, User, Loader2, Sparkles, Shield, Crown } from "lucide-react";
import { Card } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
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
  
  return (
    <div className="relative mb-6">
      {/* Clean white card with subtle border */}
      <Card className={`overflow-hidden border border-gray-200 shadow-sm bg-white rounded-xl ${isAdmin ? 'shadow-lg border-gray-300' : 'shadow-sm border-gray-200'}`}>
        <div className="relative">
          <div className={`p-4 sm:p-6 lg:p-8 ${isAdmin ? 'p-6 sm:p-8 lg:p-10' : 'p-4 sm:p-6 lg:p-8'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Enhanced avatar section */}
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shadow-sm border-2",
                  isAdmin 
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-200" 
                    : "bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] to-[hsl(142.8,64.2%,32%)] border-[hsl(142.8,64.2%,24.1%)]/20"
                )}>
                  {isAdmin ? (
                    <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {teacher.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                {isAdmin && (
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Shield className="w-2 h-2 text-white" />
                  </div>
                )}
                {!isAdmin && (
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>

              {/* Enhanced content section */}
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                    <span className="truncate">
                      {isAdmin ? t("pages.teacherPortal.header.adminTitle") : `${t("pages.teacherPortal.header.teacherWelcomePrefix")}, ${teacher.name}`}
                    </span>
                    {isAdmin ? (
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0" />
                    ) : (
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(142.8,64.2%,24.1%)] flex-shrink-0" />
                    )}
                  </h1>
                  <p className="text-base text-black">{isAdmin ? t("pages.teacherPortal.header.adminSubtitle") : t("pages.teacherPortal.header.teacherSubtitle")}</p>
                </div>

                {/* Assigned Classes */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">{isAdmin ? t("pages.teacherPortal.header.systemOverview") : t("pages.teacherPortal.header.assignedClasses")}</h3>
                  {isAdmin ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium border border-amber-200">{t("pages.teacherPortal.header.adminBadges.fullAccess")}</span>
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium border border-blue-200">{t("pages.teacherPortal.header.adminBadges.userManagement")}</span>
                      <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-medium border border-green-200">{t("pages.teacherPortal.header.adminBadges.dataAnalytics")}</span>
                    </div>
                  ) : (
                    isLoadingClasses ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(142.8,64.2%,24.1%)]" />
                        <span className="text-sm text-black">{t("pages.teacherPortal.header.loadingClasses")}</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {classes?.map((c) => (
                          <span
                            key={c.id}
                            className="px-3 py-1.5 bg-[hsl(142.8,64.2%,24.1%)]/10 text-[hsl(142.8,64.2%,24.1%)] rounded-lg text-xs font-medium border border-[hsl(142.8,64.2%,24.1%)]/20"
                          >
                            {c.name}
                          </span>
                        ))}
                        {(!classes || classes.length === 0) && (
                          <span className="text-sm text-black italic">{t("pages.teacherPortal.header.noClasses")}</span>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Enhanced contact info for larger screens */}
               
              </div>
            </div>

            {/* Mobile contact info */}
            <div className="sm:hidden w-full space-y-2 mt-4">
              {teacher.email && (
                <div className="flex items-center gap-2 text-sm text-black bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-2 text-sm text-black bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span>{teacher.phone}</span>
                </div>
              )}
            </div>

            {/* Bio section with enhanced mobile design */}
            {teacher.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-black leading-relaxed">
                    {teacher.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
