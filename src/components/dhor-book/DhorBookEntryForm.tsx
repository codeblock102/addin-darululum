import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { DhorBookEntrySchema, DhorBookEntryFormValues } from "./dhorBookValidation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuranData } from "./useQuranData";
import { toast } from "@/components/ui/use-toast";
import { getAyahRangeForSurahInJuz } from "@/utils/juzAyahMapping";
import { calculatePages } from "@/utils/quranPageCalculation";

interface DhorBookEntryFormProps {
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function DhorBookEntryForm({ onSubmit, isPending, onCancel }: DhorBookEntryFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("sabaq");
  const [ayatOptions, setAyatOptions] = useState<number[]>([]);
  const [calculatedPages, setCalculatedPages] = useState<number>(0);
  
  const { 
    juzData, 
    juzLoading,
    surahsInJuz, 
    isLoadingSurahs,
    selectedJuz, 
    setSelectedJuz, 
    selectedSurah, 
    setSelectedSurah 
  } = useQuranData();
  
  // Debug console logs
  console.log("juzData in form:", juzData);
  console.log("selectedJuz in form:", selectedJuz);
  console.log("surahsInJuz in form:", surahsInJuz);
  
  const form = useForm<DhorBookEntryFormValues>({
    resolver: zodResolver(DhorBookEntrySchema),
    defaultValues: {
      entry_date: date,
      sabak_para: "",
      sabaq_para_juz: undefined,
      sabaq_para_pages: undefined,
      dhor_1: "",
      dhor_1_mistakes: 0,
      dhor_2: "",
      dhor_2_mistakes: 0,
      dhor_juz: undefined,
      dhor_quarter_start: undefined,
      dhor_quarters_covered: undefined,
      comments: "",
      points: 0,
      detention: false,
      current_surah: undefined,
      current_juz: undefined,
      start_ayat: undefined,
      end_ayat: undefined,
      memorization_quality: "average",
      revision_status: "",
      teacher_notes: "",
      quran_format: "15"
    },
  });

  // Update form values when juz or surah selection changes
  useEffect(() => {
    if (selectedJuz) {
      form.setValue('current_juz', selectedJuz);
    }
    
    if (selectedSurah) {
      form.setValue('current_surah', selectedSurah);
      
      // Get the ayah range for the selected surah in the selected juz
      const ayahRange = getAyahRangeForSurahInJuz(selectedJuz || 0, selectedSurah);
      
      if (ayahRange) {
        // Generate ayat options only for the range that belongs to the selected juz
        const ayatArray = Array.from(
          { length: ayahRange.endAyah - ayahRange.startAyah + 1 },
          (_, i) => ayahRange.startAyah + i
        );
        setAyatOptions(ayatArray);
        
        // Reset ayat selections when surah changes
        form.setValue('start_ayat', ayahRange.startAyah);
        form.setValue('end_ayat', undefined);
        setCalculatedPages(0);
      } else {
        setAyatOptions([]);
      }
    } else {
      setAyatOptions([]);
    }
  }, [selectedJuz, selectedSurah, form]);

  // Add effect to calculate pages when ayats change
  useEffect(() => {
    const startAyah = form.watch('start_ayat');
    const endAyah = form.watch('end_ayat');
    const quranFormat = form.watch('quran_format') as "13" | "15";

    if (startAyah && endAyah && quranFormat) {
      const pages = calculatePages(quranFormat, startAyah, endAyah);
      setCalculatedPages(pages);
    } else {
      setCalculatedPages(0);
    }
  }, [form.watch('start_ayat'), form.watch('end_ayat'), form.watch('quran_format')]);

  // Debug logs to help identify issues
  useEffect(() => {
    console.log("Selected Juz:", selectedJuz);
    console.log("Surahs in Juz available:", surahsInJuz);
  }, [selectedJuz, surahsInJuz]);

  function handleSubmit(data: DhorBookEntryFormValues) {
    console.log("Form data before submission:", data);
    
    // Create a clean submission data object with all form values
    const submissionData = {
      ...data,
      entry_date: format(date || new Date(), "yyyy-MM-dd"),
      day_of_week: format(date || new Date(), "EEEE"),
      current_juz: data.current_juz, 
      current_surah: data.current_surah,
      start_ayat: data.start_ayat,
      end_ayat: data.end_ayat
    };
    
    // Log all the fields to make sure they're preserved
    console.log("Final submission data:", JSON.stringify(submissionData, null, 2));
    console.log("Sabaq data being submitted:", {
      current_juz: submissionData.current_juz,
      current_surah: submissionData.current_surah,
      start_ayat: submissionData.start_ayat,
      end_ayat: submissionData.end_ayat,
    });
    
    // Validate critical fields are present
    if (!submissionData.entry_date) {
      console.error("Missing required field: entry_date");
      return;
    }
    
    // Submit the form data
    onSubmit(submissionData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="entry_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Entry Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    {date ? format(date, "PPP") : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sabaq">Sabaq</TabsTrigger>
            <TabsTrigger value="sabaq-para">Sabaq Para</TabsTrigger>
            <TabsTrigger value="revision">Revision</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          
          {/* Sabaq Tab */}
          <TabsContent value="sabaq" className="space-y-4 pt-4">
            <div className="p-2 bg-muted/20 rounded-md text-sm text-muted-foreground mb-2">
              <p>The <strong>Sabaq</strong> column in the grid displays data from Juz, Surah, and Ayat selections you make below.</p>
            </div>
            
            <FormField
              control={form.control}
              name="quran_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quran Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Quran format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="13">13 Pages</SelectItem>
                      <SelectItem value="15">15 Pages</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_juz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juz</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const juzNumber = parseInt(value);
                        field.onChange(juzNumber);
                        setSelectedJuz(juzNumber);
                        // Reset surah when juz changes
                        setSelectedSurah(null);
                        form.setValue('current_surah', undefined);
                        form.setValue('start_ayat', undefined);
                        form.setValue('end_ayat', undefined);
                        toast({
                          title: `Selected Juz ${juzNumber}`,
                          description: `Loading surahs for Juz ${juzNumber}...`,
                        });
                      }}
                      value={field.value?.toString()}
                      onOpenChange={(open) => {
                        // Prevent the modal from closing when selecting a juz
                        if (!open) return;
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Juz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {juzData?.map((juz) => (
                          <SelectItem key={juz.id} value={juz.juz_number.toString()}>
                            Juz {juz.juz_number}
                          </SelectItem>
                        )) || (
                          <SelectItem disabled value="loading">
                            {juzLoading ? "Loading..." : "No Juz available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_surah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surah</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const surahNumber = parseInt(value);
                        field.onChange(surahNumber);
                        setSelectedSurah(surahNumber);
                        toast({
                          title: `Selected Surah ${surahNumber}`,
                        });
                      }}
                      value={field.value?.toString()}
                      disabled={!selectedJuz || juzLoading || isLoadingSurahs}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            juzLoading || isLoadingSurahs ? "Loading data..." :
                            !selectedJuz ? "Select Juz first" :
                            surahsInJuz.length === 0 ? "No surahs found" :
                            "Select Surah"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {juzLoading || isLoadingSurahs ? (
                          <SelectItem disabled value="loading">
                            Loading data...
                          </SelectItem>
                        ) : surahsInJuz && surahsInJuz.length > 0 ? (
                          surahsInJuz.map((surah) => (
                            <SelectItem key={surah.id} value={surah.surah_number.toString()}>
                              {surah.surah_number}. {surah.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="none">
                            {selectedJuz ? "No surahs found for this Juz" : "Select a Juz first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Start Ayat</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const ayatNumber = parseInt(value);
                        field.onChange(ayatNumber);
                        // Reset end ayat when start ayat changes
                        form.setValue('end_ayat', undefined);
                      }}
                      value={field.value?.toString()}
                      disabled={!selectedSurah || ayatOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSurah ? "Select Ayat" : "Select Surah first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ayatOptions.map((ayat) => (
                          <SelectItem key={`start-${ayat}`} value={ayat.toString()}>
                            Ayat {ayat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Ayat</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                      }}
                      value={field.value?.toString()}
                      disabled={!form.watch('start_ayat') || ayatOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !form.watch('start_ayat') ? "Select Start Ayat first" :
                            "Select End Ayat"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ayatOptions
                          .filter((ayat) => {
                            const startAyat = form.watch('start_ayat');
                            return startAyat ? ayat >= startAyat : true;
                          })
                          .map((ayat) => (
                            <SelectItem key={`end-${ayat}`} value={ayat.toString()}>
                              Ayat {ayat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Sabaq Para Tab */}
          <TabsContent value="sabaq-para" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="sabaq_para_juz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq Para - Juz</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Juz for Sabaq Para" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {juzData?.map((juz) => (
                        <SelectItem key={`sabaq-para-juz-${juz.id}`} value={juz.juz_number.toString()}>
                          Juz {juz.juz_number}
                        </SelectItem>
                      )) || (
                        <SelectItem disabled value="loading-juz-sabaq-para">
                          {juzLoading ? "Loading Juz data..." : "No Juz data"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sabaq_para_pages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq Para - Pages Read</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter number of pages" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
                  <FormLabel>Sabaq Para - Memorization Quality</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} // Zod schema makes it optional, RHF handles undefined
                    defaultValue="average" // Provide a UI default if preferred
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
                      <SelectItem value="horrible">Incomplete/Horrible</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sabak_para" // Existing text field for any general notes on Sabaq Para
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq Para - Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any additional notes for sabaq para" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Revision Tab */}
          <TabsContent value="revision" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="dhor_juz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor - Juz</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Juz for Dhor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {juzData?.map((juz) => (
                        <SelectItem key={`dhor-juz-${juz.id}`} value={juz.juz_number.toString()}>
                          Juz {juz.juz_number}
                        </SelectItem>
                      )) || (
                        <SelectItem disabled value="loading-juz-dhor">
                          {juzLoading ? "Loading Juz data..." : "No Juz data"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dhor_quarter_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dhor - Starting Quarter</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select starting quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1st Quarter</SelectItem>
                        <SelectItem value="2">2nd Quarter</SelectItem>
                        <SelectItem value="3">3rd Quarter</SelectItem>
                        <SelectItem value="4">4th Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dhor_quarters_covered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dhor - Quarters Covered</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarters covered" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Quarter</SelectItem>
                        <SelectItem value="2">2 Quarters</SelectItem>
                        <SelectItem value="3">3 Quarters</SelectItem>
                        <SelectItem value="4">4 Quarters (Full Juz)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2 bg-muted/20 rounded-md text-sm text-muted-foreground my-2">
              <p>The fields below (Dhor 1 & 2, and their mistakes) can be used for specific page numbers or notes if needed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dhor_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dhor 1 (Notes/Pages)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dhor 1 details" {...field} />
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
                    <FormLabel>Dhor 1 Mistakes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dhor_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dhor 2 (Notes/Pages)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dhor 2 details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dhor_2_mistakes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dhor 2 Mistakes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="revision_status" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Revision Status</FormLabel>
                  <FormControl>
                    <Input placeholder="Status of overall revision" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detention"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-2 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Detention</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter comments"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="teacher_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes from the teacher"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Add pages display */}
        {calculatedPages > 0 && (
          <div className="text-sm text-muted-foreground">
            Pages to memorize: {calculatedPages} pages
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Entry"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
