
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AttendanceFormHeader } from "./form/AttendanceFormHeader";
import { ClassSelector } from "./form/ClassSelector";
import { StudentGrid } from "./form/StudentGrid";
import { DateSelector } from "./form/DateSelector";
import { SliderTimeSelector } from "./form/SliderTimeSelector";
import { NotesField } from "./form/NotesField";
import { SubmitButton } from "./form/SubmitButton";
import { BulkAttendanceGrid } from "./form/BulkAttendanceGrid";
import { useAttendanceSubmit } from "./form/useAttendanceSubmit";
import { Users, UserCheck, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const AttendanceForm = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("individual");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const { toast } = useToast();

  const { form, handleSubmit, isProcessing } = useAttendanceSubmit({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance record saved successfully",
      });
      form.reset({
        class_id: "",
        student_id: "",
        date: new Date(),
        time: "09:00",
        status: "present",
        late_reason: "",
        notes: "",
      });
      setSelectedClassId("");
      setSelectedStudents(new Set());
      setBulkStatus("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMultipleSubmit = async () => {
    if (selectedStudents.size === 0 || !bulkStatus) {
      toast({
        title: "Missing Information",
        description: "Please select students and a status.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = form.getValues();
      
      // Create attendance records for all selected students
      const attendanceRecords = Array.from(selectedStudents).map(studentId => ({
        student_id: studentId,
        class_id: formData.class_id || null,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time,
        status: bulkStatus,
        notes: formData.notes,
        late_reason: formData.late_reason,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { 
          onConflict: 'student_id,date',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Attendance recorded for ${selectedStudents.size} students`,
      });
      
      setSelectedStudents(new Set());
      setBulkStatus("");
    } catch (error) {
      console.error('Error recording multiple attendance:', error);
      toast({
        title: "Error",
        description: "Failed to record attendance for selected students",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <AttendanceFormHeader />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Record Attendance
            {selectedStudents.size > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedStudents.size} students selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Individual
              </TabsTrigger>
              <TabsTrigger value="multiple" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Multiple Selection
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Class Bulk
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateSelector form={form} />
                    <ClassSelector
                      form={form}
                      selectedClassId={selectedClassId}
                      onClassChange={setSelectedClassId}
                    />
                  </div>

                  <StudentGrid form={form} selectedClassId={selectedClassId} />

                  <SliderTimeSelector form={form} />

                  <NotesField form={form} />

                  <SubmitButton isPending={isProcessing} isUpdate={false} />
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="multiple" className="space-y-6">
              <Form {...form}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateSelector form={form} />
                    <ClassSelector
                      form={form}
                      selectedClassId={selectedClassId}
                      onClassChange={setSelectedClassId}
                    />
                  </div>

                  <StudentGrid 
                    form={form} 
                    selectedClassId={selectedClassId}
                    multiSelect={true}
                    selectedStudents={selectedStudents}
                    onStudentSelect={(studentId) => {
                      const newSelected = new Set(selectedStudents);
                      if (newSelected.has(studentId)) {
                        newSelected.delete(studentId);
                      } else {
                        newSelected.add(studentId);
                      }
                      setSelectedStudents(newSelected);
                    }}
                  />

                  {selectedStudents.size > 0 && (
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          Multiple Selection Mode
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudents(new Set())}
                        >
                          Clear All
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Status for Selected Students</label>
                          <Select value={bulkStatus} onValueChange={setBulkStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <SliderTimeSelector form={form} />
                      </div>

                      <NotesField form={form} />

                      <Button 
                        onClick={handleMultipleSubmit}
                        disabled={!bulkStatus || selectedStudents.size === 0}
                        className="w-full"
                      >
                        Record Attendance for {selectedStudents.size} Students
                      </Button>
                    </div>
                  )}
                </div>
              </Form>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <Form {...form}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DateSelector form={form} />
                    <ClassSelector
                      form={form}
                      selectedClassId={selectedClassId}
                      onClassChange={setSelectedClassId}
                    />
                  </div>

                  <BulkAttendanceGrid form={form} />
                </div>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
