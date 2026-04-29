import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { Send, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  class_name: string | null;
  class_id: string | null;
  sent_to_count: number;
  created_at: string;
}

interface AnnouncementComposerProps {
  teacherId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AnnouncementComposer = ({ teacherId }: AnnouncementComposerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    class_id: "",
    title: "",
    message: "",
  });

  // Teacher's classes
  const { data: classes = [] } = useTeacherClasses(teacherId);

  // Announcement history (last 10)
  const { data: history = [] } = useQuery<Announcement[]>({
    queryKey: ["teacher-announcements", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, class_name, class_id, sent_to_count, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
    enabled: !!teacherId,
  });

  // Send announcement mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const selectedClass = classes.find((c) => c.id === form.class_id);
      const className = selectedClass?.name ?? null;

      // Insert announcement row
      const { data: inserted, error: insertErr } = await supabase
        .from("announcements")
        .insert({
          teacher_id: teacherId,
          class_id: form.class_id || null,
          class_name: className,
          title: form.title.trim(),
          message: form.message.trim(),
          sent_to_count: 0,
        })
        .select("id")
        .single();

      if (insertErr || !inserted) throw new Error(insertErr?.message ?? "Failed to save announcement");

      // Invoke edge function
      const { error: fnErr } = await supabase.functions.invoke("send-class-announcement", {
        body: { announcement_id: inserted.id },
      });

      if (fnErr) throw new Error(fnErr.message ?? "Failed to send emails");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-announcements", teacherId] });
      toast({ title: "Announcement sent", description: "Parents have been notified." });
      setForm({ class_id: "", title: "", message: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Error sending announcement", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id) {
      toast({ title: "Please select a class", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!form.message.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
      {/* Header */}
      <h2 className="text-sm font-semibold text-gray-900 border-l-2 border-green-600 pl-3">
        Class Announcements
      </h2>

      {/* Compose form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Class
          </label>
          <select
            value={form.class_id}
            onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          >
            <option value="">— Select class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.subject ? ` · ${c.subject}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Upcoming test on Friday"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Message
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={4}
            placeholder="Write your announcement here…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm"
            style={{ background: "linear-gradient(135deg, #052e16 0%, #166534 100%)", color: "white" }}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span style={{ color: "white" }}>Sending…</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span style={{ color: "white" }}>Send to All Parents</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Recent Announcements
          </h3>
          <div className="space-y-2">
            {history.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50/70"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs text-gray-400">
                      {new Date(ann.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {ann.class_name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {ann.class_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{ann.title}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 pt-0.5">
                  Sent to {ann.sent_to_count} parent{ann.sent_to_count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
