
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherPreferences } from "@/components/teacher-portal/TeacherPreferences";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Preferences() {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/teacher-portal")} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Teacher Preferences</h1>
        </div>
        <TeacherPreferences />
      </div>
    </DashboardLayout>
  );
}
