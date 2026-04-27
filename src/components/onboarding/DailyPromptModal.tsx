import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { usePageHelp } from "@/hooks/usePageHelp.ts";
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromptItem {
  icon: React.ReactNode;
  title: string;
  body: string;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const TEACHER_PROMPTS: PromptItem[] = [
  {
    icon: <CalendarCheck className="h-5 w-5 text-emerald-600" />,
    title: "Take today's attendance",
    body: "Open Attendance in the sidebar and mark each student — present, absent, late, or sick. Do this at the start of the session.",
  },
  {
    icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
    title: "Log Quran progress",
    body: "Use the Progress Book tab to record each student's recitation — surah, juz, ayat, and quality. Parents see this in real time.",
  },
  {
    icon: <MessageCircle className="h-5 w-5 text-emerald-600" />,
    title: "Check your messages",
    body: "Parents may have sent messages overnight. Reply from the Messages section — they receive email notifications.",
  },
  {
    icon: <ClipboardList className="h-5 w-5 text-emerald-600" />,
    title: "Review assignments",
    body: "Check the Assignments tab for anything due today and update submission statuses if needed.",
  },
];

const ADMIN_PROMPTS: PromptItem[] = [
  {
    icon: <CalendarCheck className="h-5 w-5 text-green-700" />,
    title: "Check today's attendance",
    body: "The Attendance Monitor shows who's present, absent, and not yet marked. Flag anything unusual early.",
  },
  {
    icon: <Users className="h-5 w-5 text-green-700" />,
    title: "Review the absence watchlist",
    body: "Go to Attendance → Watchlist tab to see students with repeat absences. Reach out to parents if streaks are growing.",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-green-700" />,
    title: "Check the activity feed",
    body: "The Activity Feed shows all teacher actions — progress logs, attendance, and assignments — since yesterday.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-green-700" />,
    title: "Pending admin tasks",
    body: "Check for unlinked parent accounts, new parent requests, or any pending bulk student imports.",
  },
];

const PARENT_PROMPTS: PromptItem[] = [
  {
    icon: <TrendingUp className="h-5 w-5 text-teal-600" />,
    title: "Check your child's progress",
    body: "The Progress tab shows the latest Quran recitation entries your child's teacher has logged — including quality and notes.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5 text-teal-600" />,
    title: "View attendance",
    body: "The Attendance tab shows your child's full attendance history. You'll be emailed if they're marked absent.",
  },
  {
    icon: <MessageCircle className="h-5 w-5 text-teal-600" />,
    title: "Message the teacher",
    body: "Have a question or update? Use the Messages section to reach your child's teacher directly.",
  },
  {
    icon: <UserCheck className="h-5 w-5 text-teal-600" />,
    title: "Review assignments",
    body: "The Academics tab shows current and past assignments with due dates and submission status.",
  },
];

// ─── Storage key ─────────────────────────────────────────────────────────────

const storageKey = (userId: string) =>
  `dum_daily_${userId}_${format(new Date(), "yyyy-MM-dd")}`;

const onboardingKey = (userId: string) => `dum_onboarded_${userId}`;

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyPromptModal() {
  const { session } = useAuth();
  const { isAdmin, isTeacher, isParent, isLoading } = useRBAC();
  const { enabled } = usePageHelp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !session?.user?.id || !enabled) return;
    const uid = session.user.id;
    // Don't show if the onboarding modal hasn't been completed yet
    if (!localStorage.getItem(onboardingKey(uid))) return;
    if (!localStorage.getItem(storageKey(uid))) {
      setOpen(true);
    }
  }, [isLoading, session, enabled]);

  const prompts = isAdmin
    ? ADMIN_PROMPTS
    : isTeacher
    ? TEACHER_PROMPTS
    : isParent
    ? PARENT_PROMPTS
    : [];

  if (!prompts.length) return null;

  const accentGradient = isAdmin
    ? "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)"
    : isTeacher
    ? "linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)"
    : "linear-gradient(135deg, #134e4a 0%, #0f766e 55%, #0d9488 100%)";

  const accentLight = isAdmin ? "#86efac" : isTeacher ? "#6ee7b7" : "#5eead4";
  const checkColor = isAdmin ? "text-green-700" : isTeacher ? "text-emerald-700" : "text-teal-700";
  const checkBg = isAdmin ? "bg-green-50" : isTeacher ? "bg-emerald-50" : "bg-teal-50";

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  const handleClose = () => {
    if (session?.user?.id) {
      localStorage.setItem(storageKey(session.user.id), "1");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 rounded-2xl">
        {/* Header */}
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{ background: accentGradient }}
        >
          <div
            className="absolute -right-6 -top-6 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <p className="text-sm font-medium relative" style={{ color: accentLight }}>
            {todayLabel}
          </p>
          <h2 className="text-xl font-bold text-white mt-1 relative">
            {greeting} 👋
          </h2>
          <p className="text-sm mt-1 relative" style={{ color: accentLight }}>
            Here's your daily checklist for today.
          </p>
        </div>

        {/* Checklist */}
        <div className="px-6 py-5 space-y-3">
          {prompts.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", checkBg)}>
                {item.icon}
              </div>
              <div>
                <p className={cn("text-sm font-semibold", checkColor)}>{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {prompts.map((_, i) => (
              <CheckCircle2 key={i} className={cn("h-3.5 w-3.5", checkColor, "opacity-30")} />
            ))}
          </div>
          <Button
            onClick={handleClose}
            className="rounded-xl px-6 font-semibold"
            style={{ background: accentGradient }}
          >
            Let's go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
