
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Calendar, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  teacherId: string;
}

export const QuickActions = ({ teacherId }: QuickActionsProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Add Student",
      icon: Plus,
      action: () => navigate("/dashboard?tab=students"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Take Attendance",
      icon: Calendar,
      action: () => navigate("/attendance"),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "View Students",
      icon: Users,
      action: () => navigate("/dashboard?tab=students"),
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Messages",
      icon: MessageSquare,
      action: () => navigate("/dashboard?tab=messages"),
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary"
              onClick={action.action}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
