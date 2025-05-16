
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

interface DhorBookProps {
  studentId: string;
  teacherId: string;
}

export const DhorBook = ({ studentId, teacherId }: DhorBookProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingComment, setIsEditingComment] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState("");

  // Fetch student's dhor book entries
  const { data: dhorBookEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['dhor-book-entries', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('dhor_book_entries')
        .select('*')
        .eq('student_id', studentId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Fetch student's parent comments
  const { data: parentComments, isLoading: commentsLoading } = useQuery({
    queryKey: ['parent-comments', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('parent_comments')
        .select('*')
        .eq('student_id', studentId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Fetch student's revision schedules - using revision_schedule table (not revision_schedules)
  const { data: revisionSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['revision-schedule', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('student_id', studentId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Form schema for Dhor Book entries
  const formSchema = z.object({
    points: z.number().min(0).max(100),
    dhor_1_mistakes: z.number().min(0).max(50),
    entry_date: z.string(),
    comments: z.string().optional(),
    day_of_week: z.string().default(new Date().toLocaleString('en-US', { weekday: 'long' })),
  });

  // Form setup for Dhor Book entries
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      points: 0,
      dhor_1_mistakes: 0,
      entry_date: new Date().toISOString().split('T')[0],
      comments: "",
      day_of_week: new Date().toLocaleString('en-US', { weekday: 'long' }),
    },
  });

  // Mutation for creating a new Dhor Book entry
  const createEntryMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Create a proper entry object that matches the table schema
      const entryData = {
        student_id: studentId,
        teacher_id: teacherId,
        points: values.points,
        dhor_1_mistakes: values.dhor_1_mistakes,
        entry_date: values.entry_date,
        comments: values.comments,
        day_of_week: values.day_of_week,
        detention: false
      };

      const { data, error } = await supabase
        .from('dhor_book_entries')
        .insert([entryData]);

      if (error) {
        throw new Error(`Failed to create entry: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dhor-book-entries', studentId] });
      toast({
        title: "Entry Created",
        description: "New Dhor Book entry has been successfully saved.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Entry",
        description: error.message,
        variant: "destructive",
      });
    },
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

  // Function to handle form submission for Dhor Book entries
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createEntryMutation.mutate(values);
  };

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

  const { data: studentSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dhor-summary', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Instead of querying student_dhor_summaries, we'll calculate summary from dhor_book_entries
      const { data, error } = await supabase
        .from('dhor_book_entries')
        .select('*')
        .eq('student_id', studentId)
        .order('entry_date', { ascending: false });
      
      if (error) throw error;
      
      // If no entries exist yet, return a default summary
      if (!data || data.length === 0) {
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
      
      // Calculate summary from entries
      const totalPoints = data.reduce((sum, entry) => sum + (entry.points || 0), 0);
      const lastEntry = data[0]; // Most recent entry (due to descending order)
      
      return {
        id: `summary-${studentId}`,
        student_id: studentId,
        days_absent: 0, // Would need to calculate from attendance records
        total_points: totalPoints,
        last_updated_by: null,
        last_entry_date: lastEntry.entry_date,
        created_at: data[data.length-1].created_at,
        updated_at: lastEntry.created_at
      };
    },
    enabled: !!studentId
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Dhor Book Entries */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Dhor Book Entries</CardTitle>
            <CardDescription>Record and track student progress</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter points" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dhor_1_mistakes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mistakes</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter mistakes" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createEntryMutation.isPending}>
                  {createEntryMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Entry
                    </>
                  )}
                </Button>
              </form>
            </FormProvider>

            {/* Display Dhor Book Entries */}
            <div className="mt-6">
              <h4 className="text-sm font-medium">Recent Entries</h4>
              {entriesLoading ? (
                <p>Loading entries...</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dhorBookEntries?.map(entry => (
                    <li key={entry.id} className="border rounded-md p-3">
                      <p>Points: {entry.points}, Mistakes: {entry.dhor_1_mistakes}</p>
                      <p>Date: {new Date(entry.entry_date).toLocaleDateString()}</p>
                      {entry.comments && <p>Notes: {entry.comments}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Parent Comments and Revision Schedules */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Parent Comments</CardTitle>
            <CardDescription>Communicate with parents about student progress</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...commentForm}>
              <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4">
                <FormField
                  control={commentForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter comment" {...field} />
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
                      <FormLabel>Entry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createCommentMutation.isPending}>
                  {createCommentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Comment
                    </>
                  )}
                </Button>
              </form>
            </FormProvider>

            {/* Display Parent Comments */}
            <div className="mt-6">
              <h4 className="text-sm font-medium">Recent Comments</h4>
              {commentsLoading ? (
                <p>Loading comments...</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {parentComments?.map(comment => (
                    <li key={comment.id} className="border rounded-md p-3">
                      {isEditingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedComment}
                            onChange={(e) => setEditedComment(e.target.value)}
                            placeholder="Edit comment"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditingComment(null);
                                setEditedComment("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(comment.id, editedComment)}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>{comment.comment}</p>
                          <p className="text-xs text-muted-foreground">
                            Date: {new Date(comment.entry_date).toLocaleDateString()}
                          </p>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setIsEditingComment(comment.id);
                                setEditedComment(comment.comment);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Revision Schedules</CardTitle>
            <CardDescription>Plan and track student revisions</CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <p>Loading schedules...</p>
            ) : revisionSchedules && revisionSchedules.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {revisionSchedules.map(schedule => (
                  <li key={schedule.id} className="border rounded-md p-3">
                    <p>Juz: {schedule.juz_number}, Date: {new Date(schedule.scheduled_date).toLocaleDateString()}</p>
                    <p>Priority: {schedule.priority}, Status: {schedule.status}</p>
                    {schedule.notes && <p>Notes: {schedule.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-4">No revision schedules found for this student.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Export a simple interface for use by other components that depend on DhorBook
export interface DailyActivityEntry {
  id: string;
  entry_date: string;
  current_juz?: number;
  current_surah?: number;
  start_ayat?: number;
  end_ayat?: number;
  memorization_quality?: string;
  comments?: string;
  sabaq_para_data?: {
    juz_number: number;
    quarters_revised?: string;
    quality_rating?: string;
  };
  juz_revisions_data?: {
    dhor_slot?: number;
    juz_number?: number;
    juz_revised?: number;
    quarter_start?: number;
    quarters_covered?: number;
    memorization_quality?: string;
  }[];
}
