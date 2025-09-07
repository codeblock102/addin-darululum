import { useMemo, useState } from "react";
import { parseCsvOrTsv, readFileAsText } from "@/utils/csv.ts";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";

type Row = Record<string, string>;

// Expected headers provided by user; only Student Name is strictly required.
const EXPECTED_HEADERS = [
  "Student Name",
  "Gender",
  "Location",
  "Grade",
  "Hifz Program",
  // Accept both with newline and without
  "DOB\nMM-DD-YYYY",
  "DOB MM-DD-YYYY",
  "Language",
  "Primary Contact",
  "Phone Number",
  "Email address",
  "Seconday Contact",
  "Phone",
  "Email",
  "Emergency Contact",
  "Health Card",
  "Permenant Code",
  "Student Folder",
  "Street",
  "City",
  "PQ",
  "Postal Code",
  "COMMENTS",
];

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

export default function BulkStudentImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ ok: number; failed: number } | null>(null);

  const hasStudentNameHeader = useMemo(() => headers.includes("Student Name"), [headers]);
  const dobHeaderKey = useMemo(() => {
    if (headers.includes("DOB\nMM-DD-YYYY")) return "DOB\nMM-DD-YYYY";
    if (headers.includes("DOB MM-DD-YYYY")) return "DOB MM-DD-YYYY";
    return null;
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
      const parsed = parseCsvOrTsv(text);
      setRows(parsed.rows);
      setHeaders(parsed.headers);
      if (parsed.rows.length === 0) {
        toast({ title: "No data", description: "The file contains headers but no rows.", variant: "destructive" });
      } else if (!parsed.headers.includes("Student Name")) {
        toast({ title: "Missing header", description: "The file must include 'Student Name'.", variant: "destructive" });
      } else {
        toast({ title: "File loaded", description: `${parsed.rows.length} rows ready.` });
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

    let ok = 0; let failed = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const studentName = (r["Student Name"] || "").trim();
        if (!studentName) throw new Error("Missing Student Name");

        // Map fields
        const dob = normalizeDateMmDdYyyy(dobHeaderKey ? r[dobHeaderKey] : undefined);
        const gender = normalizeGender(r["Gender"] || "") || null;
        const grade = (r["Grade"] || "").trim() || null;
        const health_card = (r["Health Card"] || "").trim() || null;
        const permanent_code = (r["Permenant Code"] || "").trim() || null;
        const street = (r["Street"] || "").trim() || null;
        const city = (r["City"] || "").trim() || null;
        const province = (r["PQ"] || "").trim() || null;
        const postal_code = (r["Postal Code"] || "").trim() || null;
        const guardian_name = (r["Primary Contact"] || "").trim() || null;
        const guardian_contact = (r["Phone Number"] || "").trim() || null;
        const guardian_email = (r["Email address"] || "").trim() || null;
        const medical_condition = (r["COMMENTS"] || "").trim() || null;

        // Create student
        const { data: created, error: createError } = await supabase
          .from("students")
          .insert({
            name: studentName,
            enrollment_date: new Date().toISOString().split("T")[0],
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
            status: "active",
            medical_condition,
            current_juz: null,
            completed_juz: [],
            madrassah_id: madrassahId,
            section: null,
          })
          .select("id")
          .single();
        if (createError) throw createError;
        const newStudentId = created?.id as string | undefined;

        // Link to admin (optional): no teacher assignment here

        // Create/Link parent if email provided
        try {
          const gEmail = (guardian_email || "").trim();
          if (gEmail && newStudentId) {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token || "";
            const { data, error } = await supabase.functions.invoke("create-parent", {
              body: {
                email: gEmail,
                name: guardian_name || gEmail,
                madrassah_id: madrassahId,
                student_ids: [newStudentId],
                phone: guardian_contact || null,
              },
              headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
                apikey: (await import("@/integrations/supabase/client.ts")).SUPABASE_PUBLISHABLE_KEY,
                "Content-Type": "application/json",
              },
            });
            let result = data;
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
                  name: guardian_name || gEmail,
                  madrassah_id: madrassahId,
                  student_ids: [newStudentId],
                  phone: guardian_contact || null,
                }),
              });
              result = resp.ok ? await resp.json() : null;
              err = resp.ok ? null : await resp.text();
              if (!resp.ok) throw new Error(typeof err === "string" ? err : "Failed to create parent");
            }
          }
        } catch (_) {
          // Non-fatal; continue
        }

        ok++;
      } catch (e) {
        failed++;
      } finally {
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }
    }
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
            <div className="text-sm">Result: {results.ok} succeeded, {results.failed} failed.</div>
          )}

          <div className="flex gap-2">
            <Button onClick={importAll} disabled={isParsing || isImporting || rows.length === 0}>Import</Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 text-sm text-muted-foreground">
        Expected headers: {EXPECTED_HEADERS.join(" | ")}
      </div>
    </div>
  );
}


