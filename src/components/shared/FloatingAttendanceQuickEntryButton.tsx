import { useMemo, useState } from "react";
import { CalendarCheck, Clock, CalendarX, CheckCircle2, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { StudentSearch } from "@/components/student-progress/StudentSearch.tsx";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { format } from "date-fns";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";

type QuickAttendanceForm = {
  date: Date;
  time: string;
  status: "present" | "absent" | "late" | "excused" | "early_departure";
  notes?: string;
  late_reason?: string;
};

export const FloatingAttendanceQuickEntryButton = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const teacherId = session?.user?.id || "";

  const now = useMemo(() => new Date(), []);

  const form = useForm<QuickAttendanceForm>({
    defaultValues: {
      date: now,
      time: format(now, "HH:mm"),
      status: "present",
      notes: "",
      late_reason: "",
    },
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedStudentId("");
    form.reset();
  };

  const handleSubmit = async (values: QuickAttendanceForm) => {
    if (!selectedStudentId) return;
    try {
      const record = {
        student_id: selectedStudentId,
        date: format(values.date || new Date(), "yyyy-MM-dd"),
        time: values.time,
        status: values.status,
        notes: values.notes || null,
        late_reason: values.status === "late" ? (values.late_reason || null) : null,
        class_id: null as string | null,
      };

      const { error } = await supabase
        .from("attendance")
        .upsert([record], { onConflict: "student_id,date" });
      if (error) throw error;

      toast({ title: "Attendance saved", description: "The attendance was recorded successfully." });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      handleClose();
    } catch (e) {
      toast({
        title: "Error",
        description: formatErrorMessage(e),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className={"fixed right-4 z-[60] " + (isMobile ? "bottom-36" : "bottom-24")}>
        <button
          onClick={handleOpen}
          className="relative h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-amber-950 transition-all hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 border border-amber-500/40 flex items-center justify-center"
          aria-label="Quick attendance entry"
          type="button"
        >
          <CheckCircle2 className="h-6 w-6 text-amber-900" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? handleOpen() : handleClose())}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white text-gray-900 border border-emerald-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">Quick Attendance Entry</DialogTitle>
            <DialogDescription className="text-gray-600">Select a student and record attendance.</DialogDescription>
          </DialogHeader>

          {/* Step 1: Select Student */}
          {!selectedStudentId && (
            <div className="space-y-4">
              <StudentSearch
                onStudentSelect={(id) => setSelectedStudentId(id)}
                showHeader={false}
                teacherId={teacherId}
                accent="amber"
              />
            </div>
          )}

          {/* Step 2: Attendance Form (no external tabs; form is self-contained) */}
          {selectedStudentId && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" value={format(field.value || new Date(), "yyyy-MM-dd")} onChange={(e) => field.onChange(new Date(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                          <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-emerald-50">
                            <RadioGroupItem value="present" id="qa-present" />
                            <CalendarCheck className="h-4 w-4 text-green-600" /> Present
                          </label>
                          <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-emerald-50">
                            <RadioGroupItem value="absent" id="qa-absent" />
                            <CalendarX className="h-4 w-4 text-red-600" /> Absent
                          </label>
                          <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-emerald-50">
                            <RadioGroupItem value="late" id="qa-late" />
                            <Clock className="h-4 w-4 text-amber-600" /> Late
                          </label>
                          <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-emerald-50">
                            <RadioGroupItem value="excused" id="qa-excused" />
                            <CalendarCheck className="h-4 w-4 text-blue-600" /> Excused
                          </label>
                          <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-emerald-50">
                            <RadioGroupItem value="early_departure" id="qa-early-departure" />
                            <LogOut className="h-4 w-4 text-indigo-600" /> Early Departure
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("status") === "late" && (
                  <FormField
                    control={form.control}
                    name="late_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Reason</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                  <Button type="submit">Save Attendance</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};


