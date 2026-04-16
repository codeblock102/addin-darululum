import { Users } from "lucide-react";
import { ParentChildStudent } from "@/hooks/useParentChildren.ts";

interface ChildSelectorProps {
  children: ParentChildStudent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export const ChildSelector = ({ children, selectedId, onSelect, isLoading }: ChildSelectorProps) => {
  if (isLoading) return <span className="text-sm text-muted-foreground">Loading...</span>;
  if (!children.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">No children linked to your account</p>
      <p className="text-xs text-gray-400">Please contact the school admin to link your children.</p>
    </div>
  );

  return (
    <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
      {children.map((child) => (
        <button
          key={child.id}
          type="button"
          onClick={() => onSelect(child.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0 ${
            selectedId === child.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  );
};
