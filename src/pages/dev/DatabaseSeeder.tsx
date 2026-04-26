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
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  assignStudentsToTeacher,
  seedStudentsTable,
} from "@/utils/seedDatabase.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { Loader2, Info, CheckCircle, XCircle } from "lucide-react";

/**
 * @function DatabaseSeeder
 * @description A component that allows administrators to seed the database with student data and assign them to a teacher.
 * It provides a button to trigger the seeding process and displays feedback using toasts.
 * @returns {JSX.Element} The rendered database seeder page.
 */
export default function DatabaseSeeder() {
  const [isLoading, setIsLoading] = useState(false);
  const [teacherId] = useState(""); // Replace with actual teacher ID when available
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
      const studentsSeeded = await seedStudentsTable();

      if (studentsSeeded) {
        toast({
          title: "Success",
          description: "Student data has been successfully added.",
        });

        if (teacherId) {
          const studentsAssigned = await assignStudentsToTeacher(teacherId);
          if (studentsAssigned) {
            toast({
              title: "Success",
              description: "Students have been assigned to the teacher.",
            });
          } else {
            toast({
              title: "Assignment Failed",
              description: "Could not assign students to the teacher.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Seeding Failed",
          description: "Could not add student data to the database.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during seeding.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <div className="bg-blue-500 text-white rounded-full p-3 mr-4">
          <Info className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Database Seeder</h2>
          <p className="text-gray-600">
            Populate the database with initial student data.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-gray-700">
        <p>
          This action will add <strong>10 sample students</strong> to the database. 
          This is useful for testing and development purposes.
        </p>
        {teacherId ? (
          <div className="flex items-center p-3 rounded-md bg-green-50 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800">
              Teacher ID is set (<code>{teacherId}</code>). Seeded students will be assigned.
            </p>
          </div>
        ) : (
          <div className="flex items-center p-3 rounded-md bg-yellow-50 border border-yellow-200">
            <XCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <p className="text-yellow-800">
              No Teacher ID is set. Students will be created without a teacher assignment.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Button
          onClick={handleSeedDatabase}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Seeding Database...
            </>
          ) : (
            "Seed Student Data"
          )}
        </Button>
      </div>
    </div>
  );
}
