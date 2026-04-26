/**
 * StudentDossier — the "Dossier" tab on the StudentDetail page.
 * Inspired by Mozaïk Portal's student dossier view:
 *   - Identity card (photo placeholder, DOB, permanent code, health card)
 *   - Assigned teachers (from the student's classes)
 *   - Contact info (primary guardian + secondary guardian)
 *   - Address
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  User,
  Heart,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  IdCard,
  Users,
} from "lucide-react";

interface StudentDossierProps {
  studentId: string;
  student: {
    id: string;
    name: string;
    grade?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    permanent_code?: string | null;
    health_card?: string | null;
    section?: string | null;
    guardian_name?: string | null;
    guardian_email?: string | null;
    guardian_contact?: string | null;
    secondary_guardian_email?: string | null;
    street?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    class_ids?: string[] | null;
  };
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {value || <span className="text-gray-400 font-normal">Not provided</span>}
      </span>
    </div>
  );
}

export function StudentDossier({ studentId, student }: StudentDossierProps) {
  // Fetch classes the student belongs to (via class_ids on the student row)
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["student-classes", studentId],
    queryFn: async () => {
      if (!student.class_ids?.length) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, teacher_id, profiles:teacher_id(name, subject, email)")
        .in("id", student.class_ids);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!student.class_ids?.length,
  });

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const dob = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const address = [student.street, student.city, student.province, student.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Identity card */}
      <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <IdCard className="h-4 w-4 text-blue-500" />
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{student.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {student.grade && (
                  <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                    Grade {student.grade}
                  </Badge>
                )}
                {student.gender && (
                  <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                    {student.gender}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-0">
            <InfoRow label="Date of Birth" value={dob} />
            <InfoRow label="Permanent Code" value={student.permanent_code} />
            <InfoRow label="Health Card #" value={student.health_card} />
            <InfoRow label="Section" value={student.section} />
          </div>
        </CardContent>
      </Card>

      {/* Teachers */}
      <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-500" />
            Assigned Teachers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !classes?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-2">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No classes assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => {
                const teacher = cls.profiles as { name?: string; subject?: string; email?: string } | null;
                return (
                  <div key={cls.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{teacher?.name ?? "Unassigned"}</p>
                      <p className="text-xs text-gray-500">{cls.name}</p>
                      {teacher?.subject && (
                        <p className="text-xs text-gray-400">{teacher.subject}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts + Address */}
      <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-500" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary guardian */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Primary Guardian</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-800">{student.guardian_name ?? <span className="text-gray-400">Not provided</span>}</span>
              </div>
              {student.guardian_contact && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`tel:${student.guardian_contact}`} className="text-blue-600 hover:underline">
                    {student.guardian_contact}
                  </a>
                </div>
              )}
              {student.guardian_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`mailto:${student.guardian_email}`} className="text-blue-600 hover:underline truncate">
                    {student.guardian_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Secondary guardian */}
          {student.secondary_guardian_email && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Secondary Guardian</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <a href={`mailto:${student.secondary_guardian_email}`} className="text-blue-600 hover:underline truncate">
                  {student.secondary_guardian_email}
                </a>
              </div>
            </div>
          )}

          {/* Address */}
          {address && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Address</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                <span className="text-gray-800">{address}</span>
              </div>
            </div>
          )}

          {/* Health reminder */}
          {student.health_card && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
              <Heart className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-700">Health card on file: {student.health_card}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
