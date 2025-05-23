
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataCard } from "./DataCard";
import { ChevronRight } from "lucide-react";

interface Column {
  key: string;
  title: string;
  render?: (value: any, row: any) => React.ReactNode;
  isStatus?: boolean;
  statusMap?: Record<string, { label: string; variant: string }>;
  isPrimary?: boolean;
  isSecondary?: boolean;
}

interface MobileTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  keyField?: string;
  actions?: (row: any) => {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  }[];
  className?: string;
}

export const MobileTable = ({
  columns,
  data,
  onRowClick,
  keyField = "id",
  actions,
  className,
}: MobileTableProps) => {
  // Find primary column for title
  const primaryColumn = columns.find(col => col.isPrimary) || columns[0];
  // Find secondary column for subtitle
  const secondaryColumn = columns.find(col => col.isSecondary);
  // Find status column
  const statusColumn = columns.find(col => col.isStatus);

  return (
    <div className={cn("space-y-4", className)}>
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        data.map(row => {
          // Extract title from primary column
          const title = primaryColumn.render 
            ? primaryColumn.render(row[primaryColumn.key], row) 
            : row[primaryColumn.key];
            
          // Extract subtitle from secondary column if available
          const subtitle = secondaryColumn && (
            secondaryColumn.render 
              ? secondaryColumn.render(row[secondaryColumn.key], row) 
              : row[secondaryColumn.key]
          );
            
          // Extract status if available
          const status = statusColumn && statusColumn.statusMap && {
            label: statusColumn.statusMap[row[statusColumn.key]]?.label || row[statusColumn.key],
            variant: statusColumn.statusMap[row[statusColumn.key]]?.variant || 'default'
          };
            
          // Build details
          const details = columns
            .filter(col => !col.isPrimary && !col.isSecondary && !col.isStatus)
            .map(col => ({
              label: col.title,
              value: col.render ? col.render(row[col.key], row) : row[col.key]
            }));
            
          // Build actions
          const rowActions = actions ? actions(row) : [];
          if (onRowClick) {
            rowActions.push({
              label: "View",
              onClick: () => onRowClick(row),
              icon: ChevronRight,
              variant: "ghost"
            });
          }
            
          return (
            <DataCard 
              key={row[keyField]} 
              title={title} 
              subtitle={subtitle}
              status={status}
              details={details}
              actions={rowActions}
              className={onRowClick ? "cursor-pointer" : ""}
              // Add onClick to the whole card if onRowClick is provided
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            />
          );
        })
      )}
    </div>
  );
};
