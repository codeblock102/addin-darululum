
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
import { BookOpen } from "lucide-react";

const Progress = () => {
  // Sample progress data - would come from backend in production
  const progressData = [
    {
      id: 1,
      student: "Ahmad Ali",
      currentSurah: "Al-Baqarah",
      verses: "1-15",
      status: "On Track",
      lastRevision: "2024-02-20"
    },
    {
      id: 2,
      student: "Fatima Khan",
      currentSurah: "Al-Imran",
      verses: "20-35",
      status: "Ahead",
      lastRevision: "2024-02-19"
    },
    {
      id: 3,
      student: "Omar Hassan",
      currentSurah: "An-Nisa",
      verses: "5-12",
      status: "Needs Review",
      lastRevision: "2024-02-18"
    }
  ];

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
            <div className="text-3xl font-bold text-primary">85%</div>
            <p className="text-sm text-gray-500 mt-1">Average completion rate</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Students On Track</h3>
            <div className="text-3xl font-bold text-green-600">24</div>
            <p className="text-sm text-gray-500 mt-1">Out of 30 students</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Needs Review</h3>
            <div className="text-3xl font-bold text-yellow-600">6</div>
            <p className="text-sm text-gray-500 mt-1">Students requiring attention</p>
          </Card>
        </div>

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
              {progressData.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.student}</TableCell>
                  <TableCell>{entry.currentSurah}</TableCell>
                  <TableCell>{entry.verses}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      entry.status === 'On Track' ? 'bg-green-100 text-green-800' :
                      entry.status === 'Ahead' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.status}
                    </span>
                  </TableCell>
                  <TableCell>{entry.lastRevision}</TableCell>
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
      </div>
    </DashboardLayout>
  );
};

export default Progress;
