import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";

interface ProgressRecordingProps {
  teacherId: string;
}

export const ProgressRecording = ({
  teacherId,
}: ProgressRecordingProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teacher details for contributor info
  const { data: teacherData } = useQuery({
    queryKey: ["teacher-details", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("id, name")
        .eq("id", teacherId).single();
      if (error) {
        console.error("Error fetching teacher details:", error);
        return null;
      }
      return data;
    },
  });

  // Fetch all students from shared database
  const {
    data: students,
    isLoading: studentsLoading,
  } = useQuery({
    queryKey: ["all-students-for-progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name")
        .eq("status", "active").order("name", {
          ascending: true,
        });
      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }
      return data;
    },
  });

  // Progress entry form schema
  const formSchema = z.object({
    student_id: z.string({
      required_error: "Please select a student",
    }),
    current_surah: z.coerce.number().min(1).max(114),
    current_juz: z.coerce.number().min(1).max(30),
    start_ayat: z.coerce.number().min(1),
    end_ayat: z.coerce.number().min(1),
    memorization_quality: z.enum([
      "excellent",
      "good",
      "average",
      "needsWork",
      "horrible",
    ]),
    tajweed_level: z.string().min(1, "Tajweed level is required"),
    notes: z.string().optional(),
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: "",
      current_surah: 1,
      current_juz: 1,
      start_ayat: 1,
      end_ayat: 1,
      memorization_quality: "average",
      tajweed_level: "",
      notes: "",
    },
  });

  // Handle form submission
  const progressMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Create contributor info
      const contributorInfo = teacherData
        ? {
          contributor_id: teacherData.id,
          contributor_name: `Teacher ${teacherData.name}`,
        }
        : {
          contributor_id: teacherId,
          contributor_name: "Teacher",
        };

      // Create progress entry with contributor info
      const { data, error } = await supabase.from("progress").insert([{
        student_id: values.student_id,
        current_surah: values.current_surah,
        current_juz: values.current_juz,
        start_ayat: values.start_ayat,
        end_ayat: values.end_ayat,
        memorization_quality: values.memorization_quality,
        tajweed_level: values.tajweed_level,
        teacher_notes: values.notes,
        date: new Date().toISOString().split("T")[0],
        verses_memorized: values.end_ayat - values.start_ayat + 1,
        ...contributorInfo, // Add contributor information
      }]);

      if (error) {
        throw new Error(`Failed to save progress: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teacher-summary", teacherId],
      });
      toast({
        title: "Progress Recorded",
        description: "Student progress has been successfully saved.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    progressMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Student Sabaq Progress</CardTitle>
        <CardDescription>
          Document a student's Quran memorization progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={studentsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="current_surah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surah Number</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={114} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_juz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Juz</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={30} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Ayat</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ending Ayat</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="memorization_quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memorization Quality</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="needsWork">Needs Work</SelectItem>
                        <SelectItem value="horrible">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tajweed_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tajweed Level</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Excellent, Good, Needs Practice"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the student's progress, areas for improvement, or specific achievements"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={progressMutation.isPending}
            >
              {progressMutation.isPending
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                )
                : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Record Progress
                  </>
                )}
            </Button>

            {teacherData && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Entry will be recorded as submitted by Teacher{" "}
                {teacherData.name}
              </p>
            )}
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
