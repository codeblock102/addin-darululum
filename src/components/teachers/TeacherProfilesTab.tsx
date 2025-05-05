
import { useState } from "react";
import { TeacherList } from "@/components/teachers/TeacherList";
import { SearchInput } from "@/components/table/SearchInput";
import { Card } from "@/components/ui/card";
import { Teacher } from "@/types/teacher";

interface TeacherProfilesTabProps {
  onEditTeacher: (teacher: Teacher) => void;
}

export function TeacherProfilesTab({ onEditTeacher }: TeacherProfilesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Card className="bg-card border rounded-lg shadow">
      <div className="p-4">
        <SearchInput
          placeholder="Search teachers by name, subject, or email..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      
      <div className="border-t">
        <TeacherList 
          searchQuery={searchQuery}
          onEdit={onEditTeacher}
        />
      </div>
    </Card>
  );
}
