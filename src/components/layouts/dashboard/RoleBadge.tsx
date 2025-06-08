import { StatusBadge } from "@/components/ui/status-badge.tsx";

interface RoleBadgeProps {
  isAdmin: boolean;
  isLoading: boolean;
}

export const RoleBadge = ({ isAdmin, isLoading }: RoleBadgeProps) => {
  if (isLoading) return null;

  return (
    <div className="absolute top-6 right-6">
      <StatusBadge 
        status={isAdmin ? "info" : "success"} 
        customLabel={isAdmin ? "ADMIN" : "TEACHER"} 
        className={isAdmin 
          ? "bg-amber-500 text-[#121827] border-amber-400" 
          : "bg-emerald-500 text-white border-emerald-400"
        }
      />
    </div>
  );
};
