import { type ReactNode } from "react";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: ReactNode;
}

export const EmptyState = ({ message, description, icon }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
      {icon ?? <InboxIcon className="h-6 w-6" />}
    </div>
    <p className="text-sm font-semibold text-gray-700">{message}</p>
    {description && <p className="text-xs text-gray-400 max-w-xs">{description}</p>}
  </div>
);
