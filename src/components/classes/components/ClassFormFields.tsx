import { Teacher } from "@/types/teacher.ts";
import { BasicInfoFields } from "./form-fields/BasicInfoFields.tsx";
import { TimeFields } from "./form-fields/TimeFields.tsx";
import { CapacityField } from "./form-fields/CapacityField.tsx";
import { useFormContext } from "react-hook-form";
import { DaysOfWeekField } from "./form-fields/DaysOfWeekField.tsx";
import { WeeklyScheduleField } from "./form-fields/WeeklyScheduleField.tsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";

interface ClassFormFieldsProps {
  teachers?: Teacher[];
}

export const ClassFormFields = ({ teachers }: ClassFormFieldsProps) => {
  // Use the parent form context
  const formContext = useFormContext();

  // Only render if form context is available
  if (!formContext) {
    return null;
  }

  return (
    <>
      <BasicInfoFields teachers={teachers} />
      <TimeFields />
      <Accordion type="single" collapsible className="rounded-md border border-gray-200 bg-white/70">
        <AccordionItem value="per-day" className="border-none">
          <AccordionTrigger className="py-2 px-2 text-sm">Per-day schedule (optional)</AccordionTrigger>
          <AccordionContent className="pt-0 pb-2 px-2">
            <WeeklyScheduleField />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <CapacityField />
      <DaysOfWeekField />
    </>
  );
};
