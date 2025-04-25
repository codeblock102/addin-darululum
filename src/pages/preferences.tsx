
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherPreferences } from "@/components/teacher-portal/TeacherPreferences";

export default function Preferences() {
  return (
    <DashboardLayout>
      <TeacherPreferences />
    </DashboardLayout>
  );
}
