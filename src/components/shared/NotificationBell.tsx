/**
 * Notification Bell
 *
 * Displays a bell icon with an unread-count badge in the sidebar header.
 * Clicking it opens a dropdown panel showing all active notifications
 * grouped by severity (critical → warning → info).
 *
 * Each notification can be individually dismissed (stored in localStorage
 * for 7 days). There is also a "Clear all" button.
 *
 * Notifications are generated from live analytics data via useNotifications().
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, X, AlertTriangle, Clock, Users, GraduationCap, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import {
  useNotifications,
  dismissNotification,
  dismissAllNotifications,
  type AppNotification,
  type NotificationType,
  type NotificationSeverity,
} from "@/hooks/useNotifications.ts";

// ── Icon per notification type ─────────────────────────────────────────────
function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "at_risk":
      return <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
    case "stagnation":
      return <Clock className="h-4 w-4 flex-shrink-0" />;
    case "low_attendance":
      return <Users className="h-4 w-4 flex-shrink-0" />;
    case "overcapacity":
      return <GraduationCap className="h-4 w-4 flex-shrink-0" />;
    case "teacher_warning":
      return <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
  }
}

// ── Severity colour mapping ────────────────────────────────────────────────
const SEVERITY_STYLES: Record<
  NotificationSeverity,
  { border: string; bg: string; icon: string; badge: string }
> = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    icon: "text-red-600",
    badge: "bg-red-500",
  },
  warning: {
    border: "border-l-yellow-400",
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    badge: "bg-yellow-500",
  },
  info: {
    border: "border-l-blue-400",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    badge: "bg-blue-500",
  },
};

// ── Single notification row ────────────────────────────────────────────────
function NotifRow({
  notif,
  onDismiss,
  onNavigate,
}: {
  notif: AppNotification;
  onDismiss: (id: string) => void;
  onNavigate: (href?: string) => void;
}) {
  const style = SEVERITY_STYLES[notif.severity];

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-l-4 transition-colors",
        style.border,
        style.bg,
        notif.href && "cursor-pointer hover:brightness-95"
      )}
      onClick={() => notif.href && onNavigate(notif.href)}
    >
      <span className={cn("mt-0.5", style.icon)}>
        <NotifIcon type={notif.type} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
          {notif.title}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{notif.message}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {notif.href && (
          <button
            className="text-gray-400 hover:text-primary transition-colors p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(notif.href);
            }}
            title="Go to details"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notif.id);
          }}
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function NotificationBell({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notifications: allNotifs, unreadCount, isLoading } = useNotifications();

  // Filter out locally dismissed (without waiting for re-render from localStorage)
  const notifications = allNotifs.filter((n) => !localDismissed.has(n.id));
  const displayCount = notifications.length;

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDismiss = useCallback((id: string) => {
    dismissNotification(id);
    setLocalDismissed((prev) => new Set([...prev, id]));
  }, []);

  const handleDismissAll = useCallback(() => {
    const ids = notifications.map((n) => n.id);
    dismissAllNotifications(ids);
    setLocalDismissed((prev) => new Set([...prev, ...ids]));
    setOpen(false);
  }, [notifications]);

  const handleNavigate = useCallback(
    (href?: string) => {
      if (href) {
        navigate(href);
        setOpen(false);
      }
    },
    [navigate]
  );

  const criticalCount = notifications.filter((n) => n.severity === "critical").length;
  const badgeCount = displayCount;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-colors",
          collapsed ? "h-9 w-9" : "h-9 w-9",
          open
            ? "bg-gray-100 text-gray-900"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
        title={`${badgeCount} notification${badgeCount !== 1 ? "s" : ""}`}
      >
        <Bell className="h-5 w-5" />

        {/* Badge */}
        {badgeCount > 0 && !isLoading && (
          <span
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1",
              criticalCount > 0 ? "bg-red-500" : "bg-yellow-500"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute z-[100] mt-2 w-80 rounded-xl shadow-2xl bg-white border border-gray-200 overflow-hidden",
            // Collapsed sidebar: open to the right. Expanded: open downward aligned to left of bell
            collapsed ? "left-full top-0 ml-2" : "left-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">
                Notifications
                {displayCount > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-gray-500">
                    ({displayCount})
                  </span>
                )}
              </span>
            </div>
            {displayCount > 0 && (
              <button
                onClick={handleDismissAll}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">All clear — no notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onDismiss={handleDismiss}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  navigate("/analytics?tab=alerts");
                  setOpen(false);
                }}
                className="text-xs text-primary hover:underline w-full text-center"
              >
                View full alerts dashboard →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
