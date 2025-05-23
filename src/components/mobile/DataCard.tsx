
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DataCardAction {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
}

interface DataCardProps {
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
  };
  details?: { label: string; value: string | React.ReactNode }[];
  actions?: DataCardAction[];
  className?: string;
}

export const DataCard = ({
  title,
  subtitle,
  status,
  details = [],
  actions = [],
  className,
}: DataCardProps) => {
  // Map status variant to appropriate Tailwind classes
  const getStatusClasses = (variant: "default" | "success" | "warning" | "danger" | "info") => {
    const baseClasses = "text-xs font-medium px-2 py-0.5 rounded-full";
    
    switch (variant) {
      case "success":
        return cn(baseClasses, "bg-green-100 text-green-800");
      case "warning":
        return cn(baseClasses, "bg-yellow-100 text-yellow-800");
      case "danger":
        return cn(baseClasses, "bg-red-100 text-red-800");
      case "info":
        return cn(baseClasses, "bg-blue-100 text-blue-800");
      default:
        return cn(baseClasses, "bg-gray-100 text-gray-800");
    }
  };

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden shadow-sm mb-3",
      className
    )}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-sm sm:text-base">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {status && (
            <Badge className={getStatusClasses(status.variant)}>{status.label}</Badge>
          )}
        </div>
        
        {details.length > 0 && (
          <div className="mt-3 space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-xs text-muted-foreground">{detail.label}</span>
                <span className="text-xs font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || "outline"}
                onClick={action.onClick}
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
};
