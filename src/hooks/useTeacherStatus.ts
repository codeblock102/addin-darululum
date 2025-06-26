import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";

export const useTeacherStatus = () => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user?.id) {
        setIsTeacher(false);
        setIsAdmin(false);
        setTeacherId(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        const userRole = profile?.role;
        const isUserAdmin = userRole === "admin";
        const isUserTeacher = userRole === "teacher";

        setIsAdmin(isUserAdmin);
        setIsTeacher(isUserTeacher || isUserAdmin);
        setTeacherId(profile?.id || null);

        console.log(
          `User status check: isTeacher=${isUserTeacher}, isAdmin=${isUserAdmin}, profileId=${profile?.id}`,
        );
      } catch (error) {
        console.error("Error checking user status:", error);
        setIsTeacher(false);
        setIsAdmin(false);
        setTeacherId(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [session]);

  return { isTeacher, isAdmin, teacherId, isLoading };
};
