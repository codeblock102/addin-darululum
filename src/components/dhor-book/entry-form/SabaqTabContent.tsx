import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { TabsContent } from "@/components/ui/tabs.tsx";
import { MemorizationQualitySelect } from "./MemorizationQualitySelect.tsx";
import type { UseFormReturn } from "react-hook-form";
import type { DailyActivityFormValues } from "../dhorBookValidation.ts";
import type { JuzData, SurahData } from "../useQuranData.ts";

interface SabaqTabContentProps {
  form: UseFormReturn<DailyActivityFormValues>;
  juzData: JuzData[];
  juzLoading: boolean;
  surahsInJuz: SurahData[];
  isLoadingSurahs: boolean;
  selectedJuz: number | null;
  selectedSurah: number | null;
  ayatOptions: number[];
  onJuzChange: (juzNumber: number) => void;
  onSurahChange: (surahNumber: number) => void;
}

export function SabaqTabContent({
  form,
  juzData,
  juzLoading,
  surahsInJuz,
  isLoadingSurahs,
  selectedJuz,
  selectedSurah,
  ayatOptions,
  onJuzChange,
  onSurahChange,
}: SabaqTabContentProps) {
  return (
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
                  field.onChange(juzNumber);
                  onJuzChange(juzNumber);
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
                  field.onChange(surahNumber);
                  onSurahChange(surahNumber);
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
      <MemorizationQualitySelect
        form={form}
        name="memorization_quality"
        label="Sabaq - Memorization Quality"
      />
    </TabsContent>
  );
}
