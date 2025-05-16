
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { seedStudentsTable, assignStudentsToTeacher } from "@/utils/seedDatabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DatabaseSeeder() {
  const [isLoading, setIsLoading] = useState(false);
  const [teacherId, setTeacherId] = useState(""); // Replace with actual teacher ID when available
  const { toast } = useToast();

  const handleSeedDatabase = async () => {
    setIsLoading(true);
    
    try {
      // Seed the students table
      const studentsSeeded = await seedStudentsTable();
      
      if (studentsSeeded) {
        toast({
          title: "Students Added",
          description: "Student data has been successfully added to the database.",
        });
        
        // If we have a teacher ID, assign students to that teacher
        if (teacherId) {
          const studentsAssigned = await assignStudentsToTeacher(teacherId);
          
          if (studentsAssigned) {
            toast({
              title: "Students Assigned",
              description: "Students have been successfully assigned to the teacher.",
            });
          } else {
            toast({
              title: "Assignment Failed",
              description: "Failed to assign students to teacher.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Seeding Failed",
          description: "Failed to add student data to the database.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while seeding the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Seeder</CardTitle>
          <CardDescription>
            Add student data to the database and assign them to a teacher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will add 10 students to the database with their current Juz and completed Juz information.
          </p>
          {teacherId ? (
            <p className="text-green-600">Teacher ID set: {teacherId}</p>
          ) : (
            <p className="text-amber-600">No teacher ID set. Students will be added but not assigned to a teacher.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSeedDatabase} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Students...
              </>
            ) : (
              "Add Students to Database"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
