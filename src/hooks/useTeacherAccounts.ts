
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeacherAccount } from "@/types/teacher";
import { useToast } from "@/components/ui/use-toast";

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  subject: string;
  bio: string | null;
  phone: string | null;
  experience?: string;
}

export function useTeacherAccounts() {
  const { toast } = useToast();

  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<
    TeacherAccount[]
  >({
    queryKey: ["teacher-accounts"],
    queryFn: async () => {
      const { data: teachersData, error } = await supabase
        .from("teachers")
        .select(`
          id, 
          name, 
          email, 
          subject,
          bio,
          phone
        `);

      if (error) {
        console.error(
          "Error fetching teacher accounts (initial query):",
          error,
        );
        toast({
          title: "Error loading teachers",
          description:
            "Failed to load teacher accounts data during initial fetch.",
          variant: "destructive",
        });
        throw error;
      }

      const teacherAccounts: TeacherAccount[] = [];

      if (teachersData) {
        for (const teacher of teachersData as Teacher[]) {
          let userData = null;
          if (teacher.email) {
            try {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("id, created_at")
                .eq("username", teacher.email)
                .maybeSingle();

              if (profileData) {
                userData = profileData;
              }
            } catch (err) {
              console.warn(
                "Warning: Error fetching profile data for teacher:",
                teacher.email,
                err,
              );
            }
          }

          const { data: classesData } = await supabase
            .from("classes")
            .select("id", { count: "exact" })
            .eq("teacher_id", teacher.id);

          const { data: studentsData } = await supabase
            .from("students_teachers")
            .select("id", { count: "exact" })
            .eq("teacher_id", teacher.id)
            .eq("active", true);

          teacherAccounts.push({
            ...teacher,
            userId: userData?.id || null,
            status: "active",
            lastLogin: userData?.created_at || null,
            classesCount: classesData?.length || 0,
            studentsCount: studentsData?.length || 0,
            experience: teacher.experience,
          });
        }
      }

      return teacherAccounts;
    },
  });

  const filterTeachers = (
    teachers: TeacherAccount[] | undefined,
    searchQuery: string,
    statusFilter: "all" | "active" | "suspended",
    activityFilter: "all" | "7days" | "30days" | "inactive",
  ) => {
    return teachers?.filter((teacher) => {
      // Apply search query filter
      const matchesSearch = searchQuery === "" ||
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply status filter
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && teacher.status === "active") ||
        (statusFilter === "suspended" && teacher.status === "suspended");

      // Apply activity filter (mock implementation since we don't have real login history)
      let matchesActivity = true;
      if (activityFilter === "7days") {
        // Mock implementation: consider teachers with classes as recently active
        matchesActivity = teacher.classesCount > 0;
      } else if (activityFilter === "30days") {
        // All teachers considered active in last 30 days for this demo
        matchesActivity = true;
      } else if (activityFilter === "inactive") {
        // Mock implementation: teachers with no classes considered inactive
        matchesActivity = teacher.classesCount === 0;
      }

      return matchesSearch && matchesStatus && matchesActivity;
    }) || [];
  };

  return {
    teachers,
    isLoadingTeachers,
    filterTeachers,
  };
}
