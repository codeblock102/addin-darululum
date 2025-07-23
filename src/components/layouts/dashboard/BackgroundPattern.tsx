import { cn } from "@/lib/utils.ts";

interface BackgroundPatternProps {
  isAdmin: boolean;
  children?: React.ReactNode;
}

export const BackgroundPattern = ({ children, isAdmin }: BackgroundPatternProps) => (
  <div className={cn("relative min-h-screen h-full", { "bg-gray-50": !isAdmin })}>
    <div
      className={cn(
        "absolute inset-0 z-0 opacity-50",
        isAdmin
          ? "bg-[url('/path-to-admin-pattern.svg')]"
          : "bg-[url('/path-to-teacher-pattern.svg')]",
      )}
      style={{ backgroundSize: "cover" }}
    />
    <div className="relative z-10 h-full">
      {children}
    </div>
  </div>
);
