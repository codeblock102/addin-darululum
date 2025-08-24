import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { useRBAC } from "@/hooks/useRBAC.ts";

interface AttendanceSettingsRow {
  madrassah_id: string;
  enabled: boolean;
  cutoff_time: string;
  timezone: string;
  last_sent_date: string | null;
}

export function AttendanceCutoffSettings() {
  const { isAdmin } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [madrassahId, setMadrassahId] = useState<string | null>(null);

  // Resolve current user's madrassah_id
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", uid)
        .maybeSingle();
      setMadrassahId((profile?.madrassah_id as string) || null);
    })();
  }, []);

  const tzOptions = useMemo(
    () => [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Asia/Karachi",
      "Asia/Dubai",
    ],
    [],
  );

  const { data: settings, isLoading } = useQuery<AttendanceSettingsRow | null>({
    queryKey: ["attendance-settings", madrassahId],
    queryFn: async () => {
      if (!madrassahId) return null;
      const { data, error } = await supabase
        .from("attendance_settings")
        .select("madrassah_id, enabled, cutoff_time, timezone, last_sent_date")
        .eq("madrassah_id", madrassahId)
        .maybeSingle();
      if (error) throw error;
      return (data as AttendanceSettingsRow) || null;
    },
    enabled: !!madrassahId && isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<AttendanceSettingsRow>) => {
      if (!madrassahId) throw new Error("No madrassah");
      const payload = {
        madrassah_id: madrassahId,
        enabled: values.enabled ?? settings?.enabled ?? true,
        cutoff_time: values.cutoff_time ?? settings?.cutoff_time ?? "09:30",
        timezone: values.timezone ?? settings?.timezone ?? "America/New_York",
      };
      const { error } = await supabase
        .from("attendance_settings")
        .upsert(payload, { onConflict: "madrassah_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Attendance cutoff settings updated." });
      queryClient.invalidateQueries({ queryKey: ["attendance-settings", madrassahId] });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message || "Unable to save", variant: "destructive" });
    },
  });

  if (!isAdmin) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Attendance Cutoff</CardTitle>
        <CardDescription>Configure the daily cutoff time to email guardians of students not marked present.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <form
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const enabled = (formData.get("enabled") as string) === "on";
              const cutoff_time = (formData.get("cutoff_time") as string) || "09:30";
              const timezone = (formData.get("timezone") as string) || "America/New_York";
              saveMutation.mutate({ enabled, cutoff_time, timezone });
            }}
          >
            <div className="flex items-center gap-2">
              <Switch id="enabled" name="enabled" defaultChecked={settings?.enabled ?? true} />
              <Label htmlFor="enabled">Enable notifications</Label>
            </div>
            <div>
              <Label htmlFor="cutoff_time">Cutoff time</Label>
              <Input id="cutoff_time" name="cutoff_time" type="time" defaultValue={settings?.cutoff_time ?? "09:30"} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={settings?.timezone ?? "America/New_York"}
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
              >
                {tzOptions.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
            {settings?.last_sent_date && (
              <div className="sm:col-span-5 text-xs text-muted-foreground">
                Last run (per madrassah local date): {settings.last_sent_date}
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}


