import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Loader2, Phone, Mail, User, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { cn } from "@/lib/utils.ts";

interface StudentContactPopoverProps {
  studentId: string;
  studentName: string;
  /** Only render the trigger as a clickable link for non-present statuses */
  status?: string;
}

const ABSENT_STATUSES = new Set(["absent", "sick", "late", "excused", "early_departure"]);

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-green-700">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

export function StudentContactPopover({
  studentId,
  studentName,
  status,
}: StudentContactPopoverProps) {
  const [open, setOpen] = useState(false);
  const isAbsent = !status || ABSENT_STATUSES.has(status);

  const { data: contact, isLoading } = useQuery({
    queryKey: ["student-contact", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("guardian_name, guardian_contact, guardian_email")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const hasContact =
    contact?.guardian_name || contact?.guardian_contact || contact?.guardian_email;

  if (!isAbsent) {
    return <span className="text-gray-900">{studentName}</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-sm font-medium text-left group",
            "text-green-700 hover:text-green-800 transition-colors",
          )}
          title="View contact info"
        >
          {studentName}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 p-0 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div
          className="px-4 py-3"
          style={{
            background:
              "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                {studentName}
              </p>
              <p className="text-[11px] text-green-200 mt-0.5">Guardian contact info</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            </div>
          ) : !hasContact ? (
            <div className="py-3 text-center">
              <p className="text-sm text-gray-500">No contact info on file.</p>
              <p className="text-xs text-gray-400 mt-1">
                Update the student's profile to add guardian details.
              </p>
            </div>
          ) : (
            <>
              <ContactRow
                icon={<User className="h-3.5 w-3.5" />}
                label="Guardian"
                value={contact?.guardian_name}
              />
              <ContactRow
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                value={contact?.guardian_contact}
                href={
                  contact?.guardian_contact
                    ? `tel:${contact.guardian_contact}`
                    : undefined
                }
              />
              <ContactRow
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                value={contact?.guardian_email}
                href={
                  contact?.guardian_email
                    ? `mailto:${contact.guardian_email}`
                    : undefined
                }
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
