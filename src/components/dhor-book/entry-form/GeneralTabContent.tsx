import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import type { UseFormReturn } from "react-hook-form";
import type { DailyActivityFormValues } from "../dhorBookValidation.ts";

interface GeneralTabContentProps {
  form: UseFormReturn<DailyActivityFormValues>;
}

export function GeneralTabContent({ form }: GeneralTabContentProps) {
  return (
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
  );
}
