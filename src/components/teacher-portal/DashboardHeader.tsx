import { Teacher } from "@/types/teacher.ts";
import { BookOpen, Mail, Phone, User, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card.tsx";

interface DashboardHeaderProps {
  teacher: Teacher;
  classes?: { id: string; name: string; subject: string }[];
  isLoadingClasses: boolean;
}

export const DashboardHeader = (
  { teacher, classes, isLoadingClasses }: DashboardHeaderProps,
) => {
  return (
    <div className="relative mb-6">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] via-[hsl(142.8,64.2%,28%)] to-[hsl(142.8,64.2%,32%)] rounded-3xl -z-10 shadow-2xl">
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full">
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full">
      </div>

      <Card className="overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl">
        <div className="relative">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Enhanced avatar section */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] to-[hsl(142.8,64.2%,32%)] flex items-center justify-center shadow-lg border-2 border-white/20">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {teacher.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>

              {/* Enhanced content section */}
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2 sm:gap-3">
                    <span className="truncate">Welcome back, {teacher.name}</span>
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(142.8,64.2%,24.1%)] flex-shrink-0" />
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Ready to inspire and guide your students today
                  </p>
                </div>

                {/* Assigned Classes */}
                <div className="pt-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Assigned Classes
                  </h3>
                  {isLoadingClasses
                    ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(142.8,64.2%,24.1%)]" />
                        <span className="text-sm text-gray-500">
                          Loading classes...
                        </span>
                      </div>
                    )
                    : (
                      <div className="flex flex-wrap items-center gap-2">
                        {classes?.map((c) => (
                          <span
                            key={c.id}
                            className="px-3 py-1.5 bg-[hsl(142.8,64.2%,24.1%)]/10 text-[hsl(142.8,64.2%,24.1%)] rounded-xl text-xs font-medium border border-[hsl(142.8,64.2%,24.1%)]/20"
                          >
                            {c.name}
                          </span>
                        ))}
                        {(!classes || classes.length === 0) && (
                          <span className="text-sm text-gray-400 italic">
                            No classes assigned yet
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {/* Enhanced contact info for larger screens */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                  {teacher.email && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <Mail className="h-4 w-4 text-[hsl(142.8,64.2%,24.1%)]" />
                      <span className="truncate max-w-48">{teacher.email}</span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <Phone className="h-4 w-4 text-[hsl(142.8,64.2%,24.1%)]" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile contact info */}
            <div className="sm:hidden w-full space-y-2 mt-4">
              {teacher.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Mail className="h-4 w-4 text-[hsl(142.8,64.2%,24.1%)] flex-shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Phone className="h-4 w-4 text-[hsl(142.8,64.2%,24.1%)] flex-shrink-0" />
                  <span>{teacher.phone}</span>
                </div>
              )}
            </div>

            {/* Bio section with enhanced mobile design */}
            {teacher.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-[hsl(142.8,64.2%,24.1%)] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">
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
