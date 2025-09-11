import { useMemo, useState } from "react";
import { parseCsvOrTsv, readFileAsText } from "@/utils/csv.ts";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import type { TablesInsert } from "@/integrations/supabase/types.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";

type Row = Record<string, string>;

type ImportRowResult = {
  rowIndex: number;
  studentName: string;
  studentCreated: boolean;
  studentDuplicate: boolean;
  studentId?: string;
  studentError?: string;
  parentAttempted: boolean;
  parentCreated: boolean;
  parentError?: string;
  parentSkippedReason?: string;
};

// Database-oriented header names we accept from CSV (excluding system-managed like id, created_at)
const DB_EXPECTED_HEADERS = [
  "name",
  "date_of_birth",
  "guardian_name",
  "guardian_contact",
  "enrollment_date",
  "status",
  "completed_juz",
  "current_juz",
  "guardian_email",
  "madrassah_id",
  "section",
  "medical_condition",
  "home_address",
  "health_card_number",
  "permanent_code",
  "guardian_phone",
  "guardian_whatsapp",
  "preferred_language",
  "secondary_guardian_name",
  "secondary_guardian_phone",
  "secondary_guardian_whatsapp",
  "secondary_guardian_email",
  "secondary_guardian_home_address",
  "gender",
  "grade",
  "health_card",
  "street",
  "city",
  "province",
  "postal_code",
];

// Only the student's name is strictly required; others are optional
const REQUIRED_DB_HEADERS = ["name"] as const;

function normalizeHeader(input: string): string {
  let t = (input || "").trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1);
  }
  t = t.replace(/\r\n/g, "\n");
  // Collapse all whitespace (spaces, tabs, newlines) into a single space
  t = t.replace(/\s+/g, " ");
  return t.toLowerCase();
}

// Friendly headers expected from user's CSV and their accepted variants (including DB names)
const FRIENDLY_HEADER_ALIASES: Record<string, string[]> = {
  "Student Name": ["Student Name", "name"],
  "Gender": ["Gender", "gender"],
  "Location": ["Location"],
  "Grade": ["Grade", "grade"],
  "Hifz Program": ["Hifz Program"],
  "DOB MM-DD-YYYY": ["DOB MM-DD-YYYY", "DOB\nMM-DD-YYYY", "date_of_birth", "DOB"],
  "Language": ["Language", "preferred_language"],
  "Primary Contact": ["Primary Contact", "guardian_name"],
  "Phone Number": ["Phone Number", "guardian_contact", "guardian_phone"],
  "Email address": ["Email address", "guardian_email"],
  "Seconday Contact": ["Seconday Contact", "Secondary Contact", "secondary_guardian_name"],
  "Phone": ["Phone", "secondary_guardian_phone"],
  "Email": ["Email", "secondary_guardian_email"],
  "Emergency Contact": ["Emergency Contact", "COMMENTS", "medical_condition"],
  "Health Card": ["Health Card", "health_card", "health_card_number"],
  "Permenant Code": ["Permenant Code", "permanent_code"],
  "Student Folder": ["Student Folder", "home_address"],
  "Street": ["Street", "street"],
  "City": ["City", "city"],
  "PQ": ["PQ", "province"],
  "Postal Code": ["Postal Code", "postal_code"],
  "COMMENTS": ["COMMENTS", "medical_condition"],
};
const REQUIRED_FRIENDLY_HEADERS = Object.keys(FRIENDLY_HEADER_ALIASES);

// Aliases: support older user-friendly headers as alternatives for the same DB columns
const CSV_ALIASES: Record<string, string[]> = {
  name: ["name", "Student Name"],
  date_of_birth: ["date_of_birth", "DOB\nMM-DD-YYYY", "DOB MM-DD-YYYY"],
  guardian_name: ["guardian_name", "Primary Contact"],
  guardian_contact: ["guardian_contact", "Phone Number"],
  enrollment_date: ["enrollment_date"],
  status: ["status"],
  completed_juz: ["completed_juz"],
  current_juz: ["current_juz"],
  guardian_email: ["guardian_email", "Email address", "Email"],
  madrassah_id: ["madrassah_id"],
  section: ["section"],
  medical_condition: ["medical_condition", "COMMENTS", "Emergency Contact"],
  home_address: ["home_address", "Student Folder"],
  health_card_number: ["health_card_number", "Health Card"],
  permanent_code: ["permanent_code", "Permenant Code"],
  guardian_phone: ["guardian_phone", "Phone Number"],
  guardian_whatsapp: ["guardian_whatsapp"],
  preferred_language: ["preferred_language", "Language"],
  secondary_guardian_name: ["secondary_guardian_name", "Seconday Contact", "Secondary Contact"],
  secondary_guardian_phone: ["secondary_guardian_phone", "Phone"],
  secondary_guardian_whatsapp: ["secondary_guardian_whatsapp"],
  secondary_guardian_email: ["secondary_guardian_email", "Email"],
  secondary_guardian_home_address: ["secondary_guardian_home_address"],
  gender: ["gender", "Gender"],
  grade: ["grade", "Grade"],
  health_card: ["health_card", "Health Card"],
  street: ["street", "Street"],
  city: ["city", "City"],
  province: ["province", "PQ"],
  postal_code: ["postal_code", "Postal Code"],
};

function getValue(row: Row, keys: string[]): string | undefined {
  for (const k of keys) {
    if (k in row && typeof row[k] === "string") return row[k];
  }
  // Fallback: case/spacing-insensitive header match
  try {
    const normalizedMap = new Map<string, string>();
    for (const [rk, rv] of Object.entries(row)) {
      if (typeof rv === "string") normalizedMap.set(normalizeHeader(rk), rv);
    }
    for (const k of keys) {
      const nk = normalizeHeader(k);
      const v = normalizedMap.get(nk);
      if (typeof v === "string") return v;
    }
  } catch (_) {}
  return undefined;
}

function normalizeDateMmDdYyyy(input: string | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  // Accept both MM-DD-YYYY and MM/DD/YYYY
  const m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (!m) return null;
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  const yyyy = m[3];
  // Convert to ISO yyyy-mm-dd
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeGender(input: string | undefined): string | null {
  const s = (input || "").trim().toLowerCase();
  if (!s) return null;
  if (["m", "male"].includes(s)) return "male";
  if (["f", "female"].includes(s)) return "female";
  return s;
}

// Try to locate the actual header row if the file contains preface lines like section titles
function parseFromBestHeaderRow(text: string) {
  const lines = text.split(/\r?\n/);
  const maxScan = Math.min(200, Math.max(1, lines.length));
  let best = { idx: 0, score: -1, parsed: parseCsvOrTsv(text) };

  for (let i = 0; i < maxScan; i++) {
    const sliceText = i > 0 ? lines.slice(i).join("\n") : text;
    const parsed = parseCsvOrTsv(sliceText);
    const headerSet = new Set(parsed.headers.map((h) => normalizeHeader(h)));

    let score = 0;
    for (const friendly of Object.keys(FRIENDLY_HEADER_ALIASES)) {
      const aliases = (FRIENDLY_HEADER_ALIASES[friendly] || []).map((a) => normalizeHeader(a));
      if (aliases.some((a) => headerSet.has(a))) score++;
    }
    if (headerSet.has(normalizeHeader("Student Name"))) score += 5;

    if (score > best.score) {
      best = { idx: i, score, parsed };
      if (score >= Object.keys(FRIENDLY_HEADER_ALIASES).length - 1) break;
    }
  }
  return best.parsed;
}

export default function BulkStudentImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ ok: number; failed: number } | null>(null);
  const [rowResults, setRowResults] = useState<ImportRowResult[]>([]);

  const hasStudentNameHeader = useMemo(() => {
    const normalized = new Set(headers.map((h) => normalizeHeader(h)));
    const variants = (FRIENDLY_HEADER_ALIASES["Student Name"] || []).map((v) => normalizeHeader(v));
    return variants.some((v) => normalized.has(v));
  }, [headers]);

  const headerIssues = useMemo<string[]>(() => {
    if (headers.length === 0) return [];
    const normalized = new Set(headers.map((h) => normalizeHeader(h)));
    const issues: string[] = [];
    for (const friendly of REQUIRED_FRIENDLY_HEADERS) {
      const aliases = (FRIENDLY_HEADER_ALIASES[friendly] || []).map((a) => normalizeHeader(a));
      const found = aliases.some((a) => normalized.has(a));
      if (!found) issues.push(friendly);
    }
    return issues;
  }, [headers]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setRows([]);
    setHeaders([]);
    setResults(null);
    if (!f) return;
    setIsParsing(true);
    try {
      const text = await readFileAsText(f);
      const parsed = parseFromBestHeaderRow(text);
      setRows(parsed.rows);
      setHeaders(parsed.headers);
      if (parsed.rows.length === 0) {
        toast({ title: "No data", description: "The file contains headers but no rows.", variant: "destructive" });
      } else {
        const incoming = new Set(parsed.headers.map((h: string) => normalizeHeader(h)));
        const nameAliases = (FRIENDLY_HEADER_ALIASES["Student Name"] || []).map((v) => normalizeHeader(v));
        const hasName = nameAliases.some((v) => incoming.has(v));
        if (!hasName) {
          toast({ title: "Missing header", description: "The file must include a student name column.", variant: "destructive" });
      } else {
        toast({ title: "File loaded", description: `${parsed.rows.length} rows ready.` });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Failed to read file", description: msg, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  }

  async function importAll() {
    if (rows.length === 0) {
      toast({ title: "Nothing to import", description: "Please select a CSV/TSV file." });
      return;
    }
    if (!hasStudentNameHeader) {
      toast({ title: "Missing header", description: "The file must include 'Student Name'.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    setResults(null);
    setProgress(0);
    setRowResults([]);

    // Resolve current admin's madrassah_id
    let madrassahId: string | null = null;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("madrassah_id")
          .eq("id", uid)
          .maybeSingle();
        if (profile?.madrassah_id) madrassahId = profile.madrassah_id as string;
      }
    } catch (_) {}

    // Purge existing parents and students as requested (scoped to madrassah if available)
    async function purgeStudentsAndParents(targetMadrassahId: string | null) {
      try {
        // 1) Gather student ids for filtering join tables
        let studentIds: string[] = [];
        if (targetMadrassahId) {
          const { data: stRows } = await supabase
            .from("students")
            .select("id")
            .eq("madrassah_id", targetMadrassahId);
          studentIds = (stRows || []).map((s: { id: string }) => s.id);
        } else {
          const { data: stRows } = await supabase
            .from("students")
            .select("id");
          studentIds = (stRows || []).map((s: { id: string }) => s.id);
        }

        // 2) Delete parent_children links first
        if (studentIds.length > 0) {
          await supabase.from("parent_children").delete().in("student_id", studentIds);
        } else {
          // If no students found but we still want a full purge
          if (!targetMadrassahId) {
            await supabase.from("parent_children").delete().neq("id", "");
          }
        }

        // 3) Delete parents (by madrassah if known, else all)
        if (targetMadrassahId) {
          await supabase.from("parents").delete().eq("madrassah_id", targetMadrassahId);
        } else {
          await supabase.from("parents").delete().neq("id", "");
        }

        // 4) Delete parent profiles (cannot delete auth users from client)
        if (targetMadrassahId) {
          await supabase.from("profiles").delete().eq("madrassah_id", targetMadrassahId).eq("role", "parent");
        } else {
          await supabase.from("profiles").delete().eq("role", "parent");
        }

        // 5) Delete students last
        if (targetMadrassahId) {
          await supabase.from("students").delete().eq("madrassah_id", targetMadrassahId);
        } else {
          await supabase.from("students").delete().neq("id", "");
        }
      } catch (_) {
        // Non-fatal; continue with import even if purge partially fails
      }
    }

    // Invoke secure edge function to purge ONLY parents (keep students)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      const { data, error } = await supabase.functions.invoke("purge-parents-students", {
        body: { madrassah_id: madrassahId, delete_parents: true, delete_students: false },
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });
      if (!data && error) {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/purge-parents-students`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ madrassah_id: madrassahId, delete_parents: true, delete_students: false }),
        });
        if (!resp.ok) throw new Error(`purge failed: ${await resp.text()}`);
      }
    } catch (_) {
      // Fallback: client-side delete of parents table only
      try {
        if (madrassahId) {
          await supabase.from("parent_children").delete().neq("id", "");
          await supabase.from("parents").delete().eq("madrassah_id", madrassahId);
          await supabase.from("profiles").delete().eq("role", "parent").eq("madrassah_id", madrassahId);
        } else {
          await supabase.from("parent_children").delete().neq("id", "");
          await supabase.from("parents").delete().neq("id", "");
          await supabase.from("profiles").delete().eq("role", "parent");
        }
      } catch (_) {}
    }

    let ok = 0; let failed = 0;
    const perRow: ImportRowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const studentName = (getValue(r, CSV_ALIASES.name) || "").trim();
        if (!studentName) throw new Error("Missing Student Name");

        // Map CSV fields to DB columns, using sensible fallbacks
        const dob = normalizeDateMmDdYyyy(getValue(r, CSV_ALIASES.date_of_birth));
        const gender = normalizeGender(getValue(r, CSV_ALIASES.gender) || "") || null;
        const grade = (getValue(r, CSV_ALIASES.grade) || "").trim() || null;
        const health_card = (getValue(r, CSV_ALIASES.health_card) || "").trim() || null;
        const health_card_number = (getValue(r, CSV_ALIASES.health_card_number) || "").trim() || null;
        const permanent_code = (getValue(r, CSV_ALIASES.permanent_code) || "").trim() || null;
        const street = (getValue(r, CSV_ALIASES.street) || "").trim() || null;
        const city = (getValue(r, CSV_ALIASES.city) || "").trim() || null;
        const province = (getValue(r, CSV_ALIASES.province) || "").trim() || null;
        const postal_code = (getValue(r, CSV_ALIASES.postal_code) || "").trim() || null;
        const guardian_name = (getValue(r, CSV_ALIASES.guardian_name) || "").trim() || null;
        const guardian_contact = (getValue(r, CSV_ALIASES.guardian_contact) || "").trim() || null;
        const guardian_email = (getValue(r, CSV_ALIASES.guardian_email) || "").trim() || null;
        const preferred_language = (getValue(r, CSV_ALIASES.preferred_language) || "").trim() || null;
        const medical_condition = (getValue(r, CSV_ALIASES.medical_condition) || "").trim() || null;
        const guardian_phone = (getValue(r, CSV_ALIASES.guardian_phone) || "").trim() || null;
        const guardian_whatsapp = null as string | null;
        const secondary_guardian_name = (getValue(r, CSV_ALIASES.secondary_guardian_name) || "").trim() || null;
        const secondary_guardian_phone = (getValue(r, CSV_ALIASES.secondary_guardian_phone) || "").trim() || null;
        const secondary_guardian_email = (getValue(r, CSV_ALIASES.secondary_guardian_email) || "").trim() || null;
        const secondary_guardian_whatsapp = null as string | null;
        const home_address = (getValue(r, CSV_ALIASES.home_address) || [street, city, province, postal_code]
          .filter((v) => !!(v && String(v).trim()))
          .join(", ")) || null;
        const secondary_guardian_home_address = null as string | null;

        // Optional fields that may come from CSV
        const status = (getValue(r, CSV_ALIASES.status) || "active").trim() || "active";
        const sectionVal = (getValue(r, CSV_ALIASES.section) || "").trim();
        const section = sectionVal || null;
        const enrollment_date_csv = (getValue(r, CSV_ALIASES.enrollment_date) || "").trim();
        const enrollment_date = enrollment_date_csv || new Date().toISOString().split("T")[0];
        const madrassah_id_csv = (getValue(r, CSV_ALIASES.madrassah_id) || "").trim();
        const effectiveMadrassahId = madrassah_id_csv || madrassahId;

        // Parse fields that may be lists/numbers
        const completed_juz_raw = (getValue(r, CSV_ALIASES.completed_juz) || "").trim();
        let completed_juz: unknown = [];
        if (completed_juz_raw) {
          try {
            completed_juz = JSON.parse(completed_juz_raw);
          } catch {
            completed_juz = completed_juz_raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
          }
        }
        const current_juz_raw = (getValue(r, CSV_ALIASES.current_juz) || "").trim();
        const current_juz = current_juz_raw ? Number(current_juz_raw) || current_juz_raw : null;

        // Check if student already exists in this madrassah by name and optional DOB
        let existingStudentId: string | undefined;
        try {
          let q = supabase.from("students").select("id").eq("name", studentName);
          if (dob) q = q.eq("date_of_birth", dob);
          if (effectiveMadrassahId) q = q.eq("madrassah_id", effectiveMadrassahId);
          const { data: existingRows } = await q.limit(1);
          existingStudentId = existingRows?.[0]?.id as string | undefined;
        } catch (_) {
          existingStudentId = undefined;
        }

        let usingStudentId = existingStudentId;
        let studentCreated = false;
        let studentDuplicate = false;

        if (!existingStudentId) {
        // Create student
          const newStudentRow: TablesInsert<"students"> = {
            name: studentName,
            enrollment_date,
            date_of_birth: dob,
            gender,
            grade,
            health_card,
            permanent_code,
            street,
            city,
            province,
            postal_code,
            guardian_name,
            guardian_contact,
            guardian_email,
            status: (status as "active" | "inactive") ?? null,
            current_juz: current_juz as number | null,
            completed_juz: Array.isArray(completed_juz) ? (completed_juz as number[]) : null,
            madrassah_id: effectiveMadrassahId || null,
            section,
          };
          const { data: created, error: createError } = await supabase
            .from("students")
            .insert(newStudentRow)
          .select("id")
          .single();
        if (createError) throw createError;
          usingStudentId = created?.id as string | undefined;
          studentCreated = true;
        } else {
          studentDuplicate = true; // Existing student found; do not create new one
        }

        // Create/Link parent if email provided
        let parentAttempted = false;
        let parentCreated = false;
        let parentError: string | undefined;
        let parentSkippedReason: string | undefined;
        let secondaryParentAttempted = false;
        let secondaryParentCreated = false;
        let secondaryParentError: string | undefined;
        let secondaryParentSkippedReason: string | undefined;
        try {
          const isValidEmail = (email: string) => /.+@.+\..+/.test(email);
          const splitClean = (raw: string) => raw
            .split(/[;,\s|/]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
            .map((e) => e.replace(/\u00A0/g, ""))
            .map((e) => e.replace(/\s+/g, ""));

          const primaryCandidates = splitClean((guardian_email || "").trim());
          const secondaryCandidates = splitClean((secondary_guardian_email || "").trim());
          const miscCandidates = splitClean((medical_condition || "").trim());
          const allCandidates = [...primaryCandidates, ...secondaryCandidates, ...miscCandidates];
          const gEmail = allCandidates.find((e) => isValidEmail(e)) || "";

          if (!gEmail) {
            parentSkippedReason = "no valid email";
          } else if (usingStudentId) {
            parentAttempted = true;
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token || "";
            const { data, error } = await supabase.functions.invoke("create-parent", {
              body: {
                email: gEmail,
                name: guardian_name || secondary_guardian_name || gEmail,
                madrassah_id: effectiveMadrassahId || madrassahId,
                student_ids: [usingStudentId],
                phone: guardian_contact || secondary_guardian_phone || null,
              },
              headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
                apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
            });
            let result = data as any;
            let err = error as unknown;
            if (!result && err) {
              const token = accessToken;
              const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-parent`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                  apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  email: gEmail,
                  name: guardian_name || secondary_guardian_name || gEmail,
                  madrassah_id: effectiveMadrassahId || madrassahId,
                  student_ids: [usingStudentId],
                  phone: guardian_contact || secondary_guardian_phone || null,
                }),
              });
              result = resp.ok ? await resp.json() : null;
              err = resp.ok ? null : await resp.text();
              if (!resp.ok) throw new Error(typeof err === "string" ? err : "Failed to create parent");
            }
            parentCreated = Boolean(result?.metrics?.parentRowCreated === true || result?.metrics?.parentRowUpdated === true);
          } else {
            parentSkippedReason = studentDuplicate ? "student exists; linked id missing" : "student not created";
          }
        } catch (e) {
          parentError = e instanceof Error ? e.message : String(e);
        }

        // Secondary guardian account creation (optional)
        try {
          const rawSecondaryEmail = (secondary_guardian_email || "").trim();
          const secCandidates = rawSecondaryEmail
            .split(/[;,\s|/]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
            .map((e) => e.replace(/\.(?=\.)/g, "."))
            .map((e) => e.replace(/\u00A0/g, ""))
            .map((e) => e.replace(/\s+/g, ""));
          const secEmail = secCandidates.find((e) => /.+@.+\..+/.test(e)) || "";
          if (!secEmail) {
            secondaryParentSkippedReason = "no email";
          } else if (usingStudentId) {
            secondaryParentAttempted = true;
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token || "";
            const secName = secondary_guardian_name || secEmail;
            const { data, error } = await supabase.functions.invoke("create-parent", {
              body: {
                email: secEmail,
                name: secName,
                madrassah_id: effectiveMadrassahId || madrassahId,
                student_ids: [usingStudentId],
                phone: secondary_guardian_phone || null,
              },
              headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
                apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
            });
            let result = data as any;
            let err = error as unknown;
            if (!result && err) {
              const token = accessToken;
              const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-parent`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                  apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  email: secEmail,
                  name: secName,
                  madrassah_id: effectiveMadrassahId || madrassahId,
                  student_ids: [usingStudentId],
                  phone: secondary_guardian_phone || null,
                }),
              });
              result = resp.ok ? await resp.json() : null;
              err = resp.ok ? null : await resp.text();
              if (!resp.ok) throw new Error(typeof err === "string" ? err : "Failed to create parent");
            }
            secondaryParentCreated = Boolean(result?.metrics?.parentRowCreated === true || result?.metrics?.parentRowUpdated === true);
          } else {
            secondaryParentSkippedReason = studentDuplicate ? "student exists; linked id missing" : "student not created";
          }
        } catch (e) {
          secondaryParentError = e instanceof Error ? e.message : String(e);
        }
        perRow.push({
          rowIndex: i,
          studentName,
          studentCreated,
          studentDuplicate,
          studentId: usingStudentId,
          parentAttempted,
          parentCreated,
          parentError,
          parentSkippedReason,
          // we don't display secondary in summary counts for brevity, but keep in row data
        });

        ok++;
      } catch (e) {
        failed++;
        const studentName = (getValue(r, CSV_ALIASES.name) || "").trim() || `Row ${i + 1}`;
        perRow.push({
          rowIndex: i,
          studentName,
          studentCreated: false,
          studentDuplicate: false,
          studentError: e instanceof Error ? e.message : String(e),
          parentAttempted: false,
          parentCreated: false,
          parentSkippedReason: "student not created",
        });
      } finally {
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }
    }
    setRowResults(perRow);
    setResults({ ok, failed });
    setIsImporting(false);
    toast({ title: "Import finished", description: `${ok} succeeded, ${failed} failed.` });
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Student Import</CardTitle>
          <CardDescription>Upload a CSV/TSV with the specified headers. Students and their parent accounts will be created.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CSV/TSV File</Label>
            <Input type="file" accept=".csv,.tsv,.txt" onChange={onPickFile} disabled={isParsing || isImporting} />
          </div>

          {headers.length > 0 && (
            <div className="text-sm">
              <div className="font-medium mb-1">Detected headers:</div>
              <div className="flex flex-wrap gap-2">
                {headers.map((h) => (
                  <span key={h} className="px-2 py-1 rounded bg-muted text-muted-foreground">{h}</span>
                ))}
              </div>
              {headerIssues.length > 0 && (
                <div className="text-red-500 mt-2">Missing: {headerIssues.join(", ")}</div>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <div className="text-sm text-muted-foreground">{rows.length} rows parsed.</div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="text-sm text-muted-foreground">{progress}%</div>
            </div>
          )}

          {results && (
            <div className="space-y-2 text-sm">
              <div>Result: {results.ok} succeeded, {results.failed} failed.</div>
              {rowResults.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium">Students</div>
                  <div>
                    Created: {rowResults.filter(r => r.studentCreated).length} | Skipped (already exists): {rowResults.filter(r => r.studentDuplicate).length} | Failed: {rowResults.filter(r => r.studentError && !r.studentCreated && !r.studentDuplicate).length}
                  </div>
                  {rowResults.some(r => r.studentError && !r.studentCreated && !r.studentDuplicate) && (
                    <div className="text-red-500">Not created: {rowResults.filter(r => r.studentError && !r.studentCreated && !r.studentDuplicate).map(r => r.studentName).join(", ")}</div>
                  )}
                  <div className="font-medium mt-2">Parents</div>
                  <div>
                    Created/Updated: {rowResults.filter(r => r.parentCreated).length} | Failed: {rowResults.filter(r => r.parentAttempted && !r.parentCreated).length} | Skipped: {rowResults.filter(r => !r.parentAttempted && !!r.parentSkippedReason).length}
                  </div>
                  {rowResults.some(r => r.parentAttempted && !r.parentCreated) && (
                    <div className="text-red-500">Parent creation failed for: {rowResults.filter(r => r.parentAttempted && !r.parentCreated).map(r => r.studentName).join(", ")}</div>
                  )}
                  {rowResults.some(r => !r.parentAttempted && !!r.parentSkippedReason) && (
                    <div className="text-muted-foreground">Parent creation skipped for: {rowResults.filter(r => !r.parentAttempted && !!r.parentSkippedReason).map(r => `${r.studentName} (${r.parentSkippedReason})`).join(", ")}</div>
                  )}
                  {rowResults.some(r => r.parentError) && (
                    <div className="text-muted-foreground">Common errors: {
                      Array.from(new Set(rowResults.filter(r => r.parentError).map(r => r.parentError))).slice(0, 5).join(" | ")
                    }</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={importAll} disabled={isParsing || isImporting || rows.length === 0}>Import</Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 text-sm text-muted-foreground">
        Expected headers (any alias is accepted): {REQUIRED_FRIENDLY_HEADERS.join(" | ")}
      </div>
    </div>
  );
}


