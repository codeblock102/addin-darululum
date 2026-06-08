/**
 * @file src/hooks/useNotificationPreferences.ts
 * @summary React Query hook for reading and writing the current user's
 * notification preferences row in `public.notification_preferences`.
 *
 * RLS is responsible for scoping each user to their own row. If no row
 * exists yet, the GET resolves to a sensible default object so the form
 * is editable; the first save will upsert a row keyed on user_id.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";

export type Locale = "en" | "ar" | "ur";

export interface NotificationPreferences {
  user_id: string;
  // Tier defaults
  urgent_push: boolean;
  standard_digest: boolean;
  info_in_app_only: boolean;
  // Digest times (24h "HH:MM"); only meaningful when standard_digest === true
  digest_morning_at: string;
  digest_evening_at: string;
  // Quiet hours. The SQL has no `quiet_hours_enabled` column — it is derived
  // from whether `quiet_hours_start/end` are non-null on read, and persisted
  // by writing null start/end when disabled.
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  // Language
  locale: Locale;
  auto_translate_inbound: boolean;
  // Read receipts
  show_read_receipts: boolean;
  updated_at?: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  "user_id"
> = {
  urgent_push: true,
  standard_digest: true,
  info_in_app_only: true,
  digest_morning_at: "08:00",
  digest_evening_at: "18:00",
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  locale: "en",
  auto_translate_inbound: false,
  show_read_receipts: true,
};

const QUERY_KEY = ["notification-preferences"] as const;

export function useNotificationPreferences() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: [...QUERY_KEY, userId ?? "anon"] as const,
    enabled: Boolean(userId),
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!userId) throw new Error("Not authenticated");

      // Untyped table — cast through `any` until generated types catch up.
      // RLS restricts the select to the caller's own row.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { user_id: userId, ...DEFAULT_NOTIFICATION_PREFERENCES };
      }

      // Merge over defaults to be resilient if columns are missing. Derive
      // `quiet_hours_enabled` from whether the SQL nullable start/end columns
      // are both populated — there is no dedicated column for it.
      const row = data as Partial<NotificationPreferences> & {
        quiet_hours_start: string | null;
        quiet_hours_end: string | null;
      };
      const quietEnabled =
        row.quiet_hours_start != null && row.quiet_hours_end != null;
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...row,
        quiet_hours_start: row.quiet_hours_start ??
          DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours_start,
        quiet_hours_end: row.quiet_hours_end ??
          DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours_end,
        quiet_hours_enabled: quietEnabled,
        user_id: userId,
      };
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (
      prefs: Omit<NotificationPreferences, "user_id" | "updated_at">,
    ) => {
      if (!userId) throw new Error("Not authenticated");

      // `quiet_hours_enabled` is a UI-only field; persist disabled state by
      // writing null start/end into the SQL nullable columns instead.
      const {
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        ...rest
      } = prefs;

      const payload = {
        ...rest,
        quiet_hours_start: quiet_hours_enabled ? quiet_hours_start : null,
        quiet_hours_end: quiet_hours_enabled ? quiet_hours_end : null,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      // Re-derive `quiet_hours_enabled` from the persisted nullable columns
      // so the cached object matches what the read path would produce.
      const row = data as Partial<NotificationPreferences> & {
        quiet_hours_start: string | null;
        quiet_hours_end: string | null;
      };
      const quietEnabled =
        row.quiet_hours_start != null && row.quiet_hours_end != null;
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...row,
        quiet_hours_start: row.quiet_hours_start ??
          DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours_start,
        quiet_hours_end: row.quiet_hours_end ??
          DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours_end,
        quiet_hours_enabled: quietEnabled,
        user_id: userId,
      } satisfies NotificationPreferences;
    },
    onSuccess: (saved) => {
      // setQueryData alone is sufficient — avoid an immediate refetch that
      // would race the optimistic write and could rubber-band the UI.
      queryClient.setQueryData(
        [...QUERY_KEY, userId ?? "anon"] as const,
        saved,
      );
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
