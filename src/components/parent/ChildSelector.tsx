import { ParentChildStudent } from "@/hooks/useParentChildren.ts";

interface ChildSelectorProps {
  children: ParentChildStudent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export const ChildSelector = ({ children, selectedId, onSelect, isLoading }: ChildSelectorProps) => {
  if (isLoading) return <span className="text-sm text-muted-foreground">Loading children...</span>;
  if (!children.length) return <span className="text-sm text-muted-foreground">No linked children found.</span>;

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
