
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const Students = () => {
  // This is sample data - in a real app this would come from your backend
  const students = [
    { id: 1, name: "Ahmad Ali", grade: "7", progress: "85%", attendance: "92%" },
    { id: 2, name: "Fatima Khan", grade: "8", progress: "78%", attendance: "95%" },
    { id: 3, name: "Omar Hassan", grade: "6", progress: "92%", attendance: "88%" },
    { id: 4, name: "Zainab Ahmad", grade: "7", progress: "88%", attendance: "90%" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Students</h1>
            <p className="text-gray-500">Manage and monitor student progress</p>
          </div>
          <Button>
            <UserPlus className="mr-2" />
            Add Student
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.progress}</TableCell>
                  <TableCell>{student.attendance}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      View Details
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

export default Students;
