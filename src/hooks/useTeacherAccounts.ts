import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { TeacherAccount } from "@/types/teacher.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { User } from "@supabase/supabase-js";

// This is a simplified query that focuses on getting the core account data
// It fetches all users and their corresponding profiles, then combines them.
// This is more robust for the purpose of listing all potential accounts.
export function useTeacherAccounts() {
  const { toast } = useToast();

  const {
    data: teachers = [],
    isLoading: isLoadingTeachers,
  } = useQuery<TeacherAccount[]>({
    queryKey: ["teacher-accounts"],
    queryFn: async () => {
      // 1. Fetch all users from Supabase Auth
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) {
        toast({ title: "Error fetching users", description: usersError.message, variant: "destructive" });
        return [];
      }

      // 2. Fetch all corresponding profiles from the database
      const userIds = users.map(u => u.id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, role, subject, bio, phone")
        .in("id", userIds);

      if (profilesError) {
        toast({ title: "Error fetching profiles", description: profilesError.message, variant: "destructive" });
        return [];
      }
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // 3. Combine the data into the TeacherAccount shape
      const combinedData: TeacherAccount[] = users.map((user: User) => {
        const profile = profileMap.get(user.id);
        const status = (user as any).banned_until && new Date((user as any).banned_until) > new Date() ? "suspended" : "active";
        
        return {
          id: user.id,
          name: profile?.name || user.email || "Unknown User",
          email: user.email || undefined,
          role: profile?.role as 'teacher' | 'admin' || 'teacher',
          status: status,
          lastLogin: user.last_sign_in_at || null,
          classesCount: 0, // Simplified: Not fetching counts for this view anymore
          studentsCount: 0, // Simplified: Not fetching counts for this view anymore
          subject: profile?.subject || "N/A",
          bio: profile?.bio || null,
          phone: profile?.phone || null,
          experience: 0,
          userId: user.id,
        };
      });

      return combinedData;
    },
    staleTime: 5 * 60 * 1000,
  });

  // The filter function remains, but it's now simpler as it doesn't need to handle complex data
  const filterTeachers = (
    allTeachers: TeacherAccount[],
    searchQuery: string,
    statusFilter: string,
    activityFilter: string,
  ): TeacherAccount[] => {
    return allTeachers.filter(teacher => {
      const searchMatch = searchQuery
        ? teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const statusMatch = statusFilter !== 'all' ? teacher.status === statusFilter : true;
      
      // Simplified activity filter (can be expanded later if needed)
      const activityMatch = activityFilter !== 'all' ? true : true;

      return searchMatch && statusMatch && activityMatch;
    });
  };

  return {
    teachers: filterTeachers(teachers, "", "all", "all"), // Initially unfiltered
    isLoadingTeachers,
    filterTeachers,
  };
}
