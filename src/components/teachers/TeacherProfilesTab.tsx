import { useState } from "react";
import { TeacherList } from "@/components/teachers/TeacherList";
import { SearchInput } from "@/components/table/SearchInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Teacher } from "@/types/teacher";
import { Users, Search } from "lucide-react";

interface TeacherProfilesTabProps {
  onEditTeacher: (teacher: Teacher) => void;
  madrassahId?: string;
}

export function TeacherProfilesTab(
  { onEditTeacher, madrassahId }: TeacherProfilesTabProps,
) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Profiles</h2>
          <p className="text-gray-600 mt-1">
            View and manage teacher information, subjects, and contact details
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>All teachers</span>
        </div>
      </div>

      {/* Search Section */}
      <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Search Teachers
            </label>
            <SearchInput
              placeholder="Search by name, subject, or email..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full bg-white border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teacher List */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-xl">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            Teacher Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TeacherList
            searchQuery={searchQuery}
            onEdit={onEditTeacher}
            madrassahId={madrassahId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
