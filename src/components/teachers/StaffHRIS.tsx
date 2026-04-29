import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useState } from "react";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Users,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  section: string | null;
  grade: number | null;
  bio: string | null;
  capabilities: string[] | null;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-amber-100 text-amber-800 border-amber-200" },
  teacher: { label: "Teacher", color: "bg-green-100 text-green-800 border-green-200" },
  secretary: { label: "Secretary", color: "bg-blue-100 text-blue-800 border-blue-200" },
};

const avatarColors = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

interface StaffHRISProps {
  madrassahId?: string;
}

export function StaffHRIS({ madrassahId }: StaffHRISProps) {
  const [search, setSearch] = useState("");

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff-hris", madrassahId],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, name, role, email, phone, subject, section, grade, bio, capabilities")
        .in("role", ["teacher", "admin", "secretary"])
        .order("name");
      if (madrassahId) query = query.eq("madrassah_id", madrassahId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StaffMember[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = staff.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.section?.toLowerCase().includes(q)
    );
  });

  const totalTeachers = staff.filter((s) => s.role === "teacher").length;
  const totalAdmins = staff.filter((s) => s.role === "admin").length;
  const subjects = [...new Set(staff.map((s) => s.subject).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* HRIS Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <GraduationCap className="h-4.5 w-4.5 text-green-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalTeachers}</p>
            <p className="text-xs text-gray-500">Teachers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Briefcase className="h-4.5 w-4.5 text-amber-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalAdmins}</p>
            <p className="text-xs text-gray-500">Administrators</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <BookOpen className="h-4.5 w-4.5 text-purple-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{subjects.length}</p>
            <p className="text-xs text-gray-500">Subjects</p>
          </div>
        </div>
      </div>

      {/* Subject tags */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Subjects Taught
          </p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 text-xs"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, subject, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-gray-200"
        />
      </div>

      {/* Staff Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No staff members found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((member, idx) => {
            const initials = (member.name ?? "?")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();
            const color = avatarColors[idx % avatarColors.length];
            const rc = roleConfig[member.role ?? ""] ?? { label: member.role ?? "Staff", color: "bg-gray-100 text-gray-700 border-gray-200" };

            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${color}`}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {member.name ?? "Unknown"}
                    </p>
                    <Badge variant="outline" className={`text-xs ${rc.color}`}>
                      {rc.label}
                    </Badge>
                  </div>

                  {/* Subject & Grade tags */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {member.subject && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">
                        <BookOpen className="h-3 w-3" />
                        {member.subject}
                      </span>
                    )}
                    {member.section && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">
                        {member.section}
                      </span>
                    )}
                    {member.grade != null && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2 py-0.5">
                        Grade {member.grade}
                      </span>
                    )}
                    {(member.capabilities ?? []).slice(0, 2).map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center text-xs bg-gray-50 text-gray-600 border border-gray-100 rounded-full px-2 py-0.5"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* Contact row */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-1 hover:text-green-700 transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-1 hover:text-green-700 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </a>
                    )}
                  </div>

                  {member.bio && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{member.bio}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
