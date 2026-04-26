import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useState } from "react";
import { AlertTriangle, Heart, Pencil, Save, ShieldCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";

interface Props {
  studentId: string;
  isAdmin?: boolean;
}

interface HealthRecord {
  medical_condition: string | null;
  health_notes: string | null;
  health_card: string | null;
}

export function StudentHealthIEP({ studentId, isAdmin = false }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [iepEnabled, setIepEnabled] = useState(false);
  const [form, setForm] = useState<{
    medical_condition: string;
    health_notes: string;
    iep_notes: string;
  }>({ medical_condition: "", health_notes: "", iep_notes: "" });

  const { data: health, isLoading } = useQuery({
    queryKey: ["student-health", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("medical_condition, health_notes, health_card")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data as HealthRecord;
    },
    onSuccess: (data) => {
      setForm({
        medical_condition: data.medical_condition ?? "",
        health_notes: data.health_notes ?? "",
        iep_notes: "",
      });
    },
  });

  const { mutate: save, isLoading: saving } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("students")
        .update({
          medical_condition: form.medical_condition || null,
          health_notes: form.health_notes || null,
        })
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-health", studentId] });
      setEditing(false);
      toast({ title: "Health record updated" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const hasAllergies = health?.medical_condition?.toLowerCase().includes("allerg");
  const hasMedical = !!(health?.medical_condition);

  return (
    <div className="space-y-4">
      {/* Alert strip */}
      {hasMedical && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Medical Condition on File</p>
            <p className="text-sm text-red-600 mt-0.5">{health.medical_condition}</p>
          </div>
        </div>
      )}

      {/* Health Records */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Health Records
            </CardTitle>
            {isAdmin && !editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="h-8 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {editing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => save()}
                  disabled={saving}
                  className="h-8 gap-1.5 bg-green-700 hover:bg-green-800"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health card number */}
          {health?.health_card && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Health Card #</span>
              <span className="text-sm font-mono font-medium text-gray-800">{health.health_card}</span>
            </div>
          )}

          {/* Medical condition */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 block">
              Medical Condition / Allergies
            </Label>
            {editing ? (
              <Textarea
                value={form.medical_condition}
                onChange={(e) => setForm((f) => ({ ...f, medical_condition: e.target.value }))}
                placeholder="e.g. Peanut allergy, asthma, diabetes..."
                className="text-sm min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2.5 min-h-[60px]">
                {health?.medical_condition || (
                  <span className="text-gray-400 italic">No medical conditions on file</span>
                )}
              </p>
            )}
          </div>

          {/* Health notes */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 block">
              Health Notes
            </Label>
            {editing ? (
              <Textarea
                value={form.health_notes}
                onChange={(e) => setForm((f) => ({ ...f, health_notes: e.target.value }))}
                placeholder="Additional health information, medications, emergency instructions..."
                className="text-sm min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2.5 min-h-[60px]">
                {health?.health_notes || (
                  <span className="text-gray-400 italic">No health notes on file</span>
                )}
              </p>
            )}
          </div>

          {/* Allergy badges */}
          {hasAllergies && !editing && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                ⚠ Allergy
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IEP / Special Education */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              IEP / Accommodations
            </CardTitle>
            {isAdmin && (
              <Switch
                checked={iepEnabled}
                onCheckedChange={setIepEnabled}
                aria-label="Toggle IEP"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {iepEnabled ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs font-medium text-blue-700 mb-1">IEP Active</p>
                <p className="text-xs text-blue-600">
                  Individual Education Plan is enabled for this student. Document accommodations, modifications, and support services below.
                </p>
              </div>
              <Textarea
                value={form.iep_notes}
                onChange={(e) => setForm((f) => ({ ...f, iep_notes: e.target.value }))}
                placeholder="Accommodations, learning modifications, support services..."
                className="text-sm min-h-[100px]"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">
              No IEP / special education plan on file.
              {isAdmin && " Toggle the switch above to enable."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
