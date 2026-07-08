/**
 * @file src/pages/NotificationsSettings.tsx
 * @summary Notification preferences page — lets the signed-in user choose
 * how and when they hear from the app (tier defaults, digest times, quiet
 * hours, language, read receipts). Persists to
 * `public.notification_preferences` via {@link useNotificationPreferences}.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { Loader2 } from "lucide-react";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type Locale,
  type NotificationPreferences,
  useNotificationPreferences,
} from "@/hooks/useNotificationPreferences.ts";
import { LOCALE_STORAGE_KEY } from "@/hooks/useDirection.ts";

// Mirror the saved locale into localStorage so useDirection (mounted on every
// page) can resolve writing direction without issuing its own network fetch.
function syncLocaleCache(locale: string | undefined) {
  if (typeof window === "undefined" || !locale) return;
  try {
    const prev = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (prev === locale) return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    // Notify same-tab listeners; "storage" events normally only fire in other tabs.
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LOCALE_STORAGE_KEY,
        newValue: locale,
        oldValue: prev,
      }),
    );
  } catch {
    // Ignore quota / privacy-mode failures — direction will just fall back.
  }
}

type EditablePrefs = Omit<NotificationPreferences, "user_id" | "updated_at">;

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية (Arabic)",
  ur: "اردو (Urdu)",
};

function ToggleRow(
  { id, title, description, checked, onCheckedChange, disabled }: {
    id: string;
    title: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
    disabled?: boolean;
  },
) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 min-h-[44px]">
      <div className="flex-1">
        <Label htmlFor={id} className="text-sm font-medium text-gray-900">
          {title}
        </Label>
        {description
          ? (
            <p className="text-xs text-gray-500 mt-1">
              {description}
            </p>
          )
          : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-1"
      />
    </div>
  );
}

function TimeField(
  { id, label, value, onChange, disabled }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  },
) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm text-gray-700">{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11"
      />
    </div>
  );
}

export default function NotificationsSettings() {
  const { preferences, isLoading, save, isSaving } =
    useNotificationPreferences();
  const { toast } = useToast();

  const [draft, setDraft] = useState<EditablePrefs>(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  }));
  const [baseline, setBaseline] = useState<EditablePrefs>(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  }));

  // Sync draft when server data lands.
  useEffect(() => {
    if (!preferences) return;
    const { user_id: _u, updated_at: _t, ...editable } = preferences;
    setDraft(editable);
    setBaseline(editable);
    // Seed the locale cache so useDirection has a fresh value without fetching.
    syncLocaleCache(editable.locale);
  }, [preferences]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baseline),
    [draft, baseline],
  );

  const update = <K extends keyof EditablePrefs>(
    key: K,
    value: EditablePrefs[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await save(draft);
      setBaseline(draft);
      // Keep the locale cache in lock-step with the persisted value.
      syncLocaleCache(draft.locale);
      toast({
        title: "Preferences saved",
        description: "Your notification settings have been updated.",
      });
    } catch (err) {
      toast({
        title: "Couldn't save preferences",
        description: err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => setDraft(baseline);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] pb-32">
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-10 space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Notifications
          </h1>
          <p className="text-sm text-gray-500">
            Choose how and when you hear from us.
          </p>
        </header>

        {/* 1. Tier defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tier defaults</CardTitle>
            <CardDescription>
              Choose how each type of message reaches you.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            <ToggleRow
              id="urgent_push"
              title="Urgent push"
              description="Time-sensitive alerts always arrive as a push notification."
              checked={draft.urgent_push}
              onCheckedChange={(v) => update("urgent_push", v)}
            />
            <ToggleRow
              id="standard_digest"
              title="Standard digest"
              description={draft.standard_digest
                ? "Bundled into your morning and evening digests."
                : "Get standard messages instantly"}
              checked={draft.standard_digest}
              onCheckedChange={(v) => update("standard_digest", v)}
            />
            <ToggleRow
              id="info_in_app_only"
              title="Info in-app only"
              description="Low-priority updates appear inside the app — no push, no email."
              checked={draft.info_in_app_only}
              onCheckedChange={(v) => update("info_in_app_only", v)}
            />
          </CardContent>
        </Card>

        {/* 2. Digest times */}
        {draft.standard_digest
          ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Digest times</CardTitle>
                <CardDescription>
                  When should we deliver your bundled standard messages?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TimeField
                    id="digest_morning_at"
                    label="Morning digest"
                    value={draft.digest_morning_at}
                    onChange={(v) => update("digest_morning_at", v)}
                  />
                  <TimeField
                    id="digest_evening_at"
                    label="Evening digest"
                    value={draft.digest_evening_at}
                    onChange={(v) => update("digest_evening_at", v)}
                  />
                </div>
              </CardContent>
            </Card>
          )
          : null}

        {/* 3. Quiet hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quiet hours</CardTitle>
            <CardDescription>
              We'll hold non-urgent notifications during this window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              id="quiet_hours_disabled"
              title="Disable quiet hours"
              description="Turn this on to receive all notifications around the clock."
              checked={!draft.quiet_hours_enabled}
              onCheckedChange={(v) => update("quiet_hours_enabled", !v)}
            />
            {draft.quiet_hours_enabled
              ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <TimeField
                    id="quiet_hours_start"
                    label="Start"
                    value={draft.quiet_hours_start}
                    onChange={(v) => update("quiet_hours_start", v)}
                  />
                  <TimeField
                    id="quiet_hours_end"
                    label="End"
                    value={draft.quiet_hours_end}
                    onChange={(v) => update("quiet_hours_end", v)}
                  />
                </div>
              )
              : null}
          </CardContent>
        </Card>

        {/* 4. Language */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Language</CardTitle>
            <CardDescription>
              Set the language of notifications you receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locale" className="text-sm text-gray-700">
                Preferred language
              </Label>
              <Select
                value={draft.locale}
                onValueChange={(value) => update("locale", value as Locale)}
              >
                <SelectTrigger id="locale" className="h-11">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
                    <SelectItem key={code} value={code}>
                      {LOCALE_LABELS[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label
              htmlFor="auto_translate"
              className="flex items-start gap-3 py-2 min-h-[44px] cursor-pointer"
            >
              <Checkbox
                id="auto_translate"
                checked={draft.auto_translate_inbound}
                onCheckedChange={(value) =>
                  update("auto_translate_inbound", value === true)}
                className="mt-0.5 h-5 w-5"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  Auto-translate incoming messages
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Translate messages from teachers and admins into your
                  preferred language.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* 5. Read receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Read receipts</CardTitle>
            <CardDescription>
              Let senders know when you've seen their message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleRow
              id="read_receipts"
              title="Show read receipts on standard messages"
              description="Urgent alerts always show a read receipt."
              checked={draft.show_read_receipts}
              onCheckedChange={(v) => update("show_read_receipts", v)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            {isDirty
              ? "You have unsaved changes."
              : "All changes saved."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="h-11"
            >
              Discard
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="h-11 min-w-[110px]"
            >
              {isSaving
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                )
                : (
                  "Save changes"
                )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
