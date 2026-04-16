/**
 * AbsenceReasonSelect — structured absence reason dropdown
 * Categories mirror Mozaïk Portal (Quebec school standard) with bilingual labels.
 */
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";

export type AbsenceReason =
  | "sports_cultural"
  | "court_police"
  | "family_other"
  | "family_driving_test"
  | "family_bereavement"
  | "family_vacation"
  | "health_hospitalization"
  | "health_illness"
  | "health_respiratory"
  | "health_other"
  | "other";

interface AbsenceReasonOption {
  value: AbsenceReason;
  label: string;
  group: string;
}

export const ABSENCE_REASONS: AbsenceReasonOption[] = [
  // Sports / Cultural
  { value: "sports_cultural", label: "Sports or cultural activity (outside school)", group: "Activities" },
  // Legal
  { value: "court_police", label: "Court hearing / police intervention", group: "Legal" },
  // Family
  { value: "family_other", label: "Family reason — other", group: "Family" },
  { value: "family_driving_test", label: "Family reason — driving test", group: "Family" },
  { value: "family_bereavement", label: "Family reason — bereavement", group: "Family" },
  { value: "family_vacation", label: "Family reason — vacation / travel", group: "Family" },
  // Health
  { value: "health_hospitalization", label: "Health — hospitalization", group: "Health" },
  { value: "health_illness", label: "Health — illness", group: "Health" },
  { value: "health_respiratory", label: "Health — respiratory symptoms", group: "Health" },
  { value: "health_other", label: "Health — other medical", group: "Health" },
  // Other
  { value: "other", label: "Other (description required)", group: "Other" },
];

export function absenceReasonLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const opt = ABSENCE_REASONS.find((r) => r.value === value);
  return opt ? opt.label : value;
}

const GROUPS = ["Activities", "Legal", "Family", "Health", "Other"];

interface AbsenceReasonSelectProps {
  value: string;
  onChange: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  /** When true, renders the description textarea below the select */
  showDescription?: boolean;
}

export function AbsenceReasonSelect({
  value,
  onChange,
  description = "",
  onDescriptionChange,
  showDescription = true,
}: AbsenceReasonSelectProps) {
  const needsDescription = value === "other";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">Absence Reason</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full border-gray-300 bg-white focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="Select a reason…" />
          </SelectTrigger>
          <SelectContent>
            {GROUPS.map((group) => {
              const items = ABSENCE_REASONS.filter((r) => r.group === group);
              return (
                <SelectGroup key={group}>
                  <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                    {group}
                  </SelectLabel>
                  {items.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="pl-4">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {showDescription && (value || needsDescription) && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Description {needsDescription && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange?.(e.target.value)}
            placeholder={
              needsDescription
                ? "Please describe the reason for this absence…"
                : "Additional details (optional)"
            }
            rows={2}
            className="resize-none border-gray-300 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
