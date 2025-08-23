import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";

const ParentAcademics = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(children[0]?.id ?? null);

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Academics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap mb-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={`px-3 py-2 rounded border ${selectedStudentId === child.id ? "bg-primary text-primary-foreground" : "bg-background"}`}
                  onClick={() => setSelectedStudentId(child.id)}
                >
                  {child.name}
                </button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Academic grades and assessments will appear here.
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ParentAcademics;


