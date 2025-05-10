
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DhorBook as DhorBookComponent } from "@/components/dhor-book/DhorBook";
import { TeacherStatsSection } from "@/components/teachers/TeacherStatsSection";
import { Book, Search } from "lucide-react";

const DhorBookPage = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all students
  const { data: students, isLoading } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch active teachers for the teacher selector
  const { data: teachers } = useQuery({
    queryKey: ['active-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return data || [];
    }
  });

  // Filter students based on search query
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Progress Book System</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Comprehensive student progress tracking through Dhor Book entries
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            <span>Export Records</span>
          </Button>
        </div>

        <TeacherStatsSection stats={{
          totalTeachers: teachers?.length || 0,
          totalStudents: students?.length || 0,
          averageExperience: 0,
          subjectCount: 0,
          activeTeachers: 0,
          totalClasses: 0
        }} />

        <Card className="mt-6">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Students</TabsTrigger>
                  <TabsTrigger value="recent">Recent Entries</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                  <div className="md:col-span-1">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-sm font-medium">Select a student</h3>
                        <Select
                          value={selectedStudentId || undefined}
                          onValueChange={setSelectedStudentId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredStudents?.map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedStudentId && (
                        <div>
                          <h3 className="mb-2 text-sm font-medium">Select teacher</h3>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers?.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                              {/* Added a default teacher option in case there are no teachers */}
                              {(!teachers || teachers.length === 0) && (
                                <SelectItem value="default">Default Teacher</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:col-span-3">
                    {selectedStudentId ? (
                      <DhorBookComponent 
                        studentId={selectedStudentId} 
                        teacherId={teachers?.[0]?.id || 'default'} 
                      />
                    ) : (
                      <div className="border rounded-lg flex items-center justify-center h-[400px] bg-muted/20">
                        <div className="text-center">
                          <Book className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-1">No Student Selected</h3>
                          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Select a student from the sidebar to view or edit their Dhor Book entries.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recent">
                <div className="mt-4">
                  <p className="text-muted-foreground text-center py-10">
                    Recent Dhor Book entries across all students will be displayed here.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="reports">
                <div className="mt-4">
                  <p className="text-muted-foreground text-center py-10">
                    Generate and view reports based on Dhor Book data.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DhorBookPage;
