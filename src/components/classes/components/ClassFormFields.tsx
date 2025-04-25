
import { Teacher } from "@/types/teacher";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { TimeFields } from "./form-fields/TimeFields";
import { CapacityAndRoomFields } from "./form-fields/CapacityAndRoomFields";
import { DaysOfWeekField } from "./form-fields/DaysOfWeekField";

interface ClassFormFieldsProps {
  teachers?: Teacher[];
}

export const ClassFormFields = ({ teachers }: ClassFormFieldsProps) => {
  return (
    <>
      <BasicInfoFields teachers={teachers} />
      <TimeFields />
      <CapacityAndRoomFields />
      <DaysOfWeekField />
    </>
  );
};
