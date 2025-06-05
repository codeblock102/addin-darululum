import React from 'react';
import { DashboardLayout } from "@/components/layouts/DashboardLayout.tsx";
import { TeacherPreferences } from "@/components/teacher-portal/TeacherPreferences.tsx";

export default function Preferences() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Teacher Preferences</h1>
        <TeacherPreferences />
      </div>
    </DashboardLayout>
  );
}
