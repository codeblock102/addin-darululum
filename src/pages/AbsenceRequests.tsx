import { CalendarOff } from "lucide-react";
import { AbsenceRequestsPanel } from "@/components/admin/AbsenceRequestsPanel.tsx";
import { AdminPageShell } from "@/components/admin/AdminPageShell.tsx";

export default function AbsenceRequests() {
  return (
    <AdminPageShell
      title="Absence Requests"
      subtitle="Review and approve teacher absence requests"
      icon={<CalendarOff className="h-5 w-5" style={{ color: "#dc2626" }} />}
      iconBg="bg-red-50"
    >
      <AbsenceRequestsPanel />
    </AdminPageShell>
  );
}
