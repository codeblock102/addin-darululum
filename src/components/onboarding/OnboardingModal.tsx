import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Shield,
  Users,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ADMIN_STEPS: OnboardingStep[] = [
  {
    icon: <Shield className="h-6 w-6 text-green-600" />,
    title: "Welcome, Administrator",
    description:
      "As an admin you have full visibility into the school — students, teachers, attendance, and analytics. This quick tour covers the key areas.",
  },
  {
    icon: <Users className="h-6 w-6 text-green-600" />,
    title: "Student & Teacher Management",
    description:
      "Use the Students page to manage enrolments and view dossiers. The Teachers page is your staff directory — add staff, assign subjects and grades.",
  },
  {
    icon: <ClipboardList className="h-6 w-6 text-green-600" />,
    title: "Attendance Tracking",
    description:
      "The Attendance page lets you record daily status (present, absent, late, sick, excused, early departure). Use Multi-day Absence for planned absences.",
  },
  {
    icon: <GraduationCap className="h-6 w-6 text-green-600" />,
    title: "Analytics & Reports",
    description:
      "The Analytics dashboard shows live KPIs: at-risk students, attendance trends, and progress rates across all classes.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    title: "You're all set!",
    description:
      "Your dashboard is live with real data. Reach out to support if you need help with any features.",
  },
];

const TEACHER_STEPS: OnboardingStep[] = [
  {
    icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
    title: "Welcome, Teacher",
    description:
      "This portal is your hub for tracking student Quran progress, taking attendance, and communicating with parents. Here's a quick overview.",
  },
  {
    icon: <ClipboardList className="h-6 w-6 text-emerald-600" />,
    title: "Taking Attendance",
    description:
      "Go to Attendance in the sidebar to record daily status for your students. You can mark present, absent, late, sick, or early departure in seconds.",
  },
  {
    icon: <BookOpen className="h-6 w-6 text-emerald-600" />,
    title: "Progress (Dhor Book)",
    description:
      "Log each student's Quran recitation in the Progress Book — surah, juz, ayat range, and memorization quality. Entries appear instantly on parent dashboards.",
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-emerald-600" />,
    title: "Messaging Parents",
    description:
      "Send direct messages to parents from the Messages section. Parents receive email notifications so nothing gets missed.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
    title: "You're all set!",
    description:
      "Your class is ready to go. Start with today's attendance and you'll be up and running in minutes.",
  },
];

const PARENT_STEPS: OnboardingStep[] = [
  {
    icon: <UserCheck className="h-6 w-6 text-teal-600" />,
    title: "Welcome, Parent",
    description:
      "This portal keeps you connected to your child's Quran journey — progress updates, attendance records, and direct messaging with their teacher.",
  },
  {
    icon: <GraduationCap className="h-6 w-6 text-teal-600" />,
    title: "Progress Updates",
    description:
      "The Progress tab shows every recitation session your child's teacher has logged — surah, quality, and notes. You'll see their memorization journey in real time.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-teal-600" />,
    title: "Attendance Records",
    description:
      "Check your child's attendance history in the Attendance tab. You'll be notified if they're marked absent.",
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-teal-600" />,
    title: "Messaging Your Teacher",
    description:
      "Send a message any time from the Messages section. Your teacher will receive an email notification and can reply directly in the portal.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-teal-600" />,
    title: "You're all set!",
    description:
      "Everything you need is in the sidebar. Start with the Dashboard to see a summary of your child's progress today.",
  },
];

const STORAGE_KEY_PREFIX = "dum_onboarded_";

export function OnboardingModal() {
  const { session } = useAuth();
  const { isAdmin, isTeacher, isParent, isLoading } = useRBAC();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isLoading || !session?.user?.id) return;
    const key = `${STORAGE_KEY_PREFIX}${session.user.id}`;
    if (!localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [isLoading, session]);

  const steps = isAdmin
    ? ADMIN_STEPS
    : isTeacher
    ? TEACHER_STEPS
    : isParent
    ? PARENT_STEPS
    : [];

  if (!steps.length) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const accentColor = isAdmin
    ? "bg-green-600"
    : isTeacher
    ? "bg-emerald-600"
    : "bg-teal-600";

  const handleClose = () => {
    if (session?.user?.id) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${session.user.id}`, "1");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className={cn("h-full transition-all duration-300", accentColor)}
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Step {step + 1} of {steps.length}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                {current.icon}
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900 leading-tight">
                {current.title}
              </DialogTitle>
            </div>
          </DialogHeader>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {current.description}
          </p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === step
                    ? cn("w-4 h-2", accentColor)
                    : i < step
                    ? cn("w-2 h-2", accentColor, "opacity-50")
                    : "w-2 h-2 bg-gray-200",
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="text-gray-500"
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400"
              >
                Skip tour
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLast ? handleClose : () => setStep((s) => s + 1)}
              className={cn("gap-1.5", isAdmin ? "bg-green-700 hover:bg-green-800" : isTeacher ? "bg-emerald-600 hover:bg-emerald-700" : "bg-teal-600 hover:bg-teal-700")}
            >
              {isLast ? "Get started" : "Next"}
              {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
