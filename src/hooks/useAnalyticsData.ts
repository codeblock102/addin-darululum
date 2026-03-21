/**
 * @file src/hooks/useAnalyticsData.ts
 * @summary Fetches analytics data (quality distribution, time progress, student progress, daily activity) for the teacher portal.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export const useAnalyticsData = (teacherId: string) => {
  return useQuery({
    queryKey: ["teacher-analytics", teacherId],
    queryFn: async () => {
      try {
        const qualityDistribution = await getQualityDistribution(teacherId);
        const timeProgress = await getTimeProgress();
        const studentProgress = await getStudentProgress(teacherId);
        const dailyActivity = await getDailyActivity();

        return {
          qualityDistribution,
          timeProgress,
          studentProgress,
          dailyActivity,
        };
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        throw new Error("Failed to fetch analytics data");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const getQualityDistribution = async (teacherId: string) => {
  try {
    // Get students for this teacher first
    const { data: students, error: studentsError } = await supabase
      .from("students_teachers")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("active", true);

    if (studentsError) throw studentsError;
    if (!students || students.length === 0) return [];

    const studentIds = students.map((s) => s.id);

    const { data, error } = await supabase
      .from("juz_revisions")
      .select("memorization_quality")
      .in("student_id", studentIds);

    if (error) throw error;

    const distributionMap = (data || []).reduce(
      (acc: Record<string, number>, item) => {
        const quality = item.memorization_quality || "Not rated";
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(distributionMap).map(([quality, count]) => ({
      quality,
      count,
    }));
  } catch (error) {
    console.error("Error getting quality distribution:", error);
    return [];
  }
};

const getTimeProgress = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await supabase
      .from("progress")
      .select("date, id")
      .gte("date", ninetyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;

    const dateMap: Record<string, number> = {};
    (data || []).forEach((item) => {
      if (item.date) {
        const date = new Date(item.date).toISOString().split("T")[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
      }
    });

    return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
  } catch (error) {
    console.error("Error getting time progress:", error);
    return [];
  }
};

const getStudentProgress = async (teacherId: string) => {
  try {
    const { data: students, error: studentsError } = await supabase
      .from("students_teachers")
      .select("id, student_name")
      .eq("teacher_id", teacherId)
      .eq("active", true);

    if (studentsError) throw studentsError;
    if (!students || students.length === 0) return [];

    const studentDataPromises = students.map(async (student) => {
      const { data, error } = await supabase
        .from("progress")
        .select("verses_memorized")
        .eq("student_id", student.id);

      if (error) {
        console.error(
          `Error fetching progress for student ${student.student_name}:`,
          error,
        );
        return { name: student.student_name, verses: 0 };
      }

      const totalVerses =
        data?.reduce((sum, record) => sum + (record.verses_memorized || 0), 0) ||
        0;

      return { name: student.student_name, verses: totalVerses };
    });

    return Promise.all(studentDataPromises);
  } catch (error) {
    console.error("Error getting student progress:", error);
    return [];
  }
};

// Returns daily entry counts for the last 14 days (used in Trends tab)
const getDailyActivity = async () => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data, error } = await supabase
      .from("progress")
      .select("date")
      .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;

    const dateMap: Record<string, number> = {};
    (data || []).forEach((item) => {
      if (item.date) {
        const d = new Date(item.date);
        const label = d.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
        });
        dateMap[label] = (dateMap[label] || 0) + 1;
      }
    });

    return Object.entries(dateMap).map(([name, count]) => ({ name, count }));
  } catch (error) {
    console.error("Error getting daily activity:", error);
    return [];
  }
};
