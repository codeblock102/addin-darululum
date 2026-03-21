import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Form } from "@/components/ui/form.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { useQuranData } from "./useQuranData.ts";
import { toast } from "@/components/ui/use-toast.ts";
import { getAyahRangeForSurahInJuz } from "@/utils/juzAyahMapping.ts";
import { calculatePages } from "@/utils/quranPageCalculation.ts";
import {
  DailyActivityFormSchema,
  DailyActivityFormValues,
} from "./dhorBookValidation.ts";
import type { DhorBookCombinedFormData } from "./useDhorEntryMutation.ts";
import {
  DatePickerField,
  SabaqTabContent,
  SabaqParaTabContent,
  DhorRevisionTabContent,
  GeneralTabContent,
  FormFooter,
} from "./entry-form/index.ts";

interface DhorBookEntryFormProps {
  onSubmit: (data: DhorBookCombinedFormData) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function DhorBookEntryForm(
  { onSubmit, isPending, onCancel }: DhorBookEntryFormProps,
) {
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
    setSelectedSurah,
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
        const ayahRange = getAyahRangeForSurahInJuz(selectedJuz, selectedSurah);
        if (ayahRange) {
          const ayatArray = Array.from(
            { length: ayahRange.endAyah - ayahRange.startAyah + 1 },
            (_, i) => ayahRange.startAyah + i,
          );
          setAyatOptions(ayatArray);
          // Reset ayat selections when surah changes
          form.setValue("start_ayat", ayahRange.startAyah);
          form.setValue("end_ayat", undefined);
          setCalculatedPages(0);
        } else {
          console.warn(
            `No ayah range found for Juz ${selectedJuz}, Surah ${selectedSurah}`,
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
    } else {
      setCalculatedPages(0);
    }
  }, [startAyah, endAyah, quranFormat]);

  function handleSubmit(data: DailyActivityFormValues) {
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
    };
    onSubmit(finalPayload);
  }

  function handleJuzChange(juzNumber: number) {
    setSelectedJuz(juzNumber);
    setSelectedSurah(null);
    form.setValue("current_surah", undefined);
    form.setValue("start_ayat", undefined);
    form.setValue("end_ayat", undefined);
  }

  function handleSurahChange(surahNumber: number) {
    setSelectedSurah(surahNumber);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 max-h-[80vh] overflow-y-auto p-1"
      >
        <DatePickerField form={form} date={date} onDateChange={setDate} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sabaq">Sabaq</TabsTrigger>
            <TabsTrigger value="sabaq-para">Sabaq Para</TabsTrigger>
            <TabsTrigger value="revision">Revision</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <SabaqTabContent
            form={form}
            juzData={juzData}
            juzLoading={juzLoading}
            surahsInJuz={surahsInJuz}
            isLoadingSurahs={isLoadingSurahs}
            selectedJuz={selectedJuz}
            selectedSurah={selectedSurah}
            ayatOptions={ayatOptions}
            onJuzChange={handleJuzChange}
            onSurahChange={handleSurahChange}
          />

          <SabaqParaTabContent
            form={form}
            juzData={juzData}
            juzLoading={juzLoading}
          />

          <DhorRevisionTabContent
            form={form}
            juzData={juzData}
            juzLoading={juzLoading}
          />

          <GeneralTabContent form={form} />
        </Tabs>

        {calculatedPages > 0 && (
          <div className="text-sm text-muted-foreground">
            Pages to memorize: {calculatedPages} pages
          </div>
        )}

        <FormFooter isPending={isPending} onCancel={onCancel} />
      </form>
    </Form>
  );
}
