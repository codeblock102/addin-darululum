
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Users, BookOpen, GraduationCap, Clock } from "lucide-react";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, Admin</h1>
          <p className="text-gray-500">Here's what's happening with your students today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value="156"
            icon={<Users className="text-primary" size={24} />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Average Attendance"
            value="92%"
            icon={<Clock className="text-primary" size={24} />}
            trend={{ value: 3, isPositive: true }}
          />
          <StatsCard
            title="Completion Rate"
            value="78%"
            icon={<GraduationCap className="text-primary" size={24} />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Active Classes"
            value="8"
            icon={<BookOpen className="text-primary" size={24} />}
          />
        </div>

        {/* Placeholder for future charts and detailed stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 h-96">
            <h2 className="text-xl font-semibold mb-4">Weekly Progress</h2>
            {/* Chart will be added here */}
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 h-96">
            <h2 className="text-xl font-semibold mb-4">Attendance Overview</h2>
            {/* Chart will be added here */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
