import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useToast } from "@/hooks/use-toast.ts";

interface AbsenceRequest {
  id: string;
  teacher_id: string;
  date: string;
  end_date: string | null;
  reason: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function formatDateRange(date: string, endDate: string | null) {
  if (!endDate || endDate === date) return date;
  return `${date} → ${endDate}`;
}

export const AbsenceRequestsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: requests = [], isLoading } = useQuery<AbsenceRequest[]>({
    queryKey: ["admin-absence-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_requests")
        .select("*, profiles!absence_requests_teacher_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AbsenceRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("absence_requests")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Request approved" });
      queryClient.invalidateQueries({ queryKey: ["admin-absence-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminNote }: { id: string; adminNote: string }) => {
      const { error } = await supabase
        .from("absence_requests")
        .update({
          status: "rejected",
          admin_note: adminNote || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Request rejected" });
      setRejectingId(null);
      setRejectNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-absence-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to reject", variant: "destructive" });
    },
  });

  const handleRejectConfirm = (id: string) => {
    rejectMutation.mutate({ id, adminNote: rejectNote });
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="border-l-2 border-green-600 pl-3">
          <h2 className="text-base font-semibold text-gray-900">Teacher Absence Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and manage teacher absence submissions</p>
        </div>

        {/* Filter pill buttons */}
        <div className="inline-flex items-center gap-0.5 bg-gray-100/70 p-1 rounded-xl self-start sm:self-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === f.id
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-gray-400 py-4">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3 pr-4">Teacher</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3 pr-4">Date(s)</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3 pr-4">Reason</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3 pr-4">Submitted</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3 pr-4">Status</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-800">
                    {req.profiles?.full_name ?? "Unknown"}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                    {formatDateRange(req.date, req.end_date)}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 max-w-[180px]">
                    <span className="block truncate" title={req.reason}>{req.reason}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[req.status] ?? ""}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {req.status === "pending" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-semibold hover:bg-green-800 transition-colors disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(rejectingId === req.id ? null : req.id);
                              setRejectNote("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                        {rejectingId === req.id && (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              placeholder="Reason for rejection (optional)"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 w-48"
                            />
                            <button
                              type="button"
                              onClick={() => handleRejectConfirm(req.id)}
                              disabled={rejectMutation.isPending}
                              className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      req.admin_note ? (
                        <span className="text-xs text-gray-400 italic">{req.admin_note}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
