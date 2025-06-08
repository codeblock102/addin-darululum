import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  bio: z.string().optional().nullable(),
  createAccount: z.boolean().default(true),
  generatePassword: z.boolean().default(true),
  password: z.string().optional()
    .refine((val) => {
      // Password is required if createAccount is true and generatePassword is false
      if (val === undefined) return true;
      return val.length >= 6 || "Password must be at least 6 characters";
    }),
});

interface TeacherDialogProps {
  selectedTeacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const TeacherDialog = (
  { selectedTeacher, open, onOpenChange, onClose }: TeacherDialogProps,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      email: null,
      phone: null,
      subject: "",
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

  // Create a valid username from teacher name
  const createValidUsername = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, ".") // Replace spaces with dots
      .replace(/[^a-z0-9.]/g, "") // Remove any characters that aren't letters, numbers, or dots
      .trim(); // Remove any leading/trailing spaces
  };

  const handleSubmit = async (values: z.infer<typeof teacherSchema>) => {
    try {
      setIsSubmitting(true);

      // Create or update the teacher profile
      if (selectedTeacher) {
        const { error } = await supabase
          .from("teachers")
          .update({
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            subject: values.subject || "",
            bio: values.bio || null,
          })
          .eq("id", selectedTeacher.id);

        if (error) {
          console.error("Error updating teacher:", error);
          toast({
            title: "Error",
            description: error.message ||
              "Failed to update teacher. Please try again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Teacher profile updated successfully!",
        });
      } else {
        // Create new teacher profile
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .insert([{
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            subject: values.subject || "",
            bio: values.bio || null,
          }])
          .select();

        if (teacherError) {
          console.error("Error creating teacher:", teacherError);
          toast({
            title: "Error",
            description: teacherError.message ||
              "Failed to create teacher. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // If create account is enabled, create a user account
        if (values.createAccount && values.email) {
          // Generate or use provided password
          const password = values.generatePassword
            ? generateRandomPassword()
            : values.password;

          if (!password) {
            toast({
              title: "Error",
              description:
                "Password is required when creating an account with manual password.",
              variant: "destructive",
            });
            return;
          }

          const newTeacher = teacherData?.[0];

          // Create a valid username from the teacher's name
          const username = createValidUsername(values.name);

          // Create the user account
          console.log("Creating user account with:", {
            email: values.email,
            password: password.length,
            teacher_id: newTeacher?.id,
            username,
          });

          const { data: userData, error: userError } = await supabase.auth
            .signUp({
              email: values.email,
              password: password,
              options: {
                data: {
                  username: username,
                  teacher_id: newTeacher?.id,
                  role: "teacher",
                },
              },
            });

          if (userError) {
            console.error("Error creating user account:", userError);
            toast({
              title: "Warning",
              description:
                `Teacher profile created but failed to create user account: ${userError.message}`,
              variant: "destructive",
            });
          } else {
            console.log("User account created successfully:", userData);
            toast({
              title: "Success",
              description: values.generatePassword
                ? `Teacher and user account created! Username: ${username} | Temporary password: ${password}`
                : `Teacher and user account created! Username: ${username}`,
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Teacher profile created successfully!",
          });
        }
      }

      // Invalidate teacher queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["teachers-dropdown"] });

      onClose();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
                  <>
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
                            <FormLabel>Auto-generate password</FormLabel>
                            <FormDescription>
                              Automatically generate a secure password
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!generatePasswordValue && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Minimum 6 characters"
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
              </>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                )
                : (
                  "Submit"
                )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherDialog;
