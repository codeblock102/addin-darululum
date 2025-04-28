
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Calendar, ClipboardList } from "lucide-react";

interface QuickActionsProps {
  teacherId: string;
}

export const QuickActions = ({ teacherId }: QuickActionsProps) => {
  const navigate = useNavigate();
  
  const quickActions = [
    { 
      title: "Record Dhor Book", 
      icon: Book, 
      onClick: () => navigate("/teacher-portal?tab=progress"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    { 
      title: "Mark Attendance", 
      icon: Calendar, 
      onClick: () => navigate("/teacher-portal?tab=attendance"), 
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    { 
      title: "Record Progress", 
      icon: ClipboardList, 
      onClick: () => navigate("/teacher-portal?tab=progress"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <Button 
              key={index} 
              variant="outline" 
              className={`h-auto flex-col py-6 gap-3 ${action.bgColor} hover:shadow-md transition-all`}
              onClick={action.onClick}
            >
              <div className={`rounded-full p-3 ${action.bgColor}`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <span className="font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
