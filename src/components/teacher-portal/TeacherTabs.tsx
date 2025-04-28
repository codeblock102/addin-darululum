
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Teacher } from "@/types/teacher";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Calendar, Users, BarChart2, MessageSquare } from "lucide-react";

interface TeacherTabsProps {
  teacher: Teacher;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TeacherTabs = ({ teacher, activeTab, onTabChange }: TeacherTabsProps) => {
  const navigate = useNavigate();
  
  const handleTabChange = (value: string) => {
    onTabChange(value);
    navigate(`/teacher-portal${value !== 'overview' ? `?tab=${value}` : ''}`);
  };
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <span className="hidden md:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="students" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>My Students</span>
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center gap-2">
          <Book className="h-4 w-4" />
          <span>Record Progress</span>
        </TabsTrigger>
        <TabsTrigger value="attendance" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Attendance</span>
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          <span>My Performance</span>
        </TabsTrigger>
        <TabsTrigger value="messages" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Messages</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
