import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useToast } from "@/hooks/use-toast.ts";

interface AbsenceRequest {
  id: string;
  date: string;
  end_date: string | null;
  reason: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
}

interface AbsenceRequestFormProps {
  teacherId: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function formatDateRange(date: string, endDate: string | null) {
  if (!endDate || endDate === date) return date;
  return `${date} → ${endDate}`;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export const AbsenceRequestForm = ({ teacherId }: AbsenceRequestFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch last 5 requests
  const { data: history = [] } = useQuery<AbsenceRequest[]>({
    queryKey: ["absence-requests", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_requests")
        .select("id, date, end_date, reason, notes, status, admin_note, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as AbsenceRequest[];
    },
    enabled: !!teacherId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("absence_requests").insert({
        teacher_id: user?.id,
        date: fromDate,
        end_date: toDate || null,
        reason,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Request submitted", description: "Your absence request has been sent." });
      setFromDate("");
      setToDate("");
      setReason("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["absence-requests", teacherId] });
    },
    onError: () => {
      toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !reason.trim()) return;
    submitMutation.mutate();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="border-l-2 border-green-600 pl-3">
        <h2 className="text-base font-semibold text-gray-900">Absence Requests</h2>
        <p className="text-sm text-gray-500 mt-0.5">Submit a new absence request</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">From *</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">To <span className="text-gray-400">(optional)</span></label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Reason *</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Medical appointment, Family emergency..."
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Notes <span className="text-gray-400">(optional)</span></label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600"
          />
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {submitMutation.isPending ? "Submitting…" : "Submit Request"}
        </button>
      </form>

      {/* History */}
      <div className="space-y-3">
        <div className="border-l-2 border-green-600 pl-3">
          <h3 className="text-sm font-semibold text-gray-700">Recent Requests</h3>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No requests submitted yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-800">
                    {formatDateRange(req.date, req.end_date)}
                  </p>
                  <p className="text-sm text-gray-500">{truncate(req.reason, 40)}</p>
                  {req.admin_note && (
                    <p className="text-xs text-gray-400 italic">Admin: {req.admin_note}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold self-start sm:self-auto capitalize ${STATUS_BADGE[req.status] ?? ""}`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
