
interface RoleBadgeProps {
  isAdmin: boolean;
  isLoading: boolean;
}

export const RoleBadge = ({ isAdmin, isLoading }: RoleBadgeProps) => {
  if (isLoading) return null;

  return (
    <div className={`absolute top-2 right-4 px-3 py-1 text-xs font-medium rounded-full backdrop-blur-xl ${
      isAdmin 
        ? "bg-amber-500/90 text-black shadow-lg" 
        : "bg-emerald-500/90 text-white"
    }`}>
      {isAdmin ? "ADMIN" : "TEACHER"}
    </div>
  );
};

