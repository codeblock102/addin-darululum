
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Edit, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive";
  madrassah_id?: string;
  section?: string;
}

interface StudentListProps {
  students?: Student[];
  isLoading?: boolean;
  onEdit?: (student: Student) => void;
}

export const StudentList = ({ students, isLoading, onEdit }: StudentListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.guardian_name &&
        student.guardian_name.toLowerCase().includes(
          searchQuery.toLowerCase(),
        )),
  );

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Student Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
                <Skeleton className="h-9 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 pb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Student Directory
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Search and manage all student records
            </p>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search students or guardians..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-[280px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {!filteredStudents || filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? "No students found matching your search." : "No students found."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <Badge
                        variant={student.status === "active" ? "default" : "secondary"}
                        className={
                          student.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {student.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {student.guardian_name && (
                        <p>Guardian: {student.guardian_name}</p>
                      )}
                      {student.guardian_contact && (
                        <p>Contact: {student.guardian_contact}</p>
                      )}
                      {student.enrollment_date && (
                        <p>
                          Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(student)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
