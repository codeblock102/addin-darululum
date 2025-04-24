
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RevisionScheduleItem } from "@/types/progress";

interface RevisionScheduleProps {
  schedule: RevisionScheduleItem[];
  studentId: string;
}

export const RevisionSchedule = ({ schedule, studentId }: RevisionScheduleProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const markAsCompleted = useMutation({
    mutationFn: async (itemId: string) => {
      try {
        const { error } = await supabase
          .rpc('mark_revision_completed', { item_id_param: itemId });
        
        if (error) throw error;
        return itemId;
      } catch (error) {
        console.error("Error updating revision status:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-revision-schedule', studentId]
      });
      toast({
        title: "Success",
        description: "Revision marked as completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update revision status",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  const handleMarkCompleted = (itemId: string) => {
    markAsCompleted.mutate(itemId);
  };
  
  const activeScheduleItems = schedule.filter(item => item.status !== 'completed');
  
  // Check for overdue items
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Update overdue status for display
  const displaySchedule = activeScheduleItems.map(item => {
    const scheduledDate = new Date(item.scheduled_date);
    scheduledDate.setHours(0, 0, 0, 0);
    
    const isOverdue = scheduledDate < today && item.status !== 'completed';
    
    return {
      ...item,
      isOverdue
    };
  });
  
  if (displaySchedule.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No scheduled revisions for this student.</p>
      </Card>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Content</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displaySchedule.map((item) => (
          <TableRow key={item.id} className={item.isOverdue ? 'bg-red-50' : undefined}>
            <TableCell>
              {new Date(item.scheduled_date).toLocaleDateString()}
              {item.isOverdue && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="font-medium">
                Juz {item.juz_number}
                {item.surah_number && `, Surah ${item.surah_number}`}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={
                item.priority === 'high' ? 'destructive' :
                item.priority === 'medium' ? 'secondary' :
                'outline'
              }>
                {item.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={
                item.status === 'completed' ? 'default' :
                item.status === 'overdue' ? 'destructive' :
                'outline'
              }>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsCompleted.mutate(item.id)}
                disabled={item.status === 'completed'}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark Completed
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
