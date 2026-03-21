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

interface DhorRevisionTabContentProps {
  form: UseFormReturn<DailyActivityFormValues>;
  juzData: JuzData[];
  juzLoading: boolean;
}

export function DhorRevisionTabContent({
  form,
  juzData,
  juzLoading,
}: DhorRevisionTabContentProps) {
  return (
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
      <MemorizationQualitySelect
        form={form}
        name="dhor_memorization_quality"
        label="Dhor - Memorization Quality"
      />
    </TabsContent>
  );
}
