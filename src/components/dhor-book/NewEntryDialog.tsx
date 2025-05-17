
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { useDhorEntryMutation } from "./useDhorEntryMutation";
import { Loader2 } from "lucide-react";

interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId?: string;
  onSuccess?: () => void;
}

export function NewEntryDialog({ open, onOpenChange, studentId, teacherId = '', onSuccess }: NewEntryDialogProps) {
  const [entryDate, setEntryDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [comments, setComments] = useState<string>('');
  const [detention, setDetention] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(0);
  
  // Sabaq fields (progress table)
  const [currentJuz, setCurrentJuz] = useState<number | undefined>(undefined);
  const [currentSurah, setCurrentSurah] = useState<number | undefined>(undefined);
  const [startAyat, setStartAyat] = useState<number | undefined>(undefined);
  const [endAyat, setEndAyat] = useState<number | undefined>(undefined);
  const [memorizationQuality, setMemorizationQuality] = useState<string>('average');
  
  // Sabaq Para fields (sabaq_para table)
  const [sabaqParaJuz, setSabaqParaJuz] = useState<number | undefined>(undefined);
  const [sabaqParaPages, setSabaqParaPages] = useState<number | undefined>(undefined);
  const [sabaqParaQuality, setSabaqParaQuality] = useState<string>('average');
  const [quartersRevised, setQuartersRevised] = useState<string>('quarter_1');
  
  // Dhor fields (juz_revisions table)
  const [dhorJuz, setDhorJuz] = useState<number | undefined>(undefined);
  const [dhorQuality, setDhorQuality] = useState<string>('average');
  const [dhorQuarterStart, setDhorQuarterStart] = useState<number | undefined>(1);
  const [dhorQuartersCovered, setDhorQuartersCovered] = useState<number | undefined>(1);

  const { mutate, isPending } = useDhorEntryMutation({
    studentId,
    teacherId: teacherId || '',
    onSuccess: () => {
      console.log("Entry successfully added!");
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
    setComments('');
    setDetention(false);
    setPoints(0);
    setCurrentJuz(undefined);
    setCurrentSurah(undefined);
    setStartAyat(undefined);
    setEndAyat(undefined);
    setMemorizationQuality('average');
    setSabaqParaJuz(undefined);
    setSabaqParaPages(undefined);
    setSabaqParaQuality('average');
    setQuartersRevised('quarter_1');
    setDhorJuz(undefined);
    setDhorQuality('average');
    setDhorQuarterStart(1);
    setDhorQuartersCovered(1);
  };

  const handleSubmit = () => {
    console.log("Submitting entry with data:", {
      entryDate, comments, detention, points,
      currentJuz, currentSurah, startAyat, endAyat, memorizationQuality,
      sabaqParaJuz, sabaqParaPages, sabaqParaQuality, quartersRevised,
      dhorJuz, dhorQuality, dhorQuarterStart, dhorQuartersCovered
    });

    mutate({
      entry_date: entryDate,
      comments,
      detention,
      points,
      // Sabaq fields
      current_juz: currentJuz,
      current_surah: currentSurah,
      start_ayat: startAyat,
      end_ayat: endAyat,
      memorization_quality: memorizationQuality as any,
      // Sabaq Para fields
      sabaq_para_juz: sabaqParaJuz,
      sabaq_para_pages: sabaqParaPages,
      sabaq_para_memorization_quality: sabaqParaQuality as any,
      quarters_revised: quartersRevised as any,
      // Dhor fields
      dhor_juz: dhorJuz,
      dhor_memorization_quality: dhorQuality as any,
      dhor_quarter_start: dhorQuarterStart,
      dhor_quarters_covered: dhorQuartersCovered,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Daily Entry</DialogTitle>
          <DialogDescription>
            Record daily Dhor Book entry for student.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entry-date" className="text-right">
              Date
            </Label>
            <Input
              id="entry-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Sabaq section */}
          <div className="border p-3 rounded-md">
            <h3 className="font-medium mb-3">Sabaq (Main Lesson)</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label htmlFor="current-juz">Juz</Label>
                <Input
                  id="current-juz"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="1-30"
                  value={currentJuz || ''}
                  onChange={(e) => setCurrentJuz(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="current-surah">Surah</Label>
                <Input
                  id="current-surah"
                  type="number"
                  min="1"
                  max="114"
                  placeholder="1-114"
                  value={currentSurah || ''}
                  onChange={(e) => setCurrentSurah(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="start-ayat">Start Ayat</Label>
                <Input
                  id="start-ayat"
                  type="number"
                  min="1"
                  placeholder="1+"
                  value={startAyat || ''}
                  onChange={(e) => setStartAyat(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="end-ayat">End Ayat</Label>
                <Input
                  id="end-ayat"
                  type="number"
                  min="1"
                  placeholder="1+"
                  value={endAyat || ''}
                  onChange={(e) => setEndAyat(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor="mem-quality">Memorization Quality</Label>
                <Select
                  value={memorizationQuality}
                  onValueChange={setMemorizationQuality}
                >
                  <SelectTrigger id="mem-quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="needsWork">Needs Work</SelectItem>
                    <SelectItem value="horrible">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sabaq Para section */}
          <div className="border p-3 rounded-md">
            <h3 className="font-medium mb-3">Sabaq Para (Reading)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="para-juz">Juz Number</Label>
                <Input
                  id="para-juz"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="1-30"
                  value={sabaqParaJuz || ''}
                  onChange={(e) => setSabaqParaJuz(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="para-pages">Pages</Label>
                <Input
                  id="para-pages"
                  type="number"
                  min="1"
                  placeholder="Number of pages"
                  value={sabaqParaPages || ''}
                  onChange={(e) => setSabaqParaPages(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="quarter-revised">Quarter Revised</Label>
                <Select
                  value={quartersRevised}
                  onValueChange={setQuartersRevised}
                >
                  <SelectTrigger id="quarter-revised">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarter_1">Quarter 1</SelectItem>
                    <SelectItem value="quarter_2">Quarter 2</SelectItem>
                    <SelectItem value="quarter_3">Quarter 3</SelectItem>
                    <SelectItem value="quarter_4">Quarter 4</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="para-quality">Quality</Label>
                <Select
                  value={sabaqParaQuality}
                  onValueChange={setSabaqParaQuality}
                >
                  <SelectTrigger id="para-quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="needsWork">Needs Work</SelectItem>
                    <SelectItem value="horrible">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dhor section */}
          <div className="border p-3 rounded-md">
            <h3 className="font-medium mb-3">Dhor (Revision)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dhor-juz">Juz Number</Label>
                <Input
                  id="dhor-juz"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="1-30"
                  value={dhorJuz || ''}
                  onChange={(e) => setDhorJuz(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="dhor-quality">Quality</Label>
                <Select
                  value={dhorQuality}
                  onValueChange={setDhorQuality}
                >
                  <SelectTrigger id="dhor-quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="needsWork">Needs Work</SelectItem>
                    <SelectItem value="horrible">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quarter-start">Quarter Start</Label>
                <Input
                  id="quarter-start"
                  type="number"
                  min="1"
                  max="4"
                  placeholder="1-4"
                  value={dhorQuarterStart || ''}
                  onChange={(e) => setDhorQuarterStart(parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="quarters-covered">Quarters Covered</Label>
                <Input
                  id="quarters-covered"
                  type="number"
                  min="1"
                  max="4"
                  placeholder="1-4"
                  value={dhorQuartersCovered || ''}
                  onChange={(e) => setDhorQuartersCovered(parseInt(e.target.value) || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Comments and additional fields */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Add any additional notes or comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="detention"
                  checked={detention}
                  onChange={(e) => setDetention(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="detention" className="cursor-pointer">Detention</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
