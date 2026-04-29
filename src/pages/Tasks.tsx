import { TaskManager } from "@/components/admin/TaskManager.tsx";
import { AdminPageShell } from "@/components/admin/AdminPageShell.tsx";
import { CheckSquare } from "lucide-react";

export default function Tasks() {
  return (
    <AdminPageShell
      title="Task Manager"
      subtitle="Assign tasks to teachers and track completion"
      icon={<CheckSquare className="h-5 w-5" style={{ color: "#7c3aed" }} />}
      iconBg="bg-purple-100"
    >
      <TaskManager />
    </AdminPageShell>
  );
}
