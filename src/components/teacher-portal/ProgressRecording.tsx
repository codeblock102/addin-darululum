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
import { useI18n } from "@/contexts/I18nContext.tsx";
import { countAyahsAcrossSurahs } from "@/utils/quranValidation.ts";

interface ProgressRecordingProps {
  teacherId: string;
}

export const ProgressRecording = ({
  teacherId,
}: ProgressRecordingProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Fetch teacher details for contributor info
  const { data: teacherData } = useQuery({
    queryKey: ["profile-details", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name")

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
      required_error: t("pages.teacherPortal.progress.selectStudentError", "Please select a student"),
    }),
    current_surah: z.coerce.number().min(1).max(114),
    end_surah: z.coerce.number().min(1).max(114).optional(),
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
      end_surah: undefined,
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

      const endSurah = values.end_surah ?? values.current_surah;
      const versesMemorized = countAyahsAcrossSurahs(
        values.current_surah,
        values.start_ayat,
        endSurah,
        values.end_ayat,
      );

      // Create progress entry with contributor info
      const { data, error } = await supabase.from("progress").insert([{
        student_id: values.student_id,
        current_surah: values.current_surah,
        end_surah: endSurah,
        current_juz: values.current_juz,
        start_ayat: values.start_ayat,
        end_ayat: values.end_ayat,
        memorization_quality: values.memorization_quality,
        tajweed_level: values.tajweed_level,
        teacher_notes: values.notes,
        date: new Date().toISOString().split("T")[0],
        verses_memorized: versesMemorized,
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
        title: t("pages.teacherPortal.progress.toastSavedTitle", "Progress Recorded"),
        description: t("pages.teacherPortal.progress.toastSavedDesc", "Student progress has been successfully saved."),
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("pages.teacherPortal.progress.toastErrorTitle", "Error Saving Progress"),
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
        <CardTitle>{t("pages.teacherPortal.progress.title", "Record Student Sabaq Progress")}</CardTitle>
        <CardDescription>{t("pages.teacherPortal.progress.subtitle", "Document a student's Quran memorization progress")}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages.teacherPortal.progress.student", "Student")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={studentsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("pages.teacherPortal.progress.selectStudent", "Select a student")} />
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
                    <FormLabel>{t("pages.teacherPortal.progress.surah", "Surah Number")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={114} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_surah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages.teacherPortal.progress.endSurah", "End Surah (optional)")}</FormLabel>
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
                    <FormLabel>{t("pages.teacherPortal.progress.currentJuz", "Current Juz")}</FormLabel>
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
                    <FormLabel>{t("pages.teacherPortal.progress.startAyat", "Starting Ayat")}</FormLabel>
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
                    <FormLabel>{t("pages.teacherPortal.progress.endAyat", "Ending Ayat")}</FormLabel>
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
                    <FormLabel>{t("pages.teacherPortal.progress.quality", "Memorization Quality")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("pages.teacherPortal.progress.selectQuality", "Select quality")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">{t("pages.teacherPortal.progress.qualityOptions.excellent", "Excellent")}</SelectItem>
                        <SelectItem value="good">{t("pages.teacherPortal.progress.qualityOptions.good", "Good")}</SelectItem>
                        <SelectItem value="average">{t("pages.teacherPortal.progress.qualityOptions.average", "Average")}</SelectItem>
                        <SelectItem value="needsWork">{t("pages.teacherPortal.progress.qualityOptions.needsWork", "Needs Work")}</SelectItem>
                        <SelectItem value="horrible">{t("pages.teacherPortal.progress.qualityOptions.incomplete", "Incomplete")}</SelectItem>
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
                    <FormLabel>{t("pages.teacherPortal.progress.tajweed", "Tajweed Level")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("pages.teacherPortal.progress.tajweedPlaceholder", "e.g., Excellent, Good, Needs Practice")} {...field} />
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
                  <FormLabel>{t("pages.teacherPortal.progress.notes", "Teacher Notes")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("pages.teacherPortal.progress.notesPlaceholder", "Additional notes about the student's progress, areas for improvement, or specific achievements")} className="min-h-[120px]" {...field} />
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
                    {t("pages.teacherPortal.progress.saving", "Saving...")}
                  </>
                )
                : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("pages.teacherPortal.progress.save", "Record Progress")}
                  </>
                )}
            </Button>

            {teacherData && (
              <p className="text-xs text-center text-muted-foreground mt-2">{t("pages.teacherPortal.progress.submittedBy", "Entry will be recorded as submitted by Teacher")} {teacherData.name}</p>
            )}
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
