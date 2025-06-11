import { Teacher } from "@/types/teacher";
import { BookOpen, Mail, Phone, User } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardHeaderProps {
  teacher: Teacher;
}

export const DashboardHeader = ({ teacher }: DashboardHeaderProps) => {
  return (
    <div className="relative mb-6">
      {/* Enhanced gradient background with better mobile design */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10 rounded-2xl -z-10">
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="relative">
          {/* Decorative pattern overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full">
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Enhanced avatar section */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {teacher.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Enhanced content section */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                    <span>Welcome back, {teacher.name}</span>
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Ready to inspire and guide your students today
                  </p>
                </div>

                {/* Enhanced subject badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-sm font-medium shadow-sm">
                    <BookOpen className="h-4 w-4" />
                    {teacher.subject}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Teacher ID: {teacher.id.slice(0, 8)}...
                  </span>
                </div>

                {/* Enhanced contact info for larger screens */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                  {teacher.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-48">{teacher.email}</span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile contact info */}
              <div className="sm:hidden w-full space-y-2">
                {teacher.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                )}
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{teacher.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio section with enhanced mobile design */}
            {teacher.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
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
