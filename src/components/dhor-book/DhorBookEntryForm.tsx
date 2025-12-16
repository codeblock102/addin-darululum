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
import { cn } from "@/lib/utils.ts";
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
// Removed ayah range mapping; derive from DB surah totals instead
import { getTotalAyahsInSurah } from "@/utils/quranValidation.ts";
import { calculatePages } from "@/utils/quranPageCalculation.ts";
import type { DhorBookCombinedFormData } from "./useDhorEntryMutation.ts";
import { supabase } from "@/integrations/supabase/client.ts";

interface DhorBookEntryFormProps {
  onSubmit: (data: DhorBookCombinedFormData) => void;
  isPending: boolean;
  onCancel: () => void;
  /** Which tab to show initially: 'sabaq' | 'sabaq-para' | 'revision' | 'naz-qaida' */
  initialTab?: "sabaq" | "sabaq-para" | "revision" | "naz-qaida";
  /** Needed to prefill start ayat based on last sabaq */
  studentId?: string;
  /** Re-run prefill when dialog opens */
  isOpen?: boolean;
}

export function DhorBookEntryForm(
  { onSubmit, isPending, onCancel, initialTab = "sabaq", studentId, isOpen }: DhorBookEntryFormProps,
) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState(initialTab);
  const [ayatOptions, setAyatOptions] = useState<number[]>([]);
  const [endSurah, setEndSurah] = useState<number | undefined>(undefined);
  const [nazAyatOptions, setNazAyatOptions] = useState<number[]>([]);
  const [calculatedPages, setCalculatedPages] = useState<number>(0);
  const [pendingStartAyat, setPendingStartAyat] = useState<number | null>(null);
  const [pendingNazStartAyat, setPendingNazStartAyat] = useState<number | null>(null);
  const [pendingSurahToSelect, setPendingSurahToSelect] = useState<number | null>(null);
  const [pendingNazSurahToSelect, setPendingNazSurahToSelect] = useState<number | null>(null);

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

  // Separate Quran data for Nazirah tab to avoid interfering with Sabaq selections
  const {
    juzData: nazJuzData,
    juzLoading: nazJuzLoading,
    surahsInJuz: nazSurahsInJuz,
    isLoadingSurahs: nazIsLoadingSurahs,
    selectedJuz: nazSelectedJuz,
    setSelectedJuz: setNazSelectedJuz,
    selectedSurah: nazSelectedSurah,
    setSelectedSurah: setNazSelectedSurah,
    allSurahsData: allNazSurahsData,
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
      quran_format: "13",
      sabaq_para_juz: undefined,
      sabaq_para_pages: undefined,
      sabaq_para_memorization_quality: "average",
      quarters_revised: "1st_quarter",
      dhor_juz: undefined,
      dhor_memorization_quality: "average",
      dhor_quarter_start: undefined,
      dhor_quarters_covered: undefined,
      // Nazirah & Qaida defaults
      naz_qaida_type: "nazirah",
      nazirah_juz: undefined,
      nazirah_surah: undefined,
      nazirah_start_ayat: undefined,
      nazirah_end_ayat: undefined,
      nazirah_memorization_quality: "average",
      qaida_lesson: "",
      qaida_memorization_quality: "average",
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
        const surahMeta = allSurahsData?.find((s) => s.surah_number === selectedSurah);
        const totalAyat = surahMeta?.total_ayat ?? getTotalAyahsInSurah(selectedSurah);
        const start = 1;
        const end = totalAyat;

        if (end && end > 0) {
          console.log(`[DhorBook] Ayat options from DB totals for Surah ${selectedSurah}: 1-${end}`);
          const ayatArray = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          setAyatOptions(ayatArray);
          // Do not set start_ayat here to avoid overriding pending value. Let the post-options effect handle it.
          form.setValue("end_ayat", undefined);
          form.setValue("end_surah", selectedSurah);
          setEndSurah(selectedSurah);
          setCalculatedPages(0);
        } else {
          console.warn(`[DhorBook] Could not resolve total ayat for Surah ${selectedSurah}`);
          setAyatOptions([]);
        }
      }
    } else {
      // Reset if no juz selected
      setAyatOptions([]);
    }
  }, [selectedJuz, selectedSurah, form, pendingStartAyat]);

  // Ensure start_ayat is applied AFTER ayatOptions are populated to avoid UI defaulting to 1
  useEffect(() => {
    if (!selectedSurah || ayatOptions.length === 0) return;
    const current = form.getValues("start_ayat");
    const firstOption = ayatOptions[0];
    if (pendingStartAyat && ayatOptions.includes(pendingStartAyat)) {
      form.setValue("start_ayat", pendingStartAyat);
      setPendingStartAyat(null);
      return;
    }
    if (current == null || !ayatOptions.includes(current)) {
      form.setValue("start_ayat", firstOption);
    }
  }, [ayatOptions, selectedSurah, pendingStartAyat, form]);

  // Apply pending surah once surah list for selected juz is available
  useEffect(() => {
    if (pendingSurahToSelect && selectedJuz && surahsInJuz && surahsInJuz.length > 0) {
      const exists = surahsInJuz.some((s) => s.surah_number === pendingSurahToSelect);
      if (exists) {
        setSelectedSurah(pendingSurahToSelect);
        form.setValue("current_surah", pendingSurahToSelect);
        form.setValue("end_surah", pendingSurahToSelect);
        setEndSurah(pendingSurahToSelect);
        setPendingSurahToSelect(null);
      }
    }
  }, [surahsInJuz, selectedJuz, pendingSurahToSelect, form, setSelectedSurah]);

  // If we have a pending surah but it's not in the currently selected juz, try to switch juz automatically
  useEffect(() => {
    if (pendingSurahToSelect && selectedJuz && surahsInJuz && juzData) {
      const exists = surahsInJuz.some((s) => s.surah_number === pendingSurahToSelect);
      if (!exists) {
        // Find a juz whose surah_list includes the pending surah
        const surahInJuz = (list: string, targetSurah: number): boolean => {
          if (!list) return false;
          let processed = list.trim();
          if (processed.startsWith("{") && processed.endsWith("}")) {
            processed = processed.slice(1, -1);
          }
          const tokens = processed.split(",").map((p) => p.trim());
          for (const token of tokens) {
            // If token contains letters and hyphen (like Ar-Ra'd), treat token as a name, not a range
            const hasLetters = /[A-Za-z]/.test(token);
            if (token.includes("-") && !hasLetters) {
              const [startStr, endStr] = token.split("-").map((s) => s.trim());
              const startNum = parseInt(startStr, 10);
              const endNum = parseInt(endStr, 10);
              if (!Number.isNaN(startNum) && !Number.isNaN(endNum)) {
                if (targetSurah >= startNum && targetSurah <= endNum) return true;
              }
            } else {
              const num = parseInt(token, 10);
              if (!Number.isNaN(num) && num === targetSurah) return true;
            }
          }
          return false;
        };
        const match = (juzData || []).find((j) => surahInJuz(j.surah_list, pendingSurahToSelect));
        if (match && match.juz_number !== selectedJuz) {
          console.log("[DhorBook] Auto-switching Juz to contain pending surah", { from: selectedJuz, to: match.juz_number, pendingSurahToSelect });
          setSelectedJuz(match.juz_number);
        }
      }
    }
  }, [pendingSurahToSelect, selectedJuz, surahsInJuz, juzData, setSelectedJuz]);

  // Fallback: apply pending surah right after juz selection resets selectedSurah
  useEffect(() => {
    if (pendingSurahToSelect && selectedJuz && !selectedSurah) {
      setSelectedSurah(pendingSurahToSelect);
      form.setValue("current_surah", pendingSurahToSelect);
      form.setValue("end_surah", pendingSurahToSelect);
      setEndSurah(pendingSurahToSelect);
      setPendingSurahToSelect(null);
    }
  }, [selectedJuz, selectedSurah, pendingSurahToSelect, form, setSelectedSurah]);

  // Update Nazirah ayah options when naz selections change
  useEffect(() => {
    if (nazSelectedJuz) {
      form.setValue("nazirah_juz", nazSelectedJuz);
      if (nazSelectedSurah) {
        form.setValue("nazirah_surah", nazSelectedSurah);
        const surahMeta = allNazSurahsData?.find((s) => s.surah_number === nazSelectedSurah);
        const totalAyat = surahMeta?.total_ayat ?? getTotalAyahsInSurah(nazSelectedSurah);
        const start = 1;
        const end = totalAyat;

        if (end && end > 0) {
          console.log(`[DhorBook] Nazirah ayat options from DB totals for Surah ${nazSelectedSurah}: 1-${end}`);
          const ayatArray = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          setNazAyatOptions(ayatArray);
          const preferredNazStart = (pendingNazStartAyat && pendingNazStartAyat >= start && pendingNazStartAyat <= end)
            ? pendingNazStartAyat
            : start;
          form.setValue("nazirah_start_ayat", preferredNazStart);
          if (preferredNazStart === pendingNazStartAyat) {
            setPendingNazStartAyat(null);
          }
          form.setValue("nazirah_end_ayat", undefined);
        } else {
          setNazAyatOptions([]);
        }
      }
    } else {
      setNazAyatOptions([]);
    }
  }, [nazSelectedJuz, nazSelectedSurah, form, allNazSurahsData, pendingNazStartAyat]);

  // Apply pending Nazirah surah once Naz surah list is available
  useEffect(() => {
    if (pendingNazSurahToSelect && nazSelectedJuz && nazSurahsInJuz && nazSurahsInJuz.length > 0) {
      const exists = nazSurahsInJuz.some((s) => s.surah_number === pendingNazSurahToSelect);
      if (exists) {
        setNazSelectedSurah(pendingNazSurahToSelect);
        form.setValue("nazirah_surah", pendingNazSurahToSelect);
        setPendingNazSurahToSelect(null);
      }
    }
  }, [nazSurahsInJuz, nazSelectedJuz, pendingNazSurahToSelect, form, setNazSelectedSurah]);

  // Fallback: apply pending Nazirah surah after juz selection resets
  useEffect(() => {
    if (pendingNazSurahToSelect && nazSelectedJuz && !nazSelectedSurah) {
      setNazSelectedSurah(pendingNazSurahToSelect);
      form.setValue("nazirah_surah", pendingNazSurahToSelect);
      setPendingNazSurahToSelect(null);
    }
  }, [nazSelectedJuz, nazSelectedSurah, pendingNazSurahToSelect, form, setNazSelectedSurah]);

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

  // Prefill Nazirah independently from last Nazirah progress
  useEffect(() => {
    if (!studentId) return;
    if (isOpen === false) return;

    const prefillFromPreviousNazirah = async () => {
      try {
        const { data: prevNaz, error: nazErr } = await supabase
          .from("progress")
          .select("current_surah,end_surah,start_ayat,end_ayat,verses_memorized,current_juz,date,lesson_type,created_at")
          .eq("student_id", studentId)
          .eq("lesson_type", "nazirah")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (nazErr) {
          console.error("[DhorBook] Error fetching previous nazirah:", nazErr);
          return;
        }
        if (!prevNaz) return;

        const lastEndSurah: number | undefined = (prevNaz as unknown as { end_surah?: number }).end_surah ?? (prevNaz as unknown as { current_surah?: number }).current_surah;
        const startAyatRaw: number | undefined = (prevNaz as unknown as { start_ayat?: number }).start_ayat;
        const versesMem: number | undefined = (prevNaz as unknown as { verses_memorized?: number }).verses_memorized;
        let lastEndAyat: number | undefined = (prevNaz as unknown as { end_ayat?: number }).end_ayat;
        if (lastEndAyat === undefined && startAyatRaw !== undefined) {
          lastEndAyat = (versesMem && versesMem > 0) ? (startAyatRaw + versesMem - 1) : startAyatRaw;
        }
        if (!lastEndSurah || !lastEndAyat) return;

        const nextSurah = lastEndSurah;
        const nextAyat = lastEndAyat;

        // Determine Juz using Naz Juz data if not present
        let nextJuz: number | undefined = (prevNaz as unknown as { current_juz?: number }).current_juz;
        try {
          const surahInJuz = (list: string, targetSurah: number): boolean => {
            if (!list) return false;
            let processed = list.trim();
            if (processed.startsWith("{") && processed.endsWith("}")) {
              processed = processed.slice(1, -1);
            }
            const tokens = processed.split(",").map((p) => p.trim());
            for (const token of tokens) {
              if (!token) continue;
              if (token.includes("-")) {
                const [startStr, endStr] = token.split("-").map((s) => s.trim());
                const startNum = parseInt(startStr, 10);
                const endNum = parseInt(endStr, 10);
                if (!Number.isNaN(startNum) && !Number.isNaN(endNum)) {
                  if (targetSurah >= startNum && targetSurah <= endNum) return true;
                }
              } else {
                const num = parseInt(token, 10);
                if (!Number.isNaN(num) && num === targetSurah) return true;
              }
            }
            return false;
          };
          if (nextJuz === undefined) {
            for (const juz of nazJuzData ?? []) {
              if (surahInJuz(juz.surah_list, nextSurah)) {
                nextJuz = juz.juz_number;
                break;
              }
            }
          }
        } catch (e) {
          console.warn("[DhorBook] Unable to resolve next Nazirah Juz from nazJuzData; leaving it undefined", e);
        }

        // Only set Nazirah fields if they are not already chosen by the user
        if (!form.getValues("nazirah_juz") && nextJuz !== undefined) {
          form.setValue("nazirah_juz", nextJuz);
          setNazSelectedJuz(nextJuz);
        }
        if (!form.getValues("nazirah_surah")) {
          form.setValue("nazirah_surah", nextSurah);
          setPendingNazSurahToSelect(nextSurah);
        }
        if (!form.getValues("nazirah_start_ayat")) {
          form.setValue("nazirah_start_ayat", nextAyat);
          setPendingNazStartAyat(nextAyat);
        }
      } catch (e) {
        console.error("[DhorBook] Unexpected error pre-filling Nazirah:", e);
      }
    };

    prefillFromPreviousNazirah();
  }, [studentId, isOpen, nazJuzData, form, setNazSelectedJuz]);

  // Prefill start ayat (and naz start ayat) based on previous sabaq entry
  useEffect(() => {
    if (!studentId) return;
    if (isOpen === false) return;

    const prefillFromPreviousSabaq = async () => {
      try {
        const { data: prev, error } = await supabase
          .from("progress")
          .select("current_surah,end_surah,start_ayat,end_ayat,verses_memorized,pages_memorized,current_juz,date,lesson_type,created_at")
          .eq("student_id", studentId)
          .or("lesson_type.is.null,lesson_type.eq.hifz")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("[DhorBook] Error fetching previous sabaq:", error);
          return;
        }
        if (!prev) {
          console.warn("[DhorBook] No previous sabaq found for student:", studentId);
          return;
        }

        console.group("[DhorBook] Prefill from previous sabaq");
        console.log("studentId:", studentId);
        console.log("raw previous row:", prev);

        // Prefer the explicit end_surah as the starting surah for the next entry; fallback to current_surah
        const lastEndSurah: number | undefined = (prev as unknown as { end_surah?: number }).end_surah ?? (prev as unknown as { current_surah?: number }).current_surah;
        const startAyatRaw: number | undefined = (prev as unknown as { start_ayat?: number }).start_ayat;
        const endAyatRaw: number | undefined = (prev as unknown as { end_ayat?: number }).end_ayat;
        const versesMem: number | undefined = (prev as unknown as { verses_memorized?: number }).verses_memorized;
        const pagesMem: number | undefined = (prev as unknown as { pages_memorized?: number }).pages_memorized;

        // Compute last end ayat: prefer explicit end_ayat; otherwise derive from start_ayat + verses_memorized - 1; fallback to start_ayat
        let lastEndAyat: number | undefined = endAyatRaw;
        if (lastEndAyat === undefined && startAyatRaw !== undefined) {
          lastEndAyat = (versesMem && versesMem > 0) ? (startAyatRaw + versesMem - 1) : startAyatRaw;
        }
        console.log("derived values:", {
          lastEndSurah,
          startAyatRaw,
          endAyatRaw,
          versesMem,
          pagesMem,
          lastEndAyat,
        });
        if (!lastEndSurah || !lastEndAyat) {
          console.warn("[DhorBook] Missing lastEndSurah or lastEndAyat; skipping prefill");
          console.groupEnd();
          return;
        }

        // Per request: start the new sabaq AT the previous ending ayat, and in the same surah
        const nextSurah = lastEndSurah;
        const nextAyat = lastEndAyat;

        // Determine Juz without relying on placeholder ayah mapping to avoid defaulting to 1
        // Prefer previous entry's current_juz if available
        let nextJuz: number | undefined = (prev as unknown as { current_juz?: number }).current_juz;
        try {
          // Parse surah_list strings from juzData to find a juz containing nextSurah
          const surahInJuz = (list: string, targetSurah: number): boolean => {
            if (!list) return false;
            let processed = list.trim();
            if (processed.startsWith("{") && processed.endsWith("}")) {
              processed = processed.slice(1, -1);
            }
            const tokens = processed.split(",").map((p) => p.trim());
            for (const token of tokens) {
              if (!token) continue;
              if (token.includes("-")) {
                const [startStr, endStr] = token.split("-").map((s) => s.trim());
                const startNum = parseInt(startStr, 10);
                const endNum = parseInt(endStr, 10);
                if (!Number.isNaN(startNum) && !Number.isNaN(endNum)) {
                  if (targetSurah >= startNum && targetSurah <= endNum) return true;
                }
              } else {
                const num = parseInt(token, 10);
                if (!Number.isNaN(num) && num === targetSurah) return true;
              }
            }
            return false;
          };
          if (nextJuz === undefined) {
            for (const juz of juzData ?? []) {
              if (surahInJuz(juz.surah_list, nextSurah)) {
                nextJuz = juz.juz_number;
                break;
              }
            }
          }
        } catch (e) {
          console.warn("[DhorBook] Unable to resolve next Juz from juzData; leaving it undefined", e);
        }

        if (nextJuz !== undefined) {
          setSelectedJuz(nextJuz);
        }

        console.log("resolved next values:", { nextSurah, nextAyat, nextJuz });

        // Defer setting surah until surah list for the juz is loaded to avoid resets
        setPendingSurahToSelect(nextSurah);

        // Infer Quran format (13/15 line) from previous entry if possible
        // Use a simple heuristic: verses per page ~8 => 13-line; ~10 => 15-line
        let inferredQuranFormat: "13" | "15" | undefined = undefined;
        if (pagesMem && pagesMem > 0 && versesMem && versesMem > 0) {
          const versesPerPage = versesMem / pagesMem;
          // Threshold midway between 8 and 10
          inferredQuranFormat = versesPerPage >= 9 ? "15" : "13";
        }

        // Hard reset RHF values to ensure UI reflects prefill immediately
        const currentValues = form.getValues();
        const nextRHFValues = {
          ...currentValues,
          current_juz: nextJuz,
          current_surah: nextSurah,
          end_surah: nextSurah,
          quran_format: inferredQuranFormat ?? (currentValues.quran_format ?? "13"),
          start_ayat: nextAyat, // temporary until ayah options load
        } as typeof currentValues;
        console.log("applying RHF reset with:", nextRHFValues);
        form.reset(nextRHFValues);

        console.log("setting pending values:", { pendingSurahToSelect: nextSurah, pendingAyat: nextAyat });
        setPendingStartAyat(nextAyat);

        console.groupEnd();
      } catch (e) {
        console.error("[DhorBook] Unexpected error pre-filling from previous sabaq:", e);
      }
    };

    prefillFromPreviousSabaq();
    // Only on mount or when studentId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, isOpen]);

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
          onValueChange={(v: string) => setActiveTab(v as "sabaq" | "sabaq-para" | "revision" | "naz-qaida")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 bg-white border border-emerald-100 rounded-md p-1 text-gray-600">
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="sabaq">Sabaq</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="sabaq-para">Sabaq Para</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="revision">Revision</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 hover:bg-emerald-50 text-gray-700" value="naz-qaida">Nazirah & Qaida</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="current_juz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juz</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const juzNumber = parseInt(value, 10);
                        if (Number.isNaN(juzNumber)) {
                          console.warn("[DhorBook] Ignoring invalid Juz value:", value);
                          return;
                        }
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
                      <SelectContent className="max-h-[320px] overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
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
                        const surahNumber = parseInt(value, 10);
                        if (Number.isNaN(surahNumber)) {
                          console.warn("[DhorBook] Ignoring invalid Surah value:", value);
                          return;
                        }
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
                      <SelectContent className="max-h-[300px] overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
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
              <FormField
                control={form.control}
                name="end_surah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Surah</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const surahNumber = parseInt(value, 10);
                        if (Number.isNaN(surahNumber)) return;
                        field.onChange(surahNumber);
                        setEndSurah(surahNumber);
                        // Reset end ayat when end surah changes
                        form.setValue("end_ayat", undefined);
                      }}
                      value={(field.value ?? endSurah ?? form.watch("current_surah"))?.toString()}
                      disabled={!form.watch("current_surah")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select End Surah" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
                        {allSurahsData && allSurahsData.length > 0
                          ? (
                            allSurahsData
                              .filter((s) => {
                                const startSurah = form.watch("current_surah");
                                return startSurah ? s.surah_number >= startSurah : true;
                              })
                              .map((s) => (
                                <SelectItem key={`end-surah-${s.surah_number}`} value={s.surah_number.toString()}>
                                  {s.surah_number}. {s.name}
                                </SelectItem>
                              ))
                          )
                          : (
                            Array.from({ length: 114 }, (_, i) => i + 1)
                              .filter((s) => {
                                const startSurah = form.watch("current_surah");
                                return startSurah ? s >= startSurah : true;
                              })
                              .map((s) => (
                                <SelectItem key={`end-surah-${s}`} value={s.toString()}>
                                  {s}
                                </SelectItem>
                              ))
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
                        const ayatNumber = parseInt(value, 10);
                        if (Number.isNaN(ayatNumber)) {
                          console.warn("[DhorBook] Ignoring invalid Start Ayat value:", value);
                          return;
                        }
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
                        const ayatNumber = parseInt(value, 10);
                        if (Number.isNaN(ayatNumber)) {
                          console.warn("[DhorBook] Ignoring invalid End Ayat value:", value);
                          return;
                        }
                        console.log(`Selected End Ayat: ${ayatNumber}`);
                        field.onChange(ayatNumber);
                      }}
                      value={field.value?.toString()}
                      disabled={!form.watch("start_ayat")}
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
                        {(() => {
                          const startSurah = form.watch("current_surah");
                          const startAyat = form.watch("start_ayat");
                          const selectedEndSurah = form.watch("end_surah") || endSurah || startSurah;
                          if (!startSurah || !startAyat || !selectedEndSurah) {
                            return (
                              <SelectItem disabled value="no-end-ayats">
                                {form.watch("start_ayat") ? "No end ayats available" : "Select Start Ayat first"}
                              </SelectItem>
                            );
                          }
                          // Generate ayats for the selected end surah
                          const totalAyats = getTotalAyahsInSurah(selectedEndSurah);
                          const startFilter = selectedEndSurah === startSurah ? startAyat : 1;
                          return Array.from({ length: totalAyats - startFilter + 1 }, (_, i) => startFilter + i).map((ayat) => (
                            <SelectItem key={`end-${selectedEndSurah}-${ayat}`} value={ayat.toString()}>
                              {selectedEndSurah}:{ayat}
                            </SelectItem>
                          ));
                        })()}
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
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          field.onChange(undefined);
                          return;
                        }
                        const parsed = parseInt(raw, 10);
                        field.onChange(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
                      }}
                      inputMode="numeric"
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

          <TabsContent value="naz-qaida" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="naz_qaida_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nazirah">Nazirah</SelectItem>
                      <SelectItem value="qaida">Qaida</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nazirah Section */}
            {form.watch("naz_qaida_type") === "nazirah" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nazirah_juz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazirah - Juz</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const num = parseInt(value, 10);
                            if (Number.isNaN(num)) return;
                            field.onChange(num);
                            setNazSelectedJuz(num);
                            setNazSelectedSurah(null);
                            form.setValue("nazirah_surah", undefined);
                            form.setValue("nazirah_start_ayat", undefined);
                            form.setValue("nazirah_end_ayat", undefined);
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Juz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[320px] overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
                            {nazJuzData?.map((juz) => (
                              <SelectItem key={`naz-juz-${juz.id}`} value={juz.juz_number.toString()}>
                                Juz {juz.juz_number}
                              </SelectItem>
                            )) || (
                              <SelectItem disabled value="loading-juz-naz">
                                {nazJuzLoading ? "Loading Juz data..." : "No Juz data"}
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
                    name="nazirah_surah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazirah - Surah</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const num = parseInt(value, 10);
                            if (Number.isNaN(num)) return;
                            field.onChange(num);
                            setNazSelectedSurah(num);
                          }}
                          value={field.value?.toString()}
                          disabled={!nazSelectedJuz || nazJuzLoading || nazIsLoadingSurahs}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={nazJuzLoading || nazIsLoadingSurahs
                                  ? "Loading data..."
                                  : !nazSelectedJuz
                                  ? "Select Juz first"
                                  : nazSurahsInJuz.length === 0
                                  ? "No surahs found"
                                  : "Select Surah"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
                            {nazJuzLoading || nazIsLoadingSurahs
                              ? (
                                <SelectItem disabled value="loading">
                                  Loading data...
                                </SelectItem>
                              )
                              : nazSurahsInJuz && nazSurahsInJuz.length > 0
                              ? (
                                nazSurahsInJuz.map((surah) => (
                                  <SelectItem key={`naz-surah-${surah.id}`} value={surah.surah_number.toString()}>
                                    {surah.surah_number}. {surah.name}
                                  </SelectItem>
                                ))
                              )
                              : (
                                <SelectItem disabled value="none">
                                  {nazSelectedJuz ? "No surahs found for this Juz" : "Select a Juz first"}
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
                    name="nazirah_start_ayat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazirah - Start Ayat</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const num = parseInt(value, 10);
                            if (Number.isNaN(num)) return;
                            field.onChange(num);
                            form.setValue("nazirah_end_ayat", undefined);
                          }}
                          value={field.value?.toString()}
                          disabled={!nazSelectedSurah || nazAyatOptions.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={nazSelectedSurah ? "Select Ayat" : "Select Surah first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nazAyatOptions.length > 0 ? (
                              nazAyatOptions.map((ayat) => (
                                <SelectItem key={`naz-start-${ayat}`} value={ayat.toString()}>
                                  Ayat {ayat}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem disabled value="no-ayats">
                                {nazSelectedSurah ? "No ayats available" : "Select Surah first"}
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
                    name="nazirah_end_ayat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazirah - End Ayat</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const num = parseInt(value, 10);
                            if (Number.isNaN(num)) return;
                            field.onChange(num);
                          }}
                          value={field.value?.toString()}
                          disabled={!form.watch("nazirah_start_ayat") || nazAyatOptions.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!form.watch("nazirah_start_ayat") ? "Select Start Ayat first" : "Select End Ayat"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("nazirah_start_ayat") && nazAyatOptions.length > 0 ? (
                              nazAyatOptions
                                .filter((ayat) => {
                                  const startAyat = form.watch("nazirah_start_ayat");
                                  return startAyat ? ayat >= startAyat : true;
                                })
                                .map((ayat) => (
                                  <SelectItem key={`naz-end-${ayat}`} value={ayat.toString()}>
                                    Ayat {ayat}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem disabled value="no-end-ayats">
                                {form.watch("nazirah_start_ayat") ? "No end ayats available" : "Select Start Ayat first"}
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
                  name="nazirah_memorization_quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazirah - Quality</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue="average">
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
              </div>
            )}

            {/* Qaida Section */}
            {form.watch("naz_qaida_type") === "qaida" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="qaida_lesson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qaida Lesson</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "1"}
                        defaultValue="1"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lesson" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 16 }, (_, i) => (i + 1).toString()).map((val) => (
                            <SelectItem key={`qaida-lesson-${val}`} value={val}>
                              {val}
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
                  name="qaida_memorization_quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qaida - Quality</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue="average">
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
              </div>
            )}
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
