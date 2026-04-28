import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Plus, Trash2, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  teacher_name?: string;
}

interface TeacherProfile {
  id: string;
  name: string;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Task["status"] }) {
  const map: Record<Task["status"], string> = {
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };
  const labels: Record<Task["status"], string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const map: Record<Task["priority"], string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-amber-100 text-amber-700",
    normal: "bg-gray-100 text-gray-600",
    low: "bg-green-100 text-green-700",
  };
  const labels: Record<Task["priority"], string> = {
    urgent: "Urgent",
    high: "High",
    normal: "Normal",
    low: "Low",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[priority]}`}>
      {labels[priority]}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const TaskManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "normal" as Task["priority"],
  });

  // ── Fetch teachers ──────────────────────────────────────────────────────────
  const { data: teachers = [] } = useQuery<TeacherProfile[]>({
    queryKey: ["admin-teachers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "teacher")
        .order("name");
      if (error) throw error;
      return (data ?? []) as TeacherProfile[];
    },
  });

  // ── Fetch tasks with teacher name join ──────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["admin-teacher-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_tasks")
        .select("*, profiles!teacher_tasks_assigned_to_fkey(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((t) => ({
        ...t,
        teacher_name: t.profiles?.name ?? "Unassigned",
      }));
    },
  });

  // ── Create task ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: me } = await supabase.auth.getUser();
      const { error } = await supabase.from("teacher_tasks").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        assigned_to: form.assigned_to || null,
        assigned_by: me?.user?.id ?? null,
        due_date: form.due_date || null,
        priority: form.priority,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-tasks"] });
      toast({ title: "Task created", description: "The task has been assigned." });
      setForm({ title: "", description: "", assigned_to: "", due_date: "", priority: "normal" });
      setShowForm(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── Delete task ─────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── Mark complete ───────────────────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("teacher_tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher-tasks"] });
      toast({ title: "Task marked complete" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── Group by teacher name ───────────────────────────────────────────────────
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const name = task.teacher_name ?? "Unassigned";
    if (!acc[name]) acc[name] = [];
    acc[name].push(task);
    return acc;
  }, {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* New Task button + inline form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          style={{ background: "linear-gradient(135deg, #052e16 0%, #166534 100%)", color: "white" }}
        >
          {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span style={{ color: "white" }}>{showForm ? "Cancel" : "New Task"}</span>
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Task title"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Additional details…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Assign To
                </label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">— Select teacher —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm"
                style={{ background: "linear-gradient(135deg, #052e16 0%, #166534 100%)", color: "white" }}
              >
                <Plus className="h-4 w-4" />
                <span style={{ color: "white" }}>
                  {createMutation.isPending ? "Creating…" : "Create Task"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Task list grouped by teacher */}
      {isLoading ? (
        <div className="text-sm text-gray-400 text-center py-8">Loading tasks…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">No tasks yet. Create one above.</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([teacherName, teacherTasks]) => (
            <div key={teacherName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100" style={{ background: "#f9fafb" }}>
                <h3 className="text-sm font-semibold text-gray-700 border-l-2 border-green-600 pl-3">
                  {teacherName}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {teacherTasks.length} task{teacherTasks.length !== 1 ? "s" : ""}
                  </span>
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Title
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">
                      Due
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Priority
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Status
                    </th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {teacherTasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-xs text-gray-500">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {task.status !== "completed" && (
                            <button
                              type="button"
                              title="Mark Complete"
                              disabled={completeMutation.isPending}
                              onClick={() => completeMutation.mutate(task.id)}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Delete Task"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(task.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
      )}
    </div>
  );
};
