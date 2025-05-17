import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save, Edit, Trash } from "lucide-react";
import { ParentComment, StudentDhorSummary, RevisionSchedule, JuzMastery } from "@/types/dhor-book";
import { DhorBookGrid } from "./DhorBookGrid";
import { getStartOfWeekISO, getEndOfWeekISO, addWeeks, subWeeks } from "@/utils/dateUtils";
import { format } from "date-fns";
import { DailyActivityEntry } from "@/types/dhor-book";

interface DhorBookProps {
  studentId: string;
  teacherId: string;
}

export const DhorBook = ({ studentId, teacherId }: DhorBookProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingComment, setIsEditingComment] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState("");
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get date range for current week
  const startDateISO = getStartOfWeekISO(currentWeek);
  const endDateISO = getEndOfWeekISO(currentWeek);

  // Format for display
  const weekRangeDisplay = `${format(new Date(startDateISO), 'MMM d')} - ${format(new Date(endDateISO), 'MMM d, yyyy')}`;

  // Go to next week
  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  // Go to previous week
  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  // Go to current week
  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Fetch student data to verify the student exists
  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) {
        console.error("Error fetching student:", error);
        return null;
      }
      return data;
    },
    enabled: !!studentId,
  });

  // Fetch student's dhor book entries
  const { data: dhorBookEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['dhor-book-entries', studentId, startDateISO, endDateISO],
    queryFn: async () => {
      if (!studentId) return [];

      // Fetch progress records (for sabaq)
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', startDateISO)
        .lte('date', endDateISO)
        .order('date', { ascending: true });

      if (progressError) {
        console.error("Error fetching progress data:", progressError);
        throw progressError;
      }

      // Fetch sabaq para records
      const { data: sabaqParaData, error: sabaqParaError } = await supabase
        .from('sabaq_para')
        .select('*')
        .eq('student_id', studentId)
        .gte('revision_date', startDateISO)
        .lte('revision_date', endDateISO)
        .order('revision_date', { ascending: true });

      if (sabaqParaError) {
        console.error("Error fetching sabaq para data:", sabaqParaError);
        throw sabaqParaError;
      }

      // Fetch juz revisions data (for dhor)
      const { data: juzRevisionsData, error: juzRevisionsError } = await supabase
        .from('juz_revisions')
        .select('*')
        .eq('student_id', studentId)
        .gte('revision_date', startDateISO)
        .lte('revision_date', endDateISO)
        .order('revision_date', { ascending: true })
        .order('dhor_slot', { ascending: true });

      if (juzRevisionsError) {
        console.error("Error fetching juz revisions data:", juzRevisionsError);
        throw juzRevisionsError;
      }

      // Create a map of entries by date for easier merging
      const entriesByDate: Record<string, DailyActivityEntry> = {};

      // Add progress records (sabaq)
      progressData?.forEach(progress => {
        if (!progress.date) return;
        
        const dateStr = progress.date;
        if (!entriesByDate[dateStr]) {
          entriesByDate[dateStr] = {
            id: progress.id,
            student_id: progress.student_id || '',
            teacher_id: teacherId,
            entry_date: dateStr,
            current_juz: progress.current_juz,
            current_surah: progress.current_surah,
            start_ayat: progress.start_ayat,
            end_ayat: progress.end_ayat,
            memorization_quality: progress.memorization_quality,
            comments: progress.teacher_notes,
            juz_revisions_data: []
          };
        } else {
          // Update existing entry with progress data
          entriesByDate[dateStr].current_juz = progress.current_juz;
          entriesByDate[dateStr].current_surah = progress.current_surah;
          entriesByDate[dateStr].start_ayat = progress.start_ayat;
          entriesByDate[dateStr].end_ayat = progress.end_ayat;
          entriesByDate[dateStr].memorization_quality = progress.memorization_quality;
          entriesByDate[dateStr].comments = progress.teacher_notes;
        }
      });

      // Add sabaq para records
      sabaqParaData?.forEach(sabaqPara => {
        if (!sabaqPara.revision_date) return;
        
        const dateStr = sabaqPara.revision_date;
        if (!entriesByDate[dateStr]) {
          entriesByDate[dateStr] = {
            id: sabaqPara.id,
            student_id: sabaqPara.student_id || '',
            teacher_id: teacherId,
            entry_date: dateStr,
            sabaq_para_data: {
              juz_number: sabaqPara.juz_number,
              quarters_revised: sabaqPara.quarters_revised,
              quality_rating: sabaqPara.quality_rating
            },
            juz_revisions_data: []
          };
        } else {
          // Update existing entry with sabaq para data
          entriesByDate[dateStr].sabaq_para_data = {
            juz_number: sabaqPara.juz_number,
            quarters_revised: sabaqPara.quarters_revised,
            quality_rating: sabaqPara.quality_rating
          };
        }
      });

      // Add juz revisions data (dhor)
      juzRevisionsData?.forEach(juzRevision => {
        if (!juzRevision.revision_date) return;
        
        const dateStr = juzRevision.revision_date;
        if (!entriesByDate[dateStr]) {
          entriesByDate[dateStr] = {
            id: juzRevision.id,
            student_id: juzRevision.student_id || '',
            teacher_id: teacherId,
            entry_date: dateStr,
            juz_revisions_data: [{
              id: juzRevision.id,
              dhor_slot: juzRevision.dhor_slot || 1,
              juz_number: juzRevision.juz_number,
              juz_revised: juzRevision.juz_revised,
              quarter_start: juzRevision.quarter_start,
              quarters_covered: juzRevision.quarters_covered,
              memorization_quality: juzRevision.memorization_quality
            }]
          };
        } else {
          // Add to the juz_revisions_data array for this date
          if (!entriesByDate[dateStr].juz_revisions_data) {
            entriesByDate[dateStr].juz_revisions_data = [];
          }
          
          entriesByDate[dateStr].juz_revisions_data.push({
            id: juzRevision.id,
            dhor_slot: juzRevision.dhor_slot || 1,
            juz_number: juzRevision.juz_number,
            juz_revised: juzRevision.juz_revised,
            quarter_start: juzRevision.quarter_start,
            quarters_covered: juzRevision.quarters_covered,
            memorization_quality: juzRevision.memorization_quality
          });
        }
      });

      // Convert the map to an array
      return Object.values(entriesByDate);
    },
    enabled: !!studentId,
    staleTime: 30000, // 30 seconds
  });

  // Fetch student's parent comments
  const { data: parentComments, isLoading: commentsLoading } = useQuery({
    queryKey: ['parent-comments', studentId, startDateISO, endDateISO],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('parent_comments')
        .select('*')
        .eq('student_id', studentId)
        .gte('entry_date', startDateISO)
        .lte('entry_date', endDateISO)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Fetch student's revision schedules
  const { data: revisionSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['revision-schedule', studentId, startDateISO, endDateISO],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('student_id', studentId)
        .gte('scheduled_date', startDateISO)
        .lte('scheduled_date', endDateISO)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Form schema for Parent Comments
  const commentFormSchema = z.object({
    comment: z.string().min(1, "Comment is required"),
    entry_date: z.string(),
  });

  // Form setup for Parent Comments
  const commentForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      comment: "",
      entry_date: new Date().toISOString().split('T')[0],
    },
  });

  // Mutation for creating a new Parent Comment
  const createCommentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof commentFormSchema>) => {
      const { data, error } = await supabase
        .from('parent_comments')
        .insert([{
          student_id: studentId,
          comment: values.comment,
          entry_date: values.entry_date,
        }]);

      if (error) {
        throw new Error(`Failed to create comment: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-comments', studentId] });
      toast({
        title: "Comment Created",
        description: "New parent comment has been successfully saved.",
      });
      commentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a Parent Comment
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string, comment: string }) => {
      const { data, error } = await supabase
        .from('parent_comments')
        .update({ comment: comment })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update comment: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-comments', studentId] });
      toast({
        title: "Comment Updated",
        description: "Parent comment has been successfully updated.",
      });
      setIsEditingComment(null);
      setEditedComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a Parent Comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('parent_comments')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete comment: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-comments', studentId] });
      toast({
        title: "Comment Deleted",
        description: "Parent comment has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle form submission for Parent Comments
  const onCommentSubmit = (values: z.infer<typeof commentFormSchema>) => {
    createCommentMutation.mutate(values);
  };

  // Function to handle updating a comment
  const handleUpdateComment = (id: string, comment: string) => {
    updateCommentMutation.mutate({ id: id, comment: comment });
  };

  // Function to handle deleting a comment
  const handleDeleteComment = (id: string) => {
    deleteCommentMutation.mutate(id);
  };

  // Handle refreshing the data, particularly after adding a new entry
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dhor-book-entries', studentId, startDateISO, endDateISO] });
    queryClient.invalidateQueries({ queryKey: ['parent-comments', studentId, startDateISO, endDateISO] });
    queryClient.invalidateQueries({ queryKey: ['revision-schedule', studentId, startDateISO, endDateISO] });
  };

  const { data: studentSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dhor-summary', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Calculate summary from existing entries
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(20);
      
      if (progressError) throw progressError;
      
      // If no entries exist yet, return a default summary
      if (!progressData || progressData.length === 0) {
        return {
          id: 'new-summary',
          student_id: studentId,
          days_absent: 0,
          total_points: 0,
          last_updated_by: null,
          last_entry_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Get the last entry
      const lastEntry = progressData[0]; 
      
      // Return a summary based on available data
      return {
        id: `summary-${studentId}`,
        student_id: studentId,
        days_absent: 0, // Would need to calculate from attendance records
        total_points: 0, // Would need to get from a different source
        last_updated_by: null,
        last_entry_date: lastEntry.date,
        created_at: lastEntry.created_at,
        updated_at: lastEntry.created_at
      };
    },
    enabled: !!studentId
  });

  return (
    <div className="space-y-4">
      {isStudentLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading student data...</span>
        </div>
      ) : !studentData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-3">
            <Loader2 className="h-6 w-6 text-yellow-500" />
          </div>
          <h3 className="text-lg font-medium">Student Not Found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The selected student could not be found. Please check that the student ID is correct and try again.
          </p>
        </div>
      ) : (
        <>
          {/* Week Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
              Previous Week
            </Button>
            <div className="text-center">
              <h3 className="text-sm font-medium">{weekRangeDisplay}</h3>
              <Button variant="link" size="sm" onClick={handleCurrentWeek} className="text-xs">
                Go to Current Week
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Next Week
            </Button>
          </div>
          
          {/* Dhor Book Grid for displaying entries */}
          <DhorBookGrid 
            entries={dhorBookEntries || []}
            studentId={studentId}
            teacherId={teacherId}
            currentWeek={currentWeek}
            onRefresh={queryClient.invalidateQueries}
          />

          {/* Parent Comments Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Parent Comments</CardTitle>
              <CardDescription>Recent comments from parents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Form {...commentForm}>
                  <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4">
                    <FormField
                      control={commentForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Comment</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add a new comment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={commentForm.control}
                      name="entry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={createCommentMutation.isPending}
                      className="w-full"
                    >
                      {createCommentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Comment
                    </Button>
                  </form>
                </Form>

                <div className="divide-y">
                  {commentsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : parentComments && parentComments.length > 0 ? (
                    parentComments.map((comment) => (
                      <div key={comment.id} className="py-3">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium">
                            {new Date(comment.entry_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setIsEditingComment(comment.id);
                                setEditedComment(comment.comment);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {isEditingComment === comment.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea 
                              value={editedComment} 
                              onChange={(e) => setEditedComment(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setIsEditingComment(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateComment(comment.id, editedComment)}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm">{comment.comment}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No comments yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revision Schedule Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Scheduled Revisions</CardTitle>
              <CardDescription>Upcoming revisions for this student</CardDescription>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : revisionSchedules && revisionSchedules.length > 0 ? (
                <div className="space-y-3">
                  {revisionSchedules.map((schedule) => (
                    <Card key={schedule.id} className="p-3 bg-muted/40">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium">Juz {schedule.juz_number} {schedule.surah_number && `(Surah ${schedule.surah_number})`}</p>
                          <p className="text-xs text-muted-foreground">
                            Scheduled: {new Date(schedule.scheduled_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`
                            inline-flex items-center rounded-full px-2 py-1 text-xs
                            ${schedule.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                              schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}
                          `}>
                            {schedule.priority} priority
                          </span>
                          <p className="text-xs mt-1">
                            Status: <span className="font-medium">{schedule.status}</span>
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No scheduled revisions for this week.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
