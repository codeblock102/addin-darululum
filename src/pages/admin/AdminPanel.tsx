/**
 * AdminPanel — consolidated tabbed hub for low-frequency admin tools.
 * Replaces 6 sidebar entries with one entry. Each tab renders an existing
 * admin page directly; deep-linkable via ?tab= query param.
 */
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Upload,
  FileText,
  Activity as ActivityIcon,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
} from "lucide-react";
import BulkStudentImport from "@/pages/admin/BulkStudentImport.tsx";
import CommunicationTemplates from "@/pages/admin/CommunicationTemplates.tsx";
import Activity from "@/pages/admin/Activity.tsx";
import Interviews from "@/pages/admin/Interviews.tsx";
import TeacherSchedules from "@/pages/admin/TeacherSchedules.tsx";
import AbsenceRequests from "@/pages/AbsenceRequests.tsx";

const TABS = [
  { id: "bulk-import", label: "Bulk Import", icon: Upload, body: BulkStudentImport },
  { id: "templates", label: "Templates", icon: FileText, body: CommunicationTemplates },
  { id: "activity", label: "Activity Log", icon: ActivityIcon, body: Activity },
  { id: "interviews", label: "Interviews", icon: CalendarCheck, body: Interviews },
  { id: "schedules", label: "Teacher Schedules", icon: CalendarDays, body: TeacherSchedules },
  { id: "absences", label: "Absence Requests", icon: CalendarOff, body: AbsenceRequests },
] as const;

const VALID_IDS = TABS.map((t) => t.id);

export default function AdminPanel() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const active = requested && VALID_IDS.includes(requested as typeof VALID_IDS[number])
    ? requested
    : "bulk-import";

  const setActive = (next: string) => {
    setParams({ tab: next }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Hub header strip */}
      <div className="bg-white border-b border-gray-100 px-6 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hub for less-frequent admin tools. Daily workflows live in the main sidebar.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6 flex flex-wrap gap-1 h-auto">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-green-50 data-[state=active]:text-green-900 data-[state=active]:shadow-sm rounded-lg"
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => {
            const Body = t.body;
            return (
              <TabsContent key={t.id} value={t.id} className="mt-0">
                <Body />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
