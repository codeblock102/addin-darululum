import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export const FloatingDailyEmailButton = () => {
  const isMobile = useIsMobile();
  const { hasCapability, isAdmin } = useRBAC();
  const { session } = useAuth();
  const teacherId = session?.user?.id || "";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>("school");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherSection, setTeacherSection] = useState<string | null>(null);
  const [adminSections, setAdminSections] = useState<string[]>([]);

  // Load teacher classes for class-scoped sending
  const { data: teacherClasses } = useTeacherClasses(teacherId);
  const [adminClasses, setAdminClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Admins can access all classes
  useEffect(() => {
    const loadAll = async () => {
      if (!isAdmin) return;
      try {
        setLoadingClasses(true);
        const { data, error } = await supabase
          .from("classes")
          .select("id, name")
          .order("name", { ascending: true });
        if (!error) setAdminClasses((data || []) as Array<{ id: string; name: string }>);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadAll();
  }, [isAdmin]);

  // Load teacher section for section-scoped sending
  useEffect(() => {
    const loadSection = async () => {
      if (!teacherId) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("section")
        .eq("id", teacherId)
        .maybeSingle();
      if (!error) {
        setTeacherSection((data?.section as string) || null);
      }
    };
    loadSection();
  }, [teacherId]);

  // Admin: load available sections for their madrassah
  useEffect(() => {
    const loadAdminSections = async () => {
      if (!isAdmin || !teacherId) return;
      // Get admin's madrassah_id
      const { data: prof } = await supabase
        .from("profiles")
        .select("madrassah_id")
        .eq("id", teacherId)
        .maybeSingle();
      const madrassahId = (prof as any)?.madrassah_id;
      if (!madrassahId) return;
      const { data: mad } = await supabase
        .from("madrassahs")
        .select("section")
        .eq("id", madrassahId)
        .maybeSingle();
      const sectionsArr = Array.isArray((mad as any)?.section) ? ((mad as any).section as string[]) : [];
      setAdminSections(Array.from(new Set(sectionsArr.filter(Boolean))));
    };
    loadAdminSections();
  }, [isAdmin, teacherId]);

  const canSend = useMemo(() => isAdmin || hasCapability("daily_progress_email"), [isAdmin, hasCapability]);
  if (!canSend) return null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setTarget("school");
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const isSchool = target === "school";
      const isSection = target === "section" || target.startsWith("section:");
      const selectedSection = isSection
        ? (target === "section" ? (teacherSection || null) : target.slice("section:".length))
        : null;
      const payload: Record<string, unknown> = {
        source: "manual_ui",
        timestamp: new Date().toISOString(),
        scope: isSchool ? "school" : (isSection ? "section" : "class"),
        classId: isSchool || isSection ? null : target,
        section: isSection ? selectedSection : null,
      };

      const { data, error } = await supabase.functions.invoke("daily-progress-email", {
        body: payload,
      });
      if (error) throw error;
      toast({ title: "Emails triggered", description: `Sent ${data?.emailsSent ?? 0} emails, skipped ${data?.emailsSkipped ?? 0}.` });
      handleClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: "Failed to send", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={"fixed right-4 z-[60] " + (isMobile ? "bottom-52" : "bottom-40")}> 
        <button
          onClick={handleOpen}
          className="relative h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-sky-600 to-sky-500 text-white transition-all hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 border border-sky-500/40 flex items-center justify-center"
          aria-label="Send daily progress emails"
          type="button"
        >
          <Send className="h-6 w-6" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? handleOpen() : handleClose())}>
        <DialogContent className="sm:max-w-[520px] bg-white text-gray-900 border border-sky-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700">Daily Progress Emails</DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose target for today's progress emails.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Target</div>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">Entire school</SelectItem>
                  {teacherSection && !isAdmin && (
                    <SelectItem value="section">{teacherSection} - Section</SelectItem>
                  )}
                  {isAdmin && adminSections.map((sec) => (
                    <SelectItem key={sec} value={`section:${sec}`}>Section — {sec}</SelectItem>
                  ))}
                  {((isAdmin ? adminClasses : (teacherClasses || [])) as Array<{ id: string; name: string }>).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confirmation of where it will send */}
            <div className="text-xs text-gray-600">
              {target === "school" && (
                <span>It will send to: Entire school</span>
              )}
              {target === "section" && teacherSection && (
                <span>It will send to: Section — {teacherSection}</span>
              )}
              {target.startsWith("section:") && (
                <span>It will send to: Section — {target.slice("section:".length)}</span>
              )}
              {target !== "school" && target !== "section" && (
                (() => {
                  const allClasses = ((isAdmin ? adminClasses : (teacherClasses || [])) as Array<{ id: string; name: string }>);
                  const found = allClasses.find((c) => c.id === target);
                  return <span>It will send to: Class — {found?.name || "Selected class"}</span>;
                })()
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting || (!target)}>
                {isSubmitting ? "Sending…" : "Send Emails"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingDailyEmailButton;


