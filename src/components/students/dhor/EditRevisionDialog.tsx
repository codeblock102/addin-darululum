
// First, let's define consistent types for memorization quality
type DisplayQualityValue = "excellent" | "good" | "average" | "needsWork" | "horrible";
type DatabaseQualityValue = "excellent" | "good" | "average" | "poor" | "unsatisfactory";

// Mapping function to convert between display and database values
const mapDisplayToDbQuality = (value: DisplayQualityValue): DatabaseQualityValue => {
  const mapping: Record<DisplayQualityValue, DatabaseQualityValue> = {
    excellent: "excellent",
    good: "good",
    average: "average",
    needsWork: "poor",
    horrible: "unsatisfactory"
  };
  return mapping[value];
};

const mapDbToDisplayQuality = (value: DatabaseQualityValue): DisplayQualityValue => {
  const mapping: Record<DatabaseQualityValue, DisplayQualityValue> = {
    excellent: "excellent",
    good: "good",
    average: "average",
    poor: "needsWork",
    unsatisfactory: "horrible"
  };
  return mapping[value];
};

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Revision {
  id: string;
  revision_date: string | null;
  juz_number: number | null;
  quarter_start: number | null;
  quarters_covered: number | null;
  dhor_slot: number | null;
  memorization_quality: string | null;
  teacher_notes: string | null;
}

interface EditRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision: Revision;
  onClose: () => void;
}

export const EditRevisionDialog = ({ 
  open, 
  onOpenChange, 
  revision, 
  onClose 
}: EditRevisionDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Convert the database value to display value when initializing form
  const dbQuality = revision.memorization_quality as DatabaseQualityValue | null;
  const initialDisplayQuality = dbQuality 
    ? mapDbToDisplayQuality(dbQuality) 
    : "average";
  
  const [formData, setFormData] = useState({
    revision_date: revision.revision_date || new Date().toISOString().split('T')[0],
    juz_number: revision.juz_number?.toString() || "",
    quarter_start: revision.quarter_start?.toString() || "1",
    quarters_covered: revision.quarters_covered?.toString() || "1",
    dhor_slot: revision.dhor_slot?.toString() || "1",
    memorization_quality: initialDisplayQuality,
    teacher_notes: revision.teacher_notes || ""
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Convert the display quality value to database value for saving
      const dbQualityValue = mapDisplayToDbQuality(formData.memorization_quality as DisplayQualityValue);
      
      const { error } = await supabase
        .from('juz_revisions')
        .update({
          revision_date: formData.revision_date,
          juz_number: parseInt(formData.juz_number),
          quarter_start: parseInt(formData.quarter_start),
          quarters_covered: parseInt(formData.quarters_covered),
          dhor_slot: parseInt(formData.dhor_slot),
          memorization_quality: dbQualityValue,
          teacher_notes: formData.teacher_notes
        })
        .eq('id', revision.id);
        
      if (error) throw error;
      
      toast({
        title: "Revision Updated",
        description: "The revision record has been successfully updated."
      });
      
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['student-revisions'] });
      onClose();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      console.error("Failed to update revision:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Revision</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revision_date">Revision Date</Label>
              <Input
                id="revision_date"
                type="date"
                value={formData.revision_date}
                onChange={(e) => setFormData(prev => ({ ...prev, revision_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dhor_slot">Dhor Slot</Label>
              <Input
                id="dhor_slot"
                type="number"
                min={1}
                max={8}
                value={formData.dhor_slot}
                onChange={(e) => setFormData(prev => ({ ...prev, dhor_slot: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="juz_number">Juz Number</Label>
              <Input
                id="juz_number"
                type="number"
                min={1}
                max={30}
                value={formData.juz_number}
                onChange={(e) => setFormData(prev => ({ ...prev, juz_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_start">Quarter Start</Label>
              <Select value={formData.quarter_start} onValueChange={(value) => setFormData(prev => ({ ...prev, quarter_start: value }))}>
                <SelectTrigger id="quarter_start">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st</SelectItem>
                  <SelectItem value="2">2nd</SelectItem>
                  <SelectItem value="3">3rd</SelectItem>
                  <SelectItem value="4">4th</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarters_covered">Quarters Covered</Label>
              <Select value={formData.quarters_covered} onValueChange={(value) => setFormData(prev => ({ ...prev, quarters_covered: value }))}>
                <SelectTrigger id="quarters_covered">
                  <SelectValue placeholder="Select quarters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="memorization_quality">Memorization Quality</Label>
            <Select 
              value={formData.memorization_quality} 
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, memorization_quality: value as DisplayQualityValue }))}
            >
              <SelectTrigger id="memorization_quality">
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
            <Textarea
              id="teacher_notes"
              placeholder="Enter notes about the revision"
              value={formData.teacher_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, teacher_notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? "Updating..." : "Update Revision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
