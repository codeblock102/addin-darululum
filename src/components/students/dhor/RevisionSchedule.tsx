
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export interface RevisionScheduleItem {
  id: string;
  student_id: string;
  juz_number: number;
  surah_number?: number;
  scheduled_date: string;
  status: string;
  priority: string;
  created_at?: string;
  notes?: string;
}

export interface RevisionScheduleProps {
  studentId: string;
  revisionSchedule: RevisionScheduleItem[];
}

export const RevisionSchedule = ({ studentId, revisionSchedule }: RevisionScheduleProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const markCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('revision_schedule')
        .update({ status: 'completed' })
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revision marked as completed"
      });
      queryClient.invalidateQueries({ queryKey: ['student-revision-schedule', studentId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const markSkippedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('revision_schedule')
        .update({ status: 'skipped' })
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revision marked as skipped"
      });
      queryClient.invalidateQueries({ queryKey: ['student-revision-schedule', studentId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (!revisionSchedule || revisionSchedule.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revision Schedule</h3>
          <p className="text-center text-muted-foreground py-8">No revisions scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'skipped': return 'bg-orange-100 text-orange-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleComplete = (id: string) => {
    markCompleteMutation.mutate(id);
  };

  const handleSkip = (id: string) => {
    markSkippedMutation.mutate(id);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revision Schedule</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Juz</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisionSchedule.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.juz_number}</TableCell>
                  <TableCell>{formatDate(item.scheduled_date)}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleComplete(item.id)}
                          disabled={markCompleteMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                          onClick={() => handleSkip(item.id)}
                          disabled={markSkippedMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Skip
                        </Button>
                      </div>
                    )}
                    {item.status !== 'pending' && (
                      <span className="text-sm text-muted-foreground">No actions available</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
