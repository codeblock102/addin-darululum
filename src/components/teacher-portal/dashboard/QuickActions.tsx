
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ClipboardList, Info, Link } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface QuickActionsProps {
  teacherId: string;
}

export const QuickActions = ({ teacherId }: QuickActionsProps) => {
  const navigate = useNavigate();
  
  const quickActions = [
    { 
      title: "Record Dhor Book", 
      description: "Add today's Dhor Book entries",
      tooltip: "Quickly record student Dhor Book progress",
      icon: BookOpen, 
      onClick: () => navigate("/teacher-portal?tab=progress"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-100 dark:border-green-900/30",
      shortcutIcon: Link,
      animate: "hover:scale-[1.03] hover:shadow-md"
    },
    { 
      title: "Mark Attendance", 
      description: "Record student attendance",
      tooltip: "Take attendance for today's classes",
      icon: Calendar, 
      onClick: () => navigate("/teacher-portal?tab=attendance"), 
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-900/30",
      shortcutIcon: Link,
      animate: "hover:scale-[1.03] hover:shadow-md"
    },
    { 
      title: "Record Progress", 
      description: "Update student achievements",
      tooltip: "Document student learning milestones",
      icon: ClipboardList, 
      onClick: () => navigate("/teacher-portal?tab=progress"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-100 dark:border-amber-900/30",
      shortcutIcon: Link,
      animate: "hover:scale-[1.03] hover:shadow-md"
    }
  ];
  
  return (
    <Card className="border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
        <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <span className="text-xl">Quick Actions</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
              <p>Shortcuts to common tasks</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`group h-auto flex flex-col items-start py-6 px-5 border ${action.borderColor} ${action.bgColor} transition-all duration-300 text-left justify-start ${action.animate}`}
                    onClick={action.onClick}
                  >
                    <div className={`rounded-full p-3 mb-3 ${action.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-base block">{action.title}</span>
                        <action.shortcutIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-xs text-muted-foreground">{action.description}</span>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-800 text-white border-gray-700">
                  <p>{action.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
