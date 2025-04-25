import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Teacher } from "@/types/teacher";
import { hasPermission } from "@/utils/roleUtils";

const teacherSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }).optional().nullable(),
  phone: z.string().optional().nullable(),
  subject: z.string().min(2, {
    message: "Subject must be at least 2 characters.",
  }),
  experience: z.string().min(2, {
    message: "Experience must be at least 2 characters.",
  }),
  bio: z.string().optional().nullable(),
});

interface TeacherFormValues extends z.infer<typeof teacherSchema> {}

interface TeacherDialogProps {
  selectedTeacher: Teacher | null;
}

export const TeacherDialog = ({ selectedTeacher }: TeacherDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: selectedTeacher
      ? {
          name: selectedTeacher.name,
          email: selectedTeacher.email || null,
          phone: selectedTeacher.phone || null,
          subject: selectedTeacher.subject,
          experience: selectedTeacher.experience,
          bio: selectedTeacher.bio || null,
        }
      : {
          name: "",
          email: null,
          phone: null,
          subject: "",
          experience: "",
          bio: null,
        },
  });

  const handleSubmit = async (values: TeacherFormValues) => {
    try {
      const hasCreatePermission = await hasPermission('manage_teachers');
      if (!hasCreatePermission) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to create or edit teachers.",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      if (selectedTeacher) {
        const { data, error } = await supabase
          .from("teachers")
          .update(values)
          .eq("id", selectedTeacher.id)
          .select();

        if (error) {
          console.error("Error updating teacher:", error);
          toast({
            title: "Error",
            description:
              error.message || "Failed to update teacher. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Teacher updated successfully!",
          });
        }
      } else {
        const { data, error } = await supabase
          .from("teachers")
          .insert([values])
          .select();

        if (error) {
          console.error("Error creating teacher:", error);
          toast({
            title: "Error",
            description:
              error.message || "Failed to create teacher. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Teacher created successfully!",
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher's Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher's Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher's Phone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher's Subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher's Experience" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher's Bio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};

export default TeacherDialog;
