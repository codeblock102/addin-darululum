
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RevisionSchedule } from "@/types/dhor-book";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, Calendar, Check, Filter, Plus, Search, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { StudentSearch } from "../student-progress/StudentSearch";

interface TeacherScheduleProps {
  teacherId: string;
}

export const TeacherSchedule = ({ teacherId }: TeacherScheduleProps) => {
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch revision schedules for the teacher's students
  const { data: schedules, isLoading: schedulesLoading, refetch } = useQuery({
    queryKey: ['teacher-schedules', teacherId, selectedStudentId, selectedTab],
    queryFn: async () => {
      try {
        let query = supabase
          .from('revision_schedule')
          .select(`
            id, 
            student_id, 
            juz_number,
            surah_number,
            scheduled_date,
            priority,
            status,
            created_at,
            notes,
            students:student_id (name)
          `);

        if (selectedStudentId) {
          query = query.eq('student_id', selectedStudentId);
        } else {
          // Only get schedules for students assigned to this teacher
          const { data: assignedStudents } = await supabase
            .from('students_teachers')
            .select('student_name')
            .eq('teacher_id', teacherId)
            .eq('active', true);

          if (assignedStudents && assignedStudents.length > 0) {
            const studentIds = assignedStudents.map(s => s.student_id);
            if (studentIds.length > 0) {
              query = query.in('student_id', studentIds);
            }
          }
        }

        // Filter by status
        if (selectedTab === 'upcoming') {
          query = query.in('status', ['pending', 'postponed']);
        } else if (selectedTab === 'completed') {
          query = query.eq('status', 'completed');
        } else if (selectedTab === 'cancelled') {
          query = query.eq('status', 'cancelled');
        }

        // Filter by priority if selected
        if (filterPriority) {
          query = query.eq('priority', filterPriority);
        }

        const { data, error } = await query.order('scheduled_date', { ascending: true });

        if (error) throw error;
        
        return data as (RevisionSchedule & { students: { name: string } })[];
      } catch (error) {
        console.error('Error fetching schedules:', error);
        return [];
      }
    },
    enabled: !!teacherId,
  });

  // Handle student selection from search component
  const handleStudentSelect = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
  };

  // Mark a revision as completed
  const markCompleted = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('revision_schedule')
        .update({ status: 'completed' })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Revision completed",
        description: "The revision has been marked as completed",
      });
      
      refetch();
    } catch (error) {
      console.error('Error marking revision as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark revision as completed",
        variant: "destructive",
      });
    }
  };

  // Cancel a revision
  const cancelRevision = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('revision_schedule')
        .update({ status: 'cancelled' })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Revision cancelled",
        description: "The revision has been cancelled",
      });
      
      refetch();
    } catch (error) {
      console.error('Error cancelling revision:', error);
      toast({
        title: "Error",
        description: "Failed to cancel revision",
        variant: "destructive",
      });
    }
  };

  // Filter schedules based on search query
  const filteredSchedules = schedules?.filter(schedule => {
    const studentName = schedule.students?.name?.toLowerCase() || '';
    const juzNumber = `Juz ${schedule.juz_number}`.toLowerCase();
    const surahNumber = schedule.surah_number ? `Surah ${schedule.surah_number}`.toLowerCase() : '';
    
    return (
      studentName.includes(searchQuery.toLowerCase()) ||
      juzNumber.includes(searchQuery.toLowerCase()) ||
      surahNumber.includes(searchQuery.toLowerCase())
    );
  });

  // Define status badge styles
  const getStatusBadge = (status: string, date: string) => {
    const scheduleDate = new Date(date);
    
    if (status === 'completed') {
      return <Badge>Completed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="outline">Cancelled</Badge>;
    } else if (status === 'postponed') {
      return <Badge variant="secondary">Postponed</Badge>;
    } else if (isToday(scheduleDate)) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Today</Badge>;
    } else if (isPast(scheduleDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revision Schedule</h2>
          <p className="text-muted-foreground">
            Schedule and manage revisions for your students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Revision
          </Button>
        </div>
      </div>

      <StudentSearch 
        onStudentSelect={handleStudentSelect}
        selectedStudentId={selectedStudentId}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Revision Schedules</CardTitle>
          <CardDescription>
            {selectedStudentName 
              ? `Viewing schedules for ${selectedStudentName}` 
              : "Viewing all student schedules"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search schedules..." 
                    className="pl-8 w-full sm:w-[200px]" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={filterPriority || ""} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>{filterPriority || "Priority"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="upcoming">
              {schedulesLoading ? (
                <div className="flex justify-center p-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : filteredSchedules?.length === 0 ? (
                <div className="text-center p-6">
                  <BookMarked className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <h3 className="mt-2 text-lg font-medium">No upcoming revisions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedStudentName 
                      ? `There are no upcoming revisions scheduled for ${selectedStudentName}.` 
                      : "There are no upcoming revisions scheduled."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSchedules?.map((schedule) => (
                    <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{schedule.students?.name}</span>
                          {getStatusBadge(schedule.status, schedule.scheduled_date)}
                          {getPriorityBadge(schedule.priority)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Juz {schedule.juz_number}
                          {schedule.surah_number && ` • Surah ${schedule.surah_number}`}
                          {" • "}{format(new Date(schedule.scheduled_date), "MMM d, yyyy")}
                        </div>
                        {schedule.notes && (
                          <div className="text-sm mt-1 italic">{schedule.notes}</div>
                        )}
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markCompleted(schedule.id)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelRevision(schedule.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {schedulesLoading ? (
                <div className="flex justify-center p-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : filteredSchedules?.length === 0 ? (
                <div className="text-center p-6">
                  <BookMarked className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <h3 className="mt-2 text-lg font-medium">No completed revisions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedStudentName 
                      ? `There are no completed revisions for ${selectedStudentName}.` 
                      : "There are no completed revisions."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSchedules?.map((schedule) => (
                    <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 p-4 border rounded-lg bg-muted/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{schedule.students?.name}</span>
                          {getStatusBadge(schedule.status, schedule.scheduled_date)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Juz {schedule.juz_number}
                          {schedule.surah_number && ` • Surah ${schedule.surah_number}`}
                          {" • "}{format(new Date(schedule.scheduled_date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {schedulesLoading ? (
                <div className="flex justify-center p-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : filteredSchedules?.length === 0 ? (
                <div className="text-center p-6">
                  <BookMarked className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <h3 className="mt-2 text-lg font-medium">No cancelled revisions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedStudentName 
                      ? `There are no cancelled revisions for ${selectedStudentName}.` 
                      : "There are no cancelled revisions."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSchedules?.map((schedule) => (
                    <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 p-4 border rounded-lg bg-muted/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{schedule.students?.name}</span>
                          {getStatusBadge(schedule.status, schedule.scheduled_date)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Juz {schedule.juz_number}
                          {schedule.surah_number && ` • Surah ${schedule.surah_number}`}
                          {" • "}{format(new Date(schedule.scheduled_date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
