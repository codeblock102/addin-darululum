import { cn } from "@/lib/utils.ts";

interface BackgroundPatternProps {
  isAdmin: boolean;
  children?: React.ReactNode;
}

export const BackgroundPattern = ({ children, isAdmin }: BackgroundPatternProps) => (
  <div
    className={cn("relative min-h-screen h-full")}
    style={
      isAdmin
        ? {
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f2027 60%, #1a1a2e 100%)",
          }
        : {
            background:
              "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 25%, #f5f3ff 50%, #eff6ff 75%, #f0fdf4 100%)",
          }
    }
  >
    {/* Subtle mesh overlay */}
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: isAdmin
          ? "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%)"
          : "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.05) 0%, transparent 50%)",
      }}
    />
    <div className="relative z-10 h-full">
      {children}
    </div>
  </div>
);
