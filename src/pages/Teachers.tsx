
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

const Teachers = () => {
  // Sample data - would come from backend in production
  const teachers = [
    { 
      id: 1, 
      name: "Ustadh Muhammad", 
      subject: "Hifz", 
      students: "25",
      experience: "10 years" 
    },
    { 
      id: 2, 
      name: "Ustadh Abdullah", 
      subject: "Hifz", 
      students: "22",
      experience: "8 years" 
    },
    { 
      id: 3, 
      name: "Ustadh Ahmad", 
      subject: "Hifz", 
      students: "20",
      experience: "5 years" 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teachers</h1>
            <p className="text-gray-500">Manage teaching staff and assignments</p>
          </div>
          <Button>
            <UserPlus className="mr-2" />
            Add Teacher
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.subject}</TableCell>
                  <TableCell>{teacher.students}</TableCell>
                  <TableCell>{teacher.experience}</TableCell>
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

export default Teachers;
