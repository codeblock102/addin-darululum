import { Teacher } from "@/types/teacher.ts";
import { BasicInfoFields } from "./form-fields/BasicInfoFields.tsx";
import { TimeFields } from "./form-fields/TimeFields.tsx";
import { CapacityField } from "./form-fields/CapacityField.tsx";
import { useFormContext } from "react-hook-form";
import { DaysOfWeekField } from "./form-fields/DaysOfWeekField.tsx";

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
      <CapacityField />
      <DaysOfWeekField />
    </>
  );
};
