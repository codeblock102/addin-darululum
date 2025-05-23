
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileTableProps {
  data: any[];
  columns: {
    title: string;
    key: string;
    render?: (value: any, record: any) => React.ReactNode;
    primary?: boolean;
    status?: boolean;
  }[];
  onRowClick?: (record: any) => void;
  actions?: {
    icon: React.ElementType;
    label: string;
    onClick: (record: any) => void;
    variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  }[];
}

export const MobileTable = ({ data, columns, onRowClick, actions = [] }: MobileTableProps) => {
  // Find primary column to use as card title
  const primaryColumn = columns.find((col) => col.primary) || columns[0];
  
  // Find status column if any
  const statusColumn = columns.find((col) => col.status);
  
  // Get non-primary and non-status columns for the details
  const detailColumns = columns.filter(
    (col) => col.key !== primaryColumn.key && (!statusColumn || col.key !== statusColumn.key)
  );

  // Convert status to badge variant that's compatible with our Badge component
  const getStatusVariant = (value: any): "default" | "secondary" | "destructive" | "outline" | "success" => {
    if (typeof value === "string") {
      switch (value.toLowerCase()) {
        case "active":
        case "completed":
        case "approved":
        case "present":
          return "success";
        case "pending":
        case "in progress":
        case "partial":
          return "secondary";
        case "inactive":
        case "rejected":
        case "failed":
        case "absent":
          return "destructive";
        default:
          return "default";
      }
    }
    return "default";
  };

  const renderValue = (column: any, record: any) => {
    const value = record[column.key];
    if (column.render) {
      return column.render(value, record);
    }
    return value;
  };

  if (data.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg dark:bg-gray-800/30">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((record, index) => {
        // Get status info if applicable
        const status = statusColumn ? {
          label: renderValue(statusColumn, record),
          variant: getStatusVariant(record[statusColumn.key])
        } : undefined;

        return (
          <div
            key={index}
            className={cn(
              "border rounded-lg overflow-hidden shadow-sm bg-card text-card-foreground",
              onRowClick ? "cursor-pointer active:bg-muted/50" : ""
            )}
            onClick={onRowClick ? () => onRowClick(record) : undefined}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm sm:text-base">
                    {renderValue(primaryColumn, record)}
                  </h3>
                </div>
                
                {status && (
                  <Badge
                    variant={status.variant}
                    className={cn("text-xs")}
                  >
                    {status.label}
                  </Badge>
                )}
              </div>
              
              {detailColumns.length > 0 && (
                <div className="mt-3 space-y-2">
                  {detailColumns.map((column) => (
                    <div key={column.key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{column.title}</span>
                      <span className="font-medium text-xs">{renderValue(column, record)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      size="sm"
                      variant={action.variant || "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(record);
                      }}
                      className="text-xs"
                    >
                      {action.icon && (
                        <action.icon className="h-3.5 w-3.5 mr-1" />
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
