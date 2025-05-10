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

interface DhorBookEntryFormProps {
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function DhorBookEntryForm({ onSubmit, isPending, onCancel }: DhorBookEntryFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("sabaq");
  const [ayatOptions, setAyatOptions] = useState<number[]>([]);
  
  const { 
    juzData, 
    surahData, 
    surahsInJuz, 
    selectedJuz, 
    setSelectedJuz, 
    selectedSurah, 
    setSelectedSurah 
  } = useQuranData();
  
  const form = useForm<DhorBookEntryFormValues>({
    resolver: zodResolver(DhorBookEntrySchema),
    defaultValues: {
      entry_date: date,
      sabak: "",
      sabak_para: "",
      dhor_1: "",
      dhor_1_mistakes: 0,
      dhor_2: "",
      dhor_2_mistakes: 0,
      comments: "",
      points: 0,
      detention: false,
      current_surah: undefined,
      current_juz: undefined,
      start_ayat: undefined,
      end_ayat: undefined,
      verses_memorized: undefined,
      memorization_quality: "average",
      tajweed_level: "",
      revision_status: "",
      teacher_notes: ""
    },
  });

  // Update form values when juz or surah selection changes
  useEffect(() => {
    if (selectedJuz) {
      form.setValue('current_juz', selectedJuz);
    }
    
    if (selectedSurah) {
      form.setValue('current_surah', selectedSurah);
      
      // Generate ayat options based on selected surah
      const selectedSurahData = surahData?.find(s => s.surah_number === selectedSurah);
      if (selectedSurahData) {
        const totalAyat = selectedSurahData.total_ayat;
        const ayatArray = Array.from({ length: totalAyat }, (_, i) => i + 1);
        setAyatOptions(ayatArray);
        
        // Reset ayat selections when surah changes
        form.setValue('start_ayat', 1);
        form.setValue('end_ayat', undefined);
      } else {
        setAyatOptions([]);
      }
    } else {
      setAyatOptions([]);
    }
  }, [selectedJuz, selectedSurah, surahData, form]);

  // Debug logs to help identify issues
  useEffect(() => {
    console.log("Selected Juz:", selectedJuz);
    console.log("Surahs in Juz available:", surahsInJuz);
  }, [selectedJuz, surahsInJuz]);

  function handleSubmit(data: DhorBookEntryFormValues) {
    onSubmit({
      ...data,
      entry_date: format(date || new Date(), "yyyy-MM-dd"),
      day_of_week: format(date || new Date(), "EEEE")
    });
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
            <FormField
              control={form.control}
              name="sabak"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sabaq" {...field} />
                  </FormControl>
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
                      }}
                      value={field.value?.toString()}
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
                        ))}
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
                      }}
                      value={field.value?.toString()}
                      disabled={!selectedJuz || surahsInJuz.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedJuz ? (surahsInJuz.length > 0 ? "Select Surah" : "No surahs found") : "Select Juz first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {surahsInJuz.map((surah) => (
                          <SelectItem key={surah.id} value={surah.surah_number.toString()}>
                            {surah.surah_number}. {surah.name}
                          </SelectItem>
                        ))}
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
                        field.onChange(parseInt(value));
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
                      disabled={!form.getValues('start_ayat') || ayatOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={form.getValues('start_ayat') ? "Select Ayat" : "Select Start Ayat first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ayatOptions
                          .filter((ayat) => ayat >= (form.getValues('start_ayat') || 1))
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

            <FormField
              control={form.control}
              name="verses_memorized"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verses Memorized</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Number of verses memorized" 
                      {...field} 
                      value={field.value || ''} 
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Sabaq Para Tab */}
          <TabsContent value="sabaq-para" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="sabak_para"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq Para</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sabaq para" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Input placeholder="Tajweed proficiency level" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Revision Tab */}
          <TabsContent value="revision" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dhor_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dhor 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dhor 1" {...field} />
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
                    <FormLabel>Dhor 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dhor 2" {...field} />
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
                  <FormLabel>Revision Status</FormLabel>
                  <FormControl>
                    <Input placeholder="Status of revision" {...field} />
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
