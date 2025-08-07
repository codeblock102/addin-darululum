import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Loader2 } from "lucide-react";
import { Teacher } from "@/types/teacher.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

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
  }).optional(),
  grade: z.coerce.number().int().positive().optional().nullable(),
  section: z.string({
    required_error: "Please select a section for the teacher.",
  }),
  bio: z.string().optional().nullable(),
  createAccount: z.boolean().default(true),
  generatePassword: z.boolean().default(true),
  password: z.string().optional(),
}).superRefine((data, ctx) => {
  // If we are creating an account for the teacher
  if (data.createAccount) {
    // Email is mandatory
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email is required to create a user account.",
      });
    }
    // If we are not auto-generating a password, we must validate the manual one
    if (!data.generatePassword) {
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password must be at least 6 characters.",
        });
      }
    }
  }
});

interface TeacherDialogProps {
  selectedTeacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  madrassahId?: string;
}

export const TeacherDialog = (
  {
    selectedTeacher,
    open,
    onOpenChange,
    onClose,
    madrassahId,
  }: TeacherDialogProps,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      email: null,
      phone: null,
      subject: "",
      section: "",
      grade: null,
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
        grade: selectedTeacher.grade || null,
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
        grade: null,
        bio: null,
        createAccount: true,
        generatePassword: true,
        password: "",
      });
    }
  }, [selectedTeacher, form]);

  // Generate a random password
  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const isValidUUID = (id: string | undefined): id is string => {
    if (!id) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleSubmit = async (values: z.infer<typeof teacherSchema>) => {
    try {
      setIsSubmitting(true);

      if (selectedTeacher) {
        // --- UPDATE EXISTING TEACHER IN 'profiles' table ---
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            subject: values.subject || "",
            bio: values.bio || null,
            section: values.section,
            grade: values.grade || null,
          })
          .eq("id", selectedTeacher.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Success",
          description: "Teacher profile updated successfully!",
        });
      } else {
        // --- CREATE NEW TEACHER (triggers will handle profile creation) ---

        // CRITICAL VALIDATION: Ensure we have a valid Madrassah UUID before proceeding.
        if (!isValidUUID(madrassahId)) {
          toast({
            title: "Cannot Create Teacher",
            description:
              "A valid Madrassah ID is required. Please ensure a madrassah is selected.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (!values.createAccount || !values.email) {
          toast({
            title: "Cannot Create Profile",
            description: "An email is required to create a user account.",
            variant: "destructive",
          });
          return;
        }

        const password = values.generatePassword
          ? generateRandomPassword()
          : values.password!;

        const { data: userData, error: userError } = await supabase.auth
          .signUp({
            email: values.email,
            password: password,
            options: {
              data: {
                // These keys must match the column names in your `profiles` table
                name: values.name,
                role: "teacher",
                phone: values.phone || null,
                subject: values.subject || "",
                bio: values.bio || null,
                section: values.section,
                madrassah_id: madrassahId,
                grade: values.grade || null,
              },
            },
          });

        if (userError) {
          throw userError;
        }

        if (!userData.user) {
          throw new Error("User creation did not return a user object.");
        }

        // --- Explicitly upsert the profile to prevent race conditions with triggers ---
        const { error: profileUpsertError } = await supabase
          .from("profiles")
          .upsert({
            id: userData.user.id,
            name: values.name,
            email: values.email,
            role: 'teacher',
            phone: values.phone || null,
            subject: values.subject || "",
            bio: values.bio || null,
            section: values.section,
            madrassah_id: madrassahId,
            grade: values.grade || null,
          });

        if (profileUpsertError) {
          console.error("Error upserting profile with madrassah info:", profileUpsertError);
          toast({
            title: "User created, but failed to save profile details",
            description: "The teacher account was created, but their profile information might be incomplete. Please check and edit the teacher's profile.",
            variant: "destructive",
          });
        }
        // --- End of explicit upsert ---

        toast({
          title: "Success",
          description: values.generatePassword
            ? `Teacher and user account created! Temporary password: ${password}`
            : `Teacher and user account created!`,
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["teacher-profiles", madrassahId],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-stats"] });
      onClose();
    } catch (error: unknown) {
      const supabaseError = error as {
        message: string;
        status?: number;
        details?: string;
        hint?: string;
      };
      console.group("Supabase Error Details");
      console.error("Message:", supabaseError.message);
      if (supabaseError.status) console.error("Status:", supabaseError.status);
      if (supabaseError.details) {
        console.error("Details:", supabaseError.details);
      }
      if (supabaseError.hint) console.error("Hint:", supabaseError.hint);
      console.error("Full Error Object:", error);
      console.groupEnd();

      toast({
        title: "Error",
        description: supabaseError.message ||
          "An unexpected error occurred. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input
                          placeholder="Teacher's Email"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Teacher's Phone"
                          {...field}
                          value={field.value || ""}
                        />
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
              </div>

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Teacher's Grade"
                        type="number"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingSections && (
                          <SelectItem value="loading" disabled>
                            Loading sections...
                          </SelectItem>
                        )}
                        {sections && sections.length > 0
                          ? (
                            sections.map((section) => (
                              <SelectItem key={section} value={section}>
                                {section}
                              </SelectItem>
                            ))
                          )
                          : !isLoadingSections && (
                            <SelectItem value="no-sections" disabled>
                              No sections found
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Teacher's Bio"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Creation Fields - Only show for new teachers */}
              {!selectedTeacher && (
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
