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
import type { JuzData } from "../useQuranData.ts";

interface SabaqParaTabContentProps {
  form: UseFormReturn<DailyActivityFormValues>;
  juzData: JuzData[];
  juzLoading: boolean;
}

export function SabaqParaTabContent({
  form,
  juzData,
  juzLoading,
}: SabaqParaTabContentProps) {
  return (
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
      <MemorizationQualitySelect
        form={form}
        name="sabaq_para_memorization_quality"
        label="Sabaq Para - Memorization Quality"
      />
    </TabsContent>
  );
}
