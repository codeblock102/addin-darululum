import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { AdminMessaging } from "@/components/admin/messaging/AdminMessaging";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  return <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader title="Admin Dashboard" description="Monitor and manage your education system" />
        
        <WelcomeHeader />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-900">
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
    </DashboardLayout>;
}