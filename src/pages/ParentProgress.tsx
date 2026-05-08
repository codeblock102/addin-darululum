import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { ChildSelector } from "@/components/parent/ChildSelector.tsx";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { DhorBook } from "@/components/dhor-book/DhorBook.tsx";
import { useStudentTeacher } from "@/hooks/useStudentTeacher.ts";
import { GraduationCap } from "lucide-react";

const ParentProgress = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStudentId && children.length > 0) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  const { data: studentTeachers = [] } = useStudentTeacher(selectedStudentId ?? undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Qur'an Progress</h1>
        <p className="text-muted-foreground text-sm mb-4">View your child's memorisation book.</p>
        <ChildSelector
          children={children}
          selectedId={selectedStudentId}
          onSelect={setSelectedStudentId}
        />

        {/* Teacher info — shown when a child is selected and teacher data is available */}
        {selectedStudentId && studentTeachers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {studentTeachers.map((t) => (
              <div
                key={`${t.id}-${t.className}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-sm"
              >
                <GraduationCap className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium text-green-800">{t.name}</span>
                <span className="text-green-500 text-xs">· {t.className}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStudentId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dhor Book</CardTitle>
          </CardHeader>
          <CardContent>
            <DhorBook
              studentId={selectedStudentId}
              isAdmin={false}
              isLoadingTeacher={false}
              readOnly={true}
              skipAuth={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentProgress;
