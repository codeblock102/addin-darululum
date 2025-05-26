import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { AdminMessaging } from "@/components/admin/messaging/AdminMessaging";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isAdmin, isLoading } = useRBAC();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader title="Admin Dashboard" description="Monitor and manage your education system" />
        
        <WelcomeHeader />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <DashboardStats />
            <DashboardTabs />
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="p-6 rounded-lg border shadow-sm bg-gray-700">
              <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
              <p>Advanced analytics features coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="messages">
            <AdminMessaging />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
