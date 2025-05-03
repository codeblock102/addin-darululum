
import { Teacher } from "@/types/teacher";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { TimeFields } from "./form-fields/TimeFields";
import { CapacityAndRoomFields } from "./form-fields/CapacityAndRoomFields";
import { DaysOfWeekField } from "./form-fields/DaysOfWeekField";
import { useFormContext } from "react-hook-form";

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
      <CapacityAndRoomFields />
      <DaysOfWeekField />
    </>
  );
};
