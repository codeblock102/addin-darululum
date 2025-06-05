/**
 * @file DatabaseSeeder.tsx
 * @description This file defines the `DatabaseSeeder` component, an administrative tool used to populate the database with initial student data.
 * It provides a user interface with a button that, when clicked, triggers a seeding process.
 * This process involves two main steps:
 * 1. Calling `seedStudentsTable()` to add a predefined set of student records (e.g., 10 students with Juz and completed Juz information) to the 'students' table.
 * 2. If a `teacherId` is set (currently placeholder, intended to be dynamically provided), it calls `assignStudentsToTeacher()` to link these newly seeded students to a specific teacher.
 * The component manages loading states during the seeding operation and provides user feedback via toast notifications for success or failure of each step.
 * It is intended for setup or testing purposes to quickly get a populated database.
 */
import React from 'react';
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { seedStudentsTable, assignStudentsToTeacher } from "@/utils/seedDatabase.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2 } from "lucide-react";

/**
 * @function DatabaseSeeder
 * @description A component that allows administrators to seed the database with student data and assign them to a teacher.
 * It provides a button to trigger the seeding process and displays feedback using toasts.
 * @returns {JSX.Element} The rendered database seeder page.
 */
export default function DatabaseSeeder() {
  const [isLoading, setIsLoading] = useState(false);
  const [teacherId, setTeacherId] = useState(""); // Replace with actual teacher ID when available
  const { toast } = useToast();

  /**
   * @function handleSeedDatabase
   * @description Asynchronously seeds the database with student data.
   * It first calls `seedStudentsTable` to add student records.
   * If successful and a `teacherId` is available, it then calls `assignStudentsToTeacher`.
   * Provides toast notifications for success or failure of each operation.
   * Manages an `isLoading` state to disable the button during the process.
   * @async
   * @input None directly, but uses `teacherId` state if set.
   * @output Populates the database and displays toast messages indicating the outcome.
   * @returns {Promise<void>}
   */
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
