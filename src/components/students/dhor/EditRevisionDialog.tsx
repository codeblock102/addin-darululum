
// Import necessary components and hooks
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type QualityRating = "excellent" | "good" | "average" | "needsWork" | "horrible";

// Map component values to database values
const qualityToDatabaseValue: Record<QualityRating, string> = {
  "excellent": "excellent",
  "good": "good",
  "average": "average",
  "needsWork": "needs_work", // This is the correct DB value
  "horrible": "horrible"
};

// Map database values to component values
const databaseToQualityValue = (dbValue: string): QualityRating => {
  if (dbValue === "needs_work") return "needsWork";
  return dbValue as QualityRating;
};

interface FormValues {
  revision_date: string;
  juz_number: number;
  quarter_start: number;
  quarters_covered: number;
  dhor_slot: number;
  memorization_quality: QualityRating;
  teacher_notes: string;
}

interface Revision {
  id: string;
  revision_date: string;
  juz_number: number;
  quarter_start: number;
  quarters_covered: number;
  dhor_slot: number;
  memorization_quality: string;
  teacher_notes: string;
}

interface EditRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision: Revision | null;
}

export function EditRevisionDialog({ open, onOpenChange, revision }: EditRevisionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const { handleSubmit, control, reset } = useForm<FormValues>({
    defaultValues: {
      revision_date: '',
      juz_number: 1,
      quarter_start: 1,
      quarters_covered: 1,
      dhor_slot: 1,
      memorization_quality: 'average',
      teacher_notes: ''
    }
  });
  
  // Set form values when revision is provided
  useEffect(() => {
    if (revision) {
      reset({
        revision_date: revision.revision_date ? new Date(revision.revision_date).toISOString().split('T')[0] : '',
        juz_number: revision.juz_number,
        quarter_start: revision.quarter_start,
        quarters_covered: revision.quarters_covered,
        dhor_slot: revision.dhor_slot,
        memorization_quality: databaseToQualityValue(revision.memorization_quality),
        teacher_notes: revision.teacher_notes || ''
      });
    }
  }, [revision, reset]);

  const updateRevision = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!revision) return null;

      const { error } = await supabase
        .from('juz_revisions')
        .update({
          revision_date: data.revision_date,
          juz_number: data.juz_number,
          quarter_start: data.quarter_start,
          quarters_covered: data.quarters_covered,
          dhor_slot: data.dhor_slot,
          memorization_quality: qualityToDatabaseValue[data.memorization_quality],
          teacher_notes: data.teacher_notes
        })
        .eq('id', revision.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Revision updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['student-revisions'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: `Failed to update revision: ${error.message}`, 
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: FormValues) => {
    setIsLoading(true);
    updateRevision.mutate(data, {
      onSettled: () => {
        setIsLoading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Revision</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revision_date">Revision Date</Label>
              <Controller
                name="revision_date"
                control={control}
                render={({ field }) => (
                  <Input
                    id="revision_date"
                    type="date"
                    {...field}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="juz_number">Juz Number</Label>
              <Controller
                name="juz_number"
                control={control}
                render={({ field }) => (
                  <Input
                    id="juz_number"
                    type="number"
                    min={1}
                    max={30}
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quarter_start">Quarter Start</Label>
              <Controller
                name="quarter_start"
                control={control}
                render={({ field }) => (
                  <Input
                    id="quarter_start"
                    type="number"
                    min={1}
                    max={4}
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quarters_covered">Quarters Covered</Label>
              <Controller
                name="quarters_covered"
                control={control}
                render={({ field }) => (
                  <Input
                    id="quarters_covered"
                    type="number"
                    min={1}
                    max={4}
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dhor_slot">Dhor Slot</Label>
              <Controller
                name="dhor_slot"
                control={control}
                render={({ field }) => (
                  <Input
                    id="dhor_slot"
                    type="number"
                    min={1}
                    max={2}
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memorization_quality">Quality</Label>
              <Controller
                name="memorization_quality"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="needsWork">Needs Work</SelectItem>
                      <SelectItem value="horrible">Horrible</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher_notes">Teacher Notes</Label>
            <Controller
              name="teacher_notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="teacher_notes"
                  placeholder="Any additional notes..."
                  {...field}
                />
              )}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Revision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
