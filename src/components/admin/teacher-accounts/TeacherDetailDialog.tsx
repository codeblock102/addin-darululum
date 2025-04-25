
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { TeacherAccount } from "@/types/teacher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Calendar, BookOpen, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { TeacherScheduleTab } from "./TeacherScheduleTab";
import { TeacherActivityTab } from "./TeacherActivityTab";
import { TeacherStudentsTab } from "./TeacherStudentsTab";

interface TeacherDetailDialogProps {
  teacher: TeacherAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherDetailDialog({ 
  teacher, 
  open, 
  onOpenChange 
}: TeacherDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch additional teacher data
  const { data: teacherDetail, isLoading } = useQuery({
    queryKey: ['teacher-detail', teacher?.id],
    queryFn: async () => {
      if (!teacher?.id) return null;
      
      // This is a placeholder for actual API calls to fetch additional data
      // For a real implementation, you would fetch class assignments, login history, etc.
      
      return {
        ...teacher,
        createdAt: teacher.created_at || new Date().toISOString(),
        lastLoginTime: teacher.lastLogin || new Date().toISOString(),
        loginHistory: [
          { date: new Date().toISOString(), device: "Chrome / Windows" },
          { date: new Date(Date.now() - 86400000).toISOString(), device: "Safari / macOS" }
        ]
      };
    },
    enabled: !!teacher?.id && open
  });

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teacher Account Details</DialogTitle>
          <DialogDescription>
            View complete profile and activity history for {teacher.name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                      <p>{teacher.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Email Address</h4>
                      <p>{teacher.email || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                      <p>{teacher.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
                      <p>{teacher.subject}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Experience</h4>
                      <p>{teacher.experience} years</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Account Status</h4>
                      <p className={teacher.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                        {teacher.status === 'active' ? 'Active' : 'Suspended'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Account Created</h4>
                      <p>{teacherDetail?.createdAt ? format(new Date(teacherDetail.createdAt), 'PPP') : "Unknown"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Last Login</h4>
                      <p>
                        {teacherDetail?.lastLoginTime 
                          ? format(new Date(teacherDetail.lastLoginTime), 'PPP p')
                          : "Never logged in"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Classes Assigned</h4>
                      <p>{teacher.classesCount}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Students Assigned</h4>
                      <p>{teacher.studentsCount}</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Biography */}
                {teacher.bio && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Biography</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{teacher.bio}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            {/* Schedule Tab */}
            <TabsContent value="schedule">
              <TeacherScheduleTab teacherId={teacher.id} />
            </TabsContent>
            
            {/* Students Tab */}
            <TabsContent value="students">
              <TeacherStudentsTab teacherId={teacher.id} />
            </TabsContent>
            
            {/* Activity Log Tab */}
            <TabsContent value="activity">
              <TeacherActivityTab teacherId={teacher.id} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
