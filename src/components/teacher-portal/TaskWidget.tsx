import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Check } from "lucide-react";

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-gray-400",
  low: "bg-green-500",
};

const STATUS_CHIP: Record<Task["status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<Task["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

interface TaskWidgetProps {
  teacherId: string;
}

export const TaskWidget = ({ teacherId }: TaskWidgetProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["teacher-tasks", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_tasks")
        .select("id, title, due_date, priority, status")
        .eq("assigned_to", teacherId)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
    enabled: !!teacherId,
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("teacher_tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-tasks", teacherId] });
      toast({ title: "Task marked as done" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const MAX_VISIBLE = 5;
  const visible = showAll ? tasks : tasks.slice(0, MAX_VISIBLE);
  const hasMore = tasks.length > MAX_VISIBLE;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-900 border-l-2 border-green-600 pl-3 mb-4">
        My Tasks
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">No tasks assigned. You're all caught up! ✓</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((task) => {
            const isOverdue = task.due_date !== null && task.due_date < today;
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {/* Priority dot */}
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                />

                {/* Title + due date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
                      {isOverdue ? "Overdue · " : "Due "}
                      {new Date(task.due_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Status chip */}
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CHIP[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>

                {/* Mark done */}
                <button
                  type="button"
                  title="Mark as done"
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(task.id)}
                  className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 flex-shrink-0 transition-colors disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-green-700 hover:underline mt-1 pl-5 font-medium"
            >
              {showAll ? "Show less" : `View all ${tasks.length} tasks`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
