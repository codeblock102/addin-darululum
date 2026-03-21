import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { TeacherFormValues } from "./teacherSchema.ts";

interface AccountCreationFieldsProps {
  form: UseFormReturn<TeacherFormValues>;
  createAccountValue: boolean;
  generatePasswordValue: boolean;
}

export const AccountCreationFields = ({
  form,
  createAccountValue,
  generatePasswordValue,
}: AccountCreationFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="createAccount"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Create user account</FormLabel>
              <FormDescription>
                Automatically create a user account for this teacher
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {createAccountValue && (
        <FormField
          control={form.control}
          name="generatePassword"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Generate Random Password</FormLabel>
                <FormDescription>
                  A secure password will be generated automatically.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      )}

      {createAccountValue && !generatePasswordValue && (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter a password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
