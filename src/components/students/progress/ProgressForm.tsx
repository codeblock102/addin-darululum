import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProgressFormData } from "./types";

interface ProgressFormProps {
  onSubmit: (data: ProgressFormData) => void;
  isProcessing: boolean;
  defaultValues?: Partial<ProgressFormData>;
}

export const ProgressForm = (
  { onSubmit, isProcessing, defaultValues }: ProgressFormProps,
) => {
  const form = useForm<ProgressFormData>({
    defaultValues: {
      current_surah: 1,
      current_juz: 1,
      start_ayat: 1,
      end_ayat: 7,
      verses_memorized: 7,
      memorization_quality: "average",
      notes: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: ProgressFormData) => {
    onSubmit(data);
  };

  // Watch values to avoid controlled/uncontrolled component warnings
  const currentSurah = form.watch("current_surah");
  const currentJuz = form.watch("current_juz");
  const startAyat = form.watch("start_ayat");
  const endAyat = form.watch("end_ayat");
  const versesMemorized = form.watch("verses_memorized");
  const memorizationQuality = form.watch("memorization_quality");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="current_surah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Surah</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value !== undefined
                      ? field.value
                      : currentSurah}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)}
                  />
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
                  <Input
                    type="number"
                    {...field}
                    value={field.value !== undefined ? field.value : currentJuz}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_ayat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Verse</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value !== undefined ? field.value : startAyat}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)}
                  />
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
                <FormLabel>End Verse</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value !== undefined ? field.value : endAyat}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="verses_memorized"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verses Memorized</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value !== undefined
                    ? field.value
                    : versesMemorized}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="memorization_quality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Memorization Quality</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value || memorizationQuality}
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
                  <SelectItem value="horrible">
                    Needs Significant Improvement
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes or observations"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing
              ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              )
              : (
                "Save Progress"
              )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
