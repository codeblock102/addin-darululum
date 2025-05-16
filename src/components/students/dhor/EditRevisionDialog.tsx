import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionData: any;
  onClose: () => void;
}

const today = new Date();
const todayFormatted = today.toISOString().split('T')[0];

// We need to standardize the quality value mappings between display and database
type DisplayQualityValue = "excellent" | "good" | "average" | "needsWork" | "horrible";
type DatabaseQualityValue = "excellent" | "good" | "average" | "needs_work" | "poor";

// Mapping between display values and database values
const displayToDbQualityMap: Record<DisplayQualityValue, DatabaseQualityValue> = {
  excellent: "excellent",
  good: "good",
  average: "average",
  needsWork: "needs_work",
  horrible: "poor"
};

const dbToDisplayQualityMap: Record<DatabaseQualityValue, DisplayQualityValue> = {
  excellent: "excellent",
  good: "good",
  average: "average",
  needs_work: "needsWork",
  poor: "horrible"
};

export const EditRevisionDialog = ({
  open,
  onOpenChange,
  revisionData,
  onClose,
}: EditRevisionDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    revision_date: revisionData?.revision_date || todayFormatted,
    juz_number: revisionData?.juz_number?.toString() || "1",
    quarter_start: revisionData?.quarter_start?.toString() || "1",
    quarters_covered: revisionData?.quarters_covered?.toString() || "1",
    dhor_slot: revisionData?.dhor_slot?.toString() || "1",
    memorization_quality: revisionData?.memorization_quality 
      ? dbToDisplayQualityMap[revisionData.memorization_quality as DatabaseQualityValue] 
      : "average" as DisplayQualityValue,
    teacher_notes: revisionData?.teacher_notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const submissionData = {
        revision_date: formData.revision_date,
        juz_number: parseInt(formData.juz_number),
        quarter_start: parseInt(formData.quarter_start),
        quarters_covered: parseInt(formData.quarters_covered),
        dhor_slot: parseInt(formData.dhor_slot),
        memorization_quality: displayToDbQualityMap[formData.memorization_quality],
        teacher_notes: formData.teacher_notes,
      };

      const { data, error } = await supabase
        .from('revisions')
        .update(submissionData)
        .eq('id', revisionData.id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revision updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['student-revisions', revisionData.student_id] });
      onClose();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQualityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      memorization_quality: value as DisplayQualityValue
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Revision</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revision_date">Revision Date</Label>
            <Input
              id="revision_date"
              type="date"
              defaultValue={formData.revision_date}
              onChange={(e) => setFormData(prev => ({ ...prev, revision_date: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="juz_number">Juz Number</Label>
              <Input
                id="juz_number"
                type="number"
                min="1"
                max="30"
                defaultValue={formData.juz_number}
                onChange={(e) => setFormData(prev => ({ ...prev, juz_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_start">Quarter Start</Label>
              <Input
                id="quarter_start"
                type="number"
                min="1"
                max="4"
                defaultValue={formData.quarter_start}
                onChange={(e) => setFormData(prev => ({ ...prev, quarter_start: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quarters_covered">Quarters Covered</Label>
            <Input
              id="quarters_covered"
              type="number"
              min="1"
              max="8"
              defaultValue={formData.quarters_covered}
              onChange={(e) => setFormData(prev => ({ ...prev, quarters_covered: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dhor_slot">Dhor Slot</Label>
            <Input
              id="dhor_slot"
              type="number"
              min="1"
              max="8"
              defaultValue={formData.dhor_slot}
              onChange={(e) => setFormData(prev => ({ ...prev, dhor_slot: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memorization_quality">Memorization Quality</Label>
            <Select value={formData.memorization_quality} onValueChange={handleQualityChange}>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher_notes">Teacher Notes</Label>
            <Input
              id="teacher_notes"
              placeholder="Enter notes about the revision"
              defaultValue={formData.teacher_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, teacher_notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : "Update Revision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
