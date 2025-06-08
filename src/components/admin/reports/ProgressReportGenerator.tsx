import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { exportDataAsCSV } from "@/utils/exportUtils.ts";
import { useToast } from "@/components/ui/use-toast.ts";

export const ProgressReportGenerator = () => {
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery({
    queryKey: ["student-progress-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress")
        .select(`
          student_id,
          verses_memorized,
          students (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching progress:", error);
        return [];
      }

      return data.map((progress) => ({
        name: progress.students?.name || "Unknown",
        verses: progress.verses_memorized || 0,
      }));
    },
  });

  const handleExport = () => {
    if (!students?.length) {
      toast({
        title: "No data to export",
        description: "There is no student progress data available to export.",
        variant: "destructive",
      });
      return;
    }

    exportDataAsCSV(students, toast);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Progress Report</h3>
          <p className="text-sm text-muted-foreground">
            Export student progress data as CSV
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isLoading || !students?.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </Card>
  );
};
