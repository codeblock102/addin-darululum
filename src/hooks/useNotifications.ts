/**
 * Notification System Hook
 *
 * Generates in-app notifications from live analytics data — no new database
 * table required. Dismissed notifications are stored in localStorage so they
 * don't reappear until the underlying issue is resolved.
 *
 * Notification types:
 *  - "at_risk"         – student attendance <70% or no progress in 14+ days
 *  - "stagnation"      – student has had no progress logged in 7+ days
 *  - "low_attendance"  – class attendance rate below 75%
 *  - "overcapacity"    – class at ≥95% capacity
 *  - "teacher_warning" – teacher has ≥3 at-risk students
 */

import { useMemo } from "react";
import { useAnalyticsLive } from "./useAnalyticsLive.ts";

export type NotificationType =
  | "at_risk"
  | "stagnation"
  | "low_attendance"
  | "overcapacity"
  | "teacher_warning";

export type NotificationSeverity = "critical" | "warning" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  /** ISO timestamp the notification was generated */
  generatedAt: string;
  /** Optional link to navigate to */
  href?: string;
}

const DISMISSED_KEY = "app_dismissed_notifications";
const DISMISSED_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Read dismissed notification IDs from localStorage (prune stale ones) */
function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed: Record<string, number> = JSON.parse(raw);
    const now = Date.now();
    const valid: Record<string, number> = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < DISMISSED_TTL_MS) valid[id] = ts;
    }
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(valid));
    return new Set(Object.keys(valid));
  } catch {
    return new Set();
  }
}

export function dismissNotification(id: string) {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
    parsed[id] = Date.now();
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage errors
  }
}

export function dismissAllNotifications(ids: string[]) {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    for (const id of ids) parsed[id] = now;
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage errors
  }
}

/**
 * Generate the full notification list from live analytics data.
 * Returns { notifications, unreadCount, isLoading, error }.
 */
export function useNotifications() {
  const { data, isLoading, error } = useAnalyticsLive();

  const notifications = useMemo<AppNotification[]>(() => {
    if (!data) return [];

    const dismissed = getDismissed();
    const now = new Date().toISOString();
    const list: AppNotification[] = [];

    // ── At-risk students ──────────────────────────────────────────────────
    for (const student of data.students) {
      if (!student.isAtRisk) continue;

      const reasons: string[] = [];
      if (student.attendanceRate !== null && student.attendanceRate < 70) {
        reasons.push(`${Math.round(student.attendanceRate)}% attendance`);
      }
      if (student.daysSinceProgress >= 14) {
        reasons.push(
          student.daysSinceProgress === 999
            ? "no progress ever recorded"
            : `no progress in ${student.daysSinceProgress} days`
        );
      }

      list.push({
        id: `at_risk_${student.id}`,
        type: "at_risk",
        severity: "critical",
        title: `${student.name} is at risk`,
        message: reasons.join(" · "),
        generatedAt: now,
        href: `/students/${student.id}`,
      });
    }

    // ── Stagnation (7-13 days — not yet at-risk but needs attention) ──────
    for (const student of data.students) {
      if (student.isAtRisk) continue; // already covered above
      if (!student.isStagnant) continue;

      list.push({
        id: `stagnant_${student.id}`,
        type: "stagnation",
        severity: "warning",
        title: `${student.name} has no recent progress`,
        message: `No progress logged in ${student.daysSinceProgress} days`,
        generatedAt: now,
        href: `/students/${student.id}`,
      });
    }

    // ── Class low attendance ──────────────────────────────────────────────
    for (const cls of data.classes) {
      if (cls.attendanceRate === null || cls.attendanceRate >= 75) continue;

      list.push({
        id: `low_att_${cls.id}`,
        type: "low_attendance",
        severity: cls.attendanceRate < 60 ? "critical" : "warning",
        title: `Low attendance in ${cls.name}`,
        message: `${cls.attendanceRate.toFixed(0)}% attendance over the last 30 days`,
        generatedAt: now,
        href: "/classes",
      });
    }

    // ── Overcapacity classes ──────────────────────────────────────────────
    for (const cls of data.classes) {
      if (cls.capacityUtilization < 95) continue;

      list.push({
        id: `overcap_${cls.id}`,
        type: "overcapacity",
        severity: "warning",
        title: `${cls.name} is near capacity`,
        message: `${cls.currentStudents}/${cls.capacity} students (${cls.capacityUtilization.toFixed(0)}% full)`,
        generatedAt: now,
        href: "/classes",
      });
    }

    // ── Teachers with many at-risk students ───────────────────────────────
    for (const teacher of data.teachers) {
      if (teacher.atRiskCount < 3) continue;

      list.push({
        id: `teacher_warn_${teacher.id}`,
        type: "teacher_warning",
        severity: teacher.atRiskCount >= 5 ? "critical" : "warning",
        title: `${teacher.name || "A teacher"} has ${teacher.atRiskCount} at-risk students`,
        message: `Consider reviewing their student group and offering support`,
        generatedAt: now,
        href: "/analytics?tab=teachers",
      });
    }

    // Filter out dismissed notifications
    return list.filter((n) => !dismissed.has(n.id));
  }, [data]);

  // Sort: critical first, then warning, then info
  const sorted = useMemo(() => {
    const order: Record<NotificationSeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    return [...notifications].sort(
      (a, b) => order[a.severity] - order[b.severity]
    );
  }, [notifications]);

  return {
    notifications: sorted,
    unreadCount: sorted.length,
    isLoading,
    error,
  };
}
