import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { cn } from "@/lib/utils.ts";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { DialogFooter } from "@/components/ui/dialog.tsx";
import {
  DailyActivityFormSchema,
  DailyActivityFormValues,
} from "./dhorBookValidation.ts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { useQuranData } from "./useQuranData.ts";
import { toast } from "@/components/ui/use-toast.ts";
import { getAyahRangeForSurahInJuz } from "@/utils/juzAyahMapping.ts";
import { calculatePages } from "@/utils/quranPageCalculation.ts";
import type { DhorBookCombinedFormData } from "./useDhorEntryMutation.ts";

interface DhorBookEntryFormProps {
  onSubmit: (data: DhorBookCombinedFormData) => void;
  isPending: boolean;
  onCancel: () => void;
  /** Which tab to show initially: 'sabaq' | 'sabaq-para' | 'revision' | 'general' */
  initialTab?: "sabaq" | "sabaq-para" | "revision" | "general";
}

export function DhorBookEntryForm(
  { onSubmit, isPending, onCancel, initialTab = "sabaq" }: DhorBookEntryFormProps,
) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState(initialTab);
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
    setSelectedSurah,
    allSurahsData,
  } = useQuranData();

  const form = useForm<DailyActivityFormValues>({
    resolver: zodResolver(DailyActivityFormSchema),
    defaultValues: {
      entry_date: date,
      current_juz: undefined,
      current_surah: undefined,
      start_ayat: undefined,
      end_ayat: undefined,
      memorization_quality: "average",
      quran_format: "15",
      sabaq_para_juz: undefined,
      sabaq_para_pages: 0,
      sabaq_para_memorization_quality: undefined,
      quarters_revised: undefined,
      dhor_juz: undefined,
      dhor_memorization_quality: "average",
      dhor_quarter_start: undefined,
      dhor_quarters_covered: undefined,
      comments: "",
      points: 0,
      detention: false,
    },
  });

  // Update form when juz or surah changes and fetch ayahs
  useEffect(() => {
    if (selectedJuz) {
      form.setValue("current_juz", selectedJuz);

      if (selectedSurah) {
        form.setValue("current_surah", selectedSurah);
        console.log(
          `Getting ayah range for Juz ${selectedJuz}, Surah ${selectedSurah}`,
        );

        const ayahRange = getAyahRangeForSurahInJuz(selectedJuz, selectedSurah);
        let start = 1;
        let end = 0;

        if (ayahRange) {
          // If the mapping returns exactly 20 ayahs, it's likely the placeholder fallback.
          const isPlaceholder = (ayahRange.endAyah - ayahRange.startAyah + 1) === 20;
          if (isPlaceholder) {
            const surahMeta = allSurahsData?.find(
              (s) => s.surah_number === selectedSurah,
            );
            if (surahMeta?.total_ayat) {
              start = 1;
              end = surahMeta.total_ayat;
            } else {
              start = ayahRange.startAyah;
              end = ayahRange.endAyah;
            }
          } else {
            start = ayahRange.startAyah;
            end = ayahRange.endAyah;
          }
        } else {
          // No mapping found: fallback to full surah if we know total_ayat
          const surahMeta = allSurahsData?.find(
            (s) => s.surah_number === selectedSurah,
          );
          if (surahMeta?.total_ayat) {
            start = 1;
            end = surahMeta.total_ayat;
          }
        }

        if (end > 0) {
          console.log(`Ayah range resolved: ${start}-${end}`);
          const ayatArray = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          setAyatOptions(ayatArray);
          // Reset ayat selections when surah changes
          form.setValue("start_ayat", start);
          form.setValue("end_ayat", undefined);
          setCalculatedPages(0);
        } else {
          console.warn(
            `Unable to resolve ayah range for Juz ${selectedJuz}, Surah ${selectedSurah}`,
          );
          setAyatOptions([]);
        }
      }
    } else {
      // Reset if no juz selected
      setAyatOptions([]);
    }
  }, [selectedJuz, selectedSurah, form]);

  const startAyah = form.watch("start_ayat");
  const endAyah = form.watch("end_ayat");
  const quranFormat = form.watch("quran_format");

  // Calculate pages based on ayat range
  useEffect(() => {
    if (startAyah && endAyah && quranFormat) {
      const pages = calculatePages(
        quranFormat as "13" | "15",
        startAyah,
        endAyah,
      );
      setCalculatedPages(pages);
      // pages_memorized is not part of the RHF schema; keep it local only
    } else {
      setCalculatedPages(0);
    }
  }, [startAyah, endAyah, quranFormat, form]);

  function handleSubmit(data: DailyActivityFormValues) {
    console.log("Form data from RHF (DailyActivityFormValues):", data);
    if (!date) {
      toast({
        title: "Error",
        description: "Entry date is required.",
        variant: "destructive",
      });
      return;
    }
    const finalPayload: DhorBookCombinedFormData = {
      ...data,
      entry_date: format(date, "yyyy-MM-dd"),
      pages_memorized: calculatedPages,
    };
    console.log(
      "Final payload for onSubmit (DhorBookCombinedFormData):",
      JSON.stringify(finalPayload, null, 2),
    );
    onSubmit(finalPayload);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 max-h-[80vh] overflow-y-auto p-1"
      >
        <FormField
          control={form.control}
          name="entry_date"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Entry Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                    type="button"
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      form.setValue("entry_date", newDate);
                    }}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as "sabaq" | "sabaq-para" | "revision" | "general")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 bg-white border border-emerald-100 rounded-md p-1 text-gray-600">
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="sabaq">Sabaq</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="sabaq-para">Sabaq Para</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="revision">Revision</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="sabaq" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="quran_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quran Format (for page calculation)</FormLabel>
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
                      <SelectItem value="13">13 Line</SelectItem>
                      <SelectItem value="15">15 Line</SelectItem>
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
                        console.log(`Selected Juz: ${juzNumber}`);
                        field.onChange(juzNumber);
                        setSelectedJuz(juzNumber);
                        setSelectedSurah(null);
                        form.setValue("current_surah", undefined);
                        form.setValue("start_ayat", undefined);
                        form.setValue("end_ayat", undefined);
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
                          <SelectItem
                            key={juz.id}
                            value={juz.juz_number.toString()}
                          >
                            Juz {juz.juz_number}
                          </SelectItem>
                        ))}
                        {(!juzData || juzData.length === 0) && (
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
                        console.log(`Selected Surah: ${surahNumber}`);
                        field.onChange(surahNumber);
                        setSelectedSurah(surahNumber);
                      }}
                      value={field.value?.toString()}
                      disabled={!selectedJuz || juzLoading || isLoadingSurahs}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={juzLoading || isLoadingSurahs
                              ? "Loading data..."
                              : !selectedJuz
                              ? "Select Juz first"
                              : surahsInJuz.length === 0
                              ? "No surahs found"
                              : "Select Surah"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {juzLoading || isLoadingSurahs
                          ? (
                            <SelectItem disabled value="loading">
                              Loading data...
                            </SelectItem>
                          )
                          : surahsInJuz && surahsInJuz.length > 0
                          ? (
                            surahsInJuz.map((surah) => (
                              <SelectItem
                                key={surah.id}
                                value={surah.surah_number.toString()}
                              >
                                {surah.surah_number}. {surah.name}
                              </SelectItem>
                            ))
                          )
                          : (
                            <SelectItem disabled value="none">
                              {selectedJuz
                                ? "No surahs found for this Juz"
                                : "Select a Juz first"}
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
                        console.log(`Selected Start Ayat: ${ayatNumber}`);
                        field.onChange(ayatNumber);
                        // Reset end ayat when start changes
                        form.setValue("end_ayat", undefined);
                      }}
                      value={field.value?.toString()}
                      disabled={!selectedSurah || ayatOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={selectedSurah
                              ? "Select Ayat"
                              : "Select Surah first"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ayatOptions.length > 0
                          ? (
                            ayatOptions.map((ayat) => (
                              <SelectItem
                                key={`start-${ayat}`}
                                value={ayat.toString()}
                              >
                                Ayat {ayat}
                              </SelectItem>
                            ))
                          )
                          : (
                            <SelectItem disabled value="no-ayats">
                              {selectedSurah
                                ? "No ayats available"
                                : "Select Surah first"}
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
                name="end_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Ayat</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const ayatNumber = parseInt(value);
                        console.log(`Selected End Ayat: ${ayatNumber}`);
                        field.onChange(ayatNumber);
                      }}
                      value={field.value?.toString()}
                      disabled={!form.watch("start_ayat") ||
                        ayatOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={!form.watch("start_ayat")
                              ? "Select Start Ayat first"
                              : "Select End Ayat"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("start_ayat") && ayatOptions.length > 0
                          ? (
                            ayatOptions
                              .filter((ayat) => {
                                const startAyat = form.watch("start_ayat");
                                return startAyat ? ayat >= startAyat : true;
                              })
                              .map((ayat) => (
                                <SelectItem
                                  key={`end-${ayat}`}
                                  value={ayat.toString()}
                                >
                                  Ayat {ayat}
                                </SelectItem>
                              ))
                          )
                          : (
                            <SelectItem disabled value="no-end-ayats">
                              {form.watch("start_ayat")
                                ? "No end ayats available"
                                : "Select Start Ayat first"}
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="memorization_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq - Memorization Quality</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="average"
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
                        Incomplete/Horrible
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

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
                        <SelectItem
                          key={`sabaq-para-juz-${juz.id}`}
                          value={juz.juz_number.toString()}
                        >
                          Juz {juz.juz_number}
                        </SelectItem>
                      )) ||
                        (
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
              name="quarters_revised"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq Para - Quarters Revised</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="1st_quarter"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quarters revised" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1st_quarter">1st Quarter</SelectItem>
                      <SelectItem value="2_quarters">2 Quarters</SelectItem>
                      <SelectItem value="3_quarters">3 Quarters</SelectItem>
                      <SelectItem value="4_quarters">
                        4 Quarters (Full Juz)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sabaq_para_memorization_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabaq Para - Memorization Quality</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="average"
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
                        Incomplete/Horrible
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="revision" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="dhor_juz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor - Juz Revised</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value) : undefined)}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Juz for Dhor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {juzData?.map((juz) => (
                        <SelectItem
                          key={`dhor-juz-${juz.id}`}
                          value={juz.juz_number.toString()}
                        >
                          Juz {juz.juz_number}
                        </SelectItem>
                      )) ||
                        (
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
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : undefined)}
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
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : undefined)}
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
            <FormField
              control={form.control}
              name="dhor_memorization_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor - Memorization Quality</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="average"
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
                        Incomplete/Horrible
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="general" className="space-y-4 pt-4">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="general">Other Details</TabsTrigger>
            </TabsList>
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any general comments"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                name="detention"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-2 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Detention
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {calculatedPages > 0 && (
          <div className="text-sm text-muted-foreground">
            Pages memorized: {calculatedPages} pages
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
