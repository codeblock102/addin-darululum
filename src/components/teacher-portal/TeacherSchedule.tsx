
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Plus, Loader2, X, Check, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { RevisionScheduleSchema } from "@/components/dhor-book/dhorBookValidation";

interface ScheduleItem {
  id: string;
  student_id: string;
  student_name?: string;
  juz_number: number;
  surah_number?: number;
  scheduled_date: string;
  priority: string;
  status: string;
  created_at?: string;
}

interface TeacherScheduleProps {
  teacherId: string;
}

export const TeacherSchedule = ({ teacherId }: TeacherScheduleProps) => {
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [juzNumber, setJuzNumber] = useState<number>(1);
  const [surahNumber, setSurahNumber] = useState<number | undefined>(undefined);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [priority, setPriority] = useState<string>("medium");
  const [notes, setNotes] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  
  const queryClient = useQueryClient();

  // Fetch all schedule items for this teacher's students
  const { data: scheduleItems, isLoading } = useQuery({
    queryKey: ['teacher-schedule', teacherId, filter],
    queryFn: async () => {
      // First get all students assigned to this teacher
      const { data: studentTeachers } = await supabase
        .from('students_teachers')
        .select('student_name')
        .eq('teacher_id', teacherId);
      
      const studentNames = studentTeachers?.map(st => st.student_name) || [];
      
      // Then get all students by these names
      const { data: students } = await supabase
        .from('students')
        .select('id, name')
        .in('name', studentNames);
      
      const studentIds = students?.map(s => s.id) || [];
      const studentNameMap: Record<string, string> = {};
      students?.forEach(s => studentNameMap[s.id] = s.name);
      
      // Finally get revision schedule for these students
      let query = supabase
        .from('revision_schedule')
        .select('*')
        .in('student_id', studentIds)
        .order('scheduled_date', { ascending: true });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data: schedules, error } = await query;
      
      if (error) throw error;
      
      return (schedules || []).map(item => ({
        ...item,
        student_name: studentNameMap[item.student_id]
      }));
    }
  });
  
  // Fetch students for dropdown
  const { data: students } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      const { data: studentTeachers } = await supabase
        .from('students_teachers')
        .select('student_name')
        .eq('teacher_id', teacherId);
      
      const studentNames = studentTeachers?.map(st => st.student_name) || [];
      
      const { data: students } = await supabase
        .from('students')
        .select('id, name')
        .in('name', studentNames);
      
      return students || [];
    }
  });
  
  // Mutation to add new schedule
  const addScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { error } = await supabase
        .from('revision_schedule')
        .insert([scheduleData]);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      toast({
        title: "Schedule Created",
        description: "The revision has been scheduled successfully."
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to update schedule status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('revision_schedule')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      toast({
        title: "Status Updated",
        description: "The schedule status has been updated."
      });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleCreateSchedule = () => {
    try {
      // Validate
      const validated = RevisionScheduleSchema.parse({
        student_id: selectedStudent,
        juz_number: juzNumber,
        surah_number: surahNumber,
        scheduled_date: scheduledDate,
        priority,
        notes
      });
      
      addScheduleMutation.mutate(validated);
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "Please check all fields and try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleMarkCompleted = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'completed' });
  };
  
  const handleCancel = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'cancelled' });
  };
  
  const handleCloseDialog = () => {
    setIsNewScheduleOpen(false);
    setSelectedStudent("");
    setJuzNumber(1);
    setSurahNumber(undefined);
    setScheduledDate(new Date());
    setPriority("medium");
    setNotes("");
  };
  
  const renderScheduleItem = (item: ScheduleItem) => {
    return (
      <div 
        key={item.id} 
        className={cn(
          "p-4 mb-2 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
          item.status === 'completed' ? "bg-green-50 border-green-200" :
          item.status === 'cancelled' ? "bg-red-50 border-red-200" :
          item.status === 'postponed' ? "bg-amber-50 border-amber-200" :
          "bg-blue-50 border-blue-200"
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{item.student_name}</h4>
            <Badge variant={
              item.priority === 'high' ? "destructive" :
              item.priority === 'medium' ? "default" : 
              "outline"
            }>
              {item.priority}
            </Badge>
            <Badge variant={
              item.status === 'completed' ? "success" :
              item.status === 'cancelled' ? "destructive" :
              item.status === 'postponed' ? "warning" :
              "secondary"
            }>
              {item.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Juz {item.juz_number} {item.surah_number ? `(Surah ${item.surah_number})` : ""}
          </p>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            <span>{new Date(item.scheduled_date).toLocaleDateString()}</span>
          </div>
        </div>
        
        {item.status === 'pending' && (
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => handleMarkCompleted(item.id)}
            >
              <Check className="h-4 w-4 mr-1" /> Complete
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => handleCancel(item.id)}
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Revision Schedule</h2>
          <p className="text-muted-foreground">
            Schedule and manage student revisions
          </p>
        </div>
        <Button onClick={() => setIsNewScheduleOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Schedule
        </Button>
      </div>
      
      <div className="flex justify-end">
        <Select value={filter} onValueChange={(value: "all" | "pending" | "completed" | "cancelled") => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schedules</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Revisions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : scheduleItems && scheduleItems.length > 0 ? (
            <div className="space-y-1">
              {scheduleItems.map(renderScheduleItem)}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <CalendarDays className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="mt-2 text-lg font-medium">No schedules found</p>
              <p className="text-muted-foreground">
                {filter !== 'all' 
                  ? `No ${filter} schedules found. Try changing the filter.` 
                  : 'Create your first revision schedule by clicking "New Schedule".'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Schedule Dialog */}
      <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="juz">Juz Number</Label>
                <Input 
                  id="juz" 
                  type="number" 
                  min="1" 
                  max="30"
                  value={juzNumber} 
                  onChange={(e) => setJuzNumber(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surah">Surah (Optional)</Label>
                <Input 
                  id="surah" 
                  type="number"
                  min="1" 
                  max="114"
                  value={surahNumber || ''} 
                  onChange={(e) => setSurahNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => date && setScheduledDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleCreateSchedule} disabled={!selectedStudent || juzNumber < 1}>
              {addScheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
