import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Form } from "@/components/ui/form.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import { Teacher } from "@/types/teacher.ts";
import { teacherSchema, TeacherFormValues } from "./dialog/teacherSchema.ts";
import { PersonalInfoFields } from "./dialog/PersonalInfoFields.tsx";
import { SectionSelectField } from "./dialog/SectionSelectField.tsx";
import { AccountCreationFields } from "./dialog/AccountCreationFields.tsx";
import { useTeacherSubmit } from "./dialog/useTeacherSubmit.ts";

interface TeacherDialogProps {
  selectedTeacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  madrassahId?: string;
}

export const TeacherDialog = ({
  selectedTeacher,
  open,
  onOpenChange,
  onClose,
  madrassahId,
}: TeacherDialogProps) => {
  const { toast } = useToast();

  const { data: sections, isLoading: isLoadingSections } = useQuery({
    queryKey: ["sections", madrassahId],
    queryFn: async (): Promise<string[]> => {
      if (!madrassahId) return [];
      const { data, error } = await supabase
        .from("madrassahs")
        .select("section")
        .eq("id", madrassahId)
        .single();

      if (error) {
        console.error("Error fetching sections from madrassah:", error);
        toast({
          title: "Error fetching sections",
          description: "Could not load the list of available sections.",
          variant: "destructive",
        });
        return [];
      }
      return data?.section || [];
    },
    enabled: !!madrassahId,
  });

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      email: null,
      phone: null,
      subject: "",
      section: "",
      bio: null,
      createAccount: true,
      generatePassword: true,
      password: "",
    },
  });

  const createAccountValue = form.watch("createAccount");
  const generatePasswordValue = form.watch("generatePassword");

  // Set default values when selected teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      form.reset({
        name: selectedTeacher.name || "",
        email: selectedTeacher.email || null,
        phone: selectedTeacher.phone || null,
        subject: selectedTeacher.subject || "",
        section: selectedTeacher.section || "",
        bio: selectedTeacher.bio || null,
        createAccount: false, // Don't create account when editing
        generatePassword: true,
        password: "",
      });
    } else {
      form.reset({
        name: "",
        email: null,
        phone: null,
        subject: "",
        section: "",
        bio: null,
        createAccount: true,
        generatePassword: true,
        password: "",
      });
    }
  }, [selectedTeacher, form]);

  const { handleSubmit, isSubmitting } = useTeacherSubmit({
    selectedTeacher,
    madrassahId,
    onClose,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>
            {selectedTeacher ? "Edit Teacher" : "Add Teacher"}
          </DialogTitle>
          <DialogDescription>
            {selectedTeacher
              ? "Update teacher details."
              : "Enter information for the new teacher."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mx-6 px-6">
          <Form {...form}>
            <form id="teacher-form" className="space-y-4">
              <PersonalInfoFields form={form} />
              <SectionSelectField
                form={form}
                sections={sections}
                isLoadingSections={isLoadingSections}
              />
              {!selectedTeacher && (
                <AccountCreationFields
                  form={form}
                  createAccountValue={createAccountValue}
                  generatePasswordValue={generatePasswordValue}
                />
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="teacher-form"
            disabled={isSubmitting}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {isSubmitting
              ? <Loader2 className="animate-spin mr-2" />
              : selectedTeacher
              ? "Update Teacher"
              : "Create Teacher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherDialog;
