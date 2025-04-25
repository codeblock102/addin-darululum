
interface RoleBadgeProps {
  isAdmin: boolean;
  isLoading: boolean;
}

export const RoleBadge = ({ isAdmin, isLoading }: RoleBadgeProps) => {
  if (isLoading) return null;

  return (
    <div className={`absolute top-6 right-6 px-3 py-1 text-xs font-semibold rounded-full shadow-xl ${
      isAdmin 
        ? "bg-amber-500 text-[#121827]" 
        : "bg-emerald-500 text-white"
    }`}>
      {isAdmin ? "ADMIN" : "TEACHER"}
    </div>
  );
};
