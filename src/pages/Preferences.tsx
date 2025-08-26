import { TeacherPreferences } from "@/components/teacher-portal/TeacherPreferences.tsx";

export default function Preferences() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Teacher Preferences</h1>
      <TeacherPreferences />
    </div>
  );
}
