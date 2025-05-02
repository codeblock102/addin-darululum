
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ClipboardList } from "lucide-react";

interface QuickActionsProps {
  teacherId: string;
}

export const QuickActions = ({ teacherId }: QuickActionsProps) => {
  const navigate = useNavigate();
  
  const quickActions = [
    { 
      title: "Record Dhor Book", 
      description: "Add today's Dhor Book entries",
      icon: BookOpen, 
      onClick: () => navigate("/teacher-portal?tab=progress"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-100 dark:border-green-900/30"
    },
    { 
      title: "Mark Attendance", 
      description: "Record student attendance",
      icon: Calendar, 
      onClick: () => navigate("/teacher-portal?tab=attendance"), 
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-900/30"
    },
    { 
      title: "Record Progress", 
      description: "Update student achievements",
      icon: ClipboardList, 
      onClick: () => navigate("/teacher-portal?tab=progress"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-100 dark:border-amber-900/30"
    }
  ];
  
  return (
    <Card className="border border-purple-100 dark:border-purple-900/30 shadow-sm">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
        <CardTitle className="text-purple-700 dark:text-purple-300">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button 
              key={index} 
              variant="outline" 
              className={`h-auto flex flex-col items-start py-6 px-5 border ${action.borderColor} ${action.bgColor} hover:opacity-90 hover:scale-[1.02] transition-all text-left justify-start`}
              onClick={action.onClick}
            >
              <div className={`rounded-full p-3 mb-3 ${action.bgColor}`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <div>
                <span className="font-medium text-base block mb-1">{action.title}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
