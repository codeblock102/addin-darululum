import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { ChildSelector } from "@/components/parent/ChildSelector.tsx";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { DhorBook } from "@/components/dhor-book/DhorBook.tsx";

const ParentProgress = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStudentId && children.length > 0) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

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
