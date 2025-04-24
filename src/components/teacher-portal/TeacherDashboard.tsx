
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TeacherDashboardProps } from "@/types/teacher";
import { useTeacherSummary } from "@/hooks/useTeacherSummary";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSummary } from "./DashboardSummary";
import { TeacherTabs } from "./TeacherTabs";
import { Card } from "@/components/ui/card";
import { StudentStatusList } from "./StudentStatusList";

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: summaryData } = useTeacherSummary(teacher.id);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['students', 'progress', 'grading', 'analytics', 'messages', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <DashboardHeader teacher={teacher} />
      
      {activeTab === "overview" && (
        <div className="animate-slideIn space-y-6">
          <DashboardSummary summaryData={summaryData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4">Recent Student Status</h3>
              <StudentStatusList teacherId={teacher.id} />
            </Card>
            
            <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4">Upcoming Schedule</h3>
              <div className="space-y-4">
                {/* Simplified schedule view */}
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium">Hifz Morning Class</p>
                    <p className="text-sm text-muted-foreground">Group A</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">8:00 AM</p>
                    <p className="text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium">Tajweed Class</p>
                    <p className="text-sm text-muted-foreground">Group B</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">11:00 AM</p>
                    <p className="text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium">Advanced Hifz</p>
                    <p className="text-sm text-muted-foreground">Individual</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">2:00 PM</p>
                    <p className="text-muted-foreground">Tomorrow</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      <TeacherTabs 
        teacher={teacher} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};
