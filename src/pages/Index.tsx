
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useRBAC } from '@/hooks/useRBAC';

export default function Index() {
  const { isAdmin, isTeacher, isLoading } = useRBAC();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isTeacher) {
        navigate('/teacher-portal');
      }
    }
  }, [isAdmin, isTeacher, isLoading, navigate]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-primary animate-spin mb-4 mx-auto"></div>
        </div>
        <h1 className="text-2xl font-medium mb-2">Redirecting to your dashboard...</h1>
        <p className="text-muted-foreground">Please wait while we determine your role.</p>
      </div>
    </DashboardLayout>
  );
}
