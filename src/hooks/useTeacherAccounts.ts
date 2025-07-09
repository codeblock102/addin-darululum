import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { TeacherAccount } from "@/types/teacher.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { User } from "@supabase/supabase-js";

// This query fetches teacher accounts filtered by the admin's madrassah
export function useTeacherAccounts() {
  const { toast } = useToast();
  const { session } = useAuth();

  const {
    data: teachers = [],
    isLoading: isLoadingTeachers,
  } = useQuery<TeacherAccount[]>({
    queryKey: ["teacher-accounts", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.warn("No authenticated user found");
        return [];
      }

      // 1. Get current admin's madrassah_id
      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", session.user.id)
        .single();

      if (adminError || !adminProfile?.madrassah_id) {
        console.warn("Admin madrassah_id not found:", adminError);
        toast({ 
          title: "Access Error", 
          description: "Unable to determine your madrassah assignment", 
          variant: "destructive" 
        });
        return [];
      }

      const adminMadrassahId = adminProfile.madrassah_id;

      // 2. Fetch all users from Supabase Auth
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) {
        toast({ title: "Error fetching users", description: usersError.message, variant: "destructive" });
        return [];
      }

      // 3. Fetch profiles from the same madrassah only
      const userIds = users.map(u => u.id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, role, subject, bio, phone, madrassah_id")
        .in("id", userIds)
        .eq("madrassah_id", adminMadrassahId); // Filter by madrassah

      if (profilesError) {
        toast({ title: "Error fetching profiles", description: profilesError.message, variant: "destructive" });
        return [];
      }
      
      console.log(`Admin filtering teachers by madrassah_id: ${adminMadrassahId}, found ${profiles.length} profiles`);
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // 4. Combine the data into the TeacherAccount shape
      // Only include users that have profiles in the same madrassah
      const combinedData: TeacherAccount[] = users
        .filter(user => profileMap.has(user.id)) // Only users with profiles in this madrassah
        .map((user: User) => {
          const profile = profileMap.get(user.id)!; // Safe to use ! since we filtered above
          const status = (user as any).banned_until && new Date((user as any).banned_until) > new Date() ? "suspended" : "active";
          
          return {
            id: user.id,
            name: profile.name || user.email || "Unknown User",
            email: user.email || undefined,
            role: profile.role as 'teacher' | 'admin' || 'teacher',
            status: status,
            lastLogin: user.last_sign_in_at || null,
            classesCount: 0, // Simplified: Not fetching counts for this view anymore
            studentsCount: 0, // Simplified: Not fetching counts for this view anymore
            subject: profile.subject || "N/A",
            bio: profile.bio || null,
            phone: profile.phone || null,
            experience: 0,
            userId: user.id,
          };
        });

      console.log(`Filtered teacher accounts: ${combinedData.length} users from madrassah ${adminMadrassahId}`);
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
