import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Loader2, Phone, Mail, User, ExternalLink, MessageSquare, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { getInitials } from "@/utils/stringUtils.ts";
import { cn } from "@/lib/utils.ts";

interface StudentContactPopoverProps {
  studentId: string;
  studentName: string;
  /** Optional — if passed, trigger is styled as a plain name span only for absent statuses */
  status?: string;
  /** When true the trigger is an info icon button instead of the student name */
  iconTrigger?: boolean;
}

const ABSENT_STATUSES = new Set(["absent", "sick", "late", "excused", "early_departure"]);

export function StudentContactPopover({
  studentId,
  studentName,
  status,
  iconTrigger = false,
}: StudentContactPopoverProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAbsent = !status || ABSENT_STATUSES.has(status);

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-contact-v2", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("guardian_name, guardian_contact, guardian_email, section, grade, class_ids")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // For the name-based trigger (used in attendance table), only show for absent students
  if (!iconTrigger && !isAbsent) {
    return <span className="text-gray-900 dark:text-gray-100">{studentName}</span>;
  }

  const trigger = iconTrigger ? (
    <button
      className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
      title="View contact"
      type="button"
    >
      <Info className="h-3.5 w-3.5" />
    </button>
  ) : (
    <button
      className={cn(
        "flex items-center gap-1 text-sm font-medium text-left group",
        "text-green-700 hover:text-green-800 transition-colors",
      )}
      title="View contact info"
    >
      {studentName}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 p-0 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900"
      >
        {/* HubSpot-style header — avatar + name */}
        <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-slate-700 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-base ring-2 ring-white/30">
              {getInitials(studentName)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-white leading-tight truncate">
                {studentName}
              </p>
              {(student?.section || student?.grade) && (
                <p className="text-xs text-slate-300 mt-0.5 truncate">
                  {[student.section, student.grade && `Grade ${student.grade}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {!student && !isLoading && (
                <p className="text-xs text-slate-400 mt-0.5">Student</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick action buttons — HubSpot row style */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          {[
            {
              icon: <Mail className="h-4 w-4" />,
              label: "Email",
              onClick: () => {
                if (student?.guardian_email) {
                  window.open(`mailto:${student.guardian_email}`);
                }
              },
              disabled: !student?.guardian_email,
            },
            {
              icon: <Phone className="h-4 w-4" />,
              label: "Call",
              onClick: () => {
                if (student?.guardian_contact) {
                  window.open(`tel:${student.guardian_contact}`);
                }
              },
              disabled: !student?.guardian_contact,
            },
            {
              icon: <MessageSquare className="h-4 w-4" />,
              label: "Message",
              onClick: () => {
                navigate("/messages");
                setOpen(false);
              },
              disabled: false,
            },
            {
              icon: <ExternalLink className="h-4 w-4" />,
              label: "Profile",
              onClick: () => {
                navigate(`/students/${studentId}`);
                setOpen(false);
              },
              disabled: false,
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled || isLoading}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                action.disabled || isLoading
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20",
              )}
              type="button"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Contact details */}
        <div className="px-4 py-3 space-y-2.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : !student?.guardian_name && !student?.guardian_contact && !student?.guardian_email ? (
            <div className="py-2 text-center">
              <p className="text-sm text-gray-500">No guardian info on file.</p>
              <p className="text-xs text-gray-400 mt-1">
                Update the student profile to add contact details.
              </p>
            </div>
          ) : (
            <>
              {student?.guardian_name && (
                <ContactRow
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Guardian"
                  value={student.guardian_name}
                />
              )}
              {student?.guardian_contact && (
                <ContactRow
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label="Phone"
                  value={student.guardian_contact}
                  href={`tel:${student.guardian_contact}`}
                />
              )}
              {student?.guardian_email && (
                <ContactRow
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label="Email"
                  value={student.guardian_email}
                  href={`mailto:${student.guardian_email}`}
                />
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-slate-500 dark:text-slate-400">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
