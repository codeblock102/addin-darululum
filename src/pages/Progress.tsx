
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Progress = () => {
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select(`
          *,
          students(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const calculateOverallProgress = () => {
    if (!progressData?.length) return 0;
    const totalStudents = progressData.length;
    const onTrackStudents = progressData.filter(
      (p) => p.memorization_quality === 'excellent' || p.memorization_quality === 'good'
    ).length;
    return Math.round((onTrackStudents / totalStudents) * 100);
  };

  const getStudentsOnTrack = () => {
    if (!progressData?.length) return 0;
    return progressData.filter(
      (p) => p.memorization_quality === 'excellent' || p.memorization_quality === 'good'
    ).length;
  };

  const getStudentsNeedingReview = () => {
    if (!progressData?.length) return 0;
    return progressData.filter(
      (p) => p.memorization_quality === 'needsWork' || p.memorization_quality === 'horrible'
    ).length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Progress Tracking</h1>
            <p className="text-gray-500">Monitor student Hifz progress and revisions</p>
          </div>
          <Button>
            <BookOpen className="mr-2" />
            New Progress Entry
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Overall Progress</h3>
            <div className="text-3xl font-bold text-primary">{calculateOverallProgress()}%</div>
            <p className="text-sm text-gray-500 mt-1">Average completion rate</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Students On Track</h3>
            <div className="text-3xl font-bold text-green-600">{getStudentsOnTrack()}</div>
            <p className="text-sm text-gray-500 mt-1">Out of {progressData?.length || 0} students</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Needs Review</h3>
            <div className="text-3xl font-bold text-yellow-600">{getStudentsNeedingReview()}</div>
            <p className="text-sm text-gray-500 mt-1">Students requiring attention</p>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Current Surah</TableHead>
                  <TableHead>Verses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Revision</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressData?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.students?.name}</TableCell>
                    <TableCell>{entry.current_surah}</TableCell>
                    <TableCell>{entry.start_ayat} - {entry.end_ayat}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                        entry.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.memorization_quality}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(entry.last_revision_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Update Progress
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Progress;
