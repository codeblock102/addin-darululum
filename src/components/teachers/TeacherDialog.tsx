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
import { Loader2, Eye, EyeOff, Copy, KeyRound } from "lucide-react";
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
  attendance_taker: z.boolean().default(false),
  capabilities: z.array(z.string()).default([]),
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
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: sections, isLoading: isLoadingSections } = useQuery({
    queryKey: ["sections", madrassahId],
    queryFn: async (): Promise<string[]> => {
      if (!madrassahId) return [];
      const { data, error } = await supabase
        .from("madrassahs")
        .select("section")
        .eq("id", madrassahId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching sections from madrassah:", error);
        // For unexpected errors, notify; 0-rows are handled by maybeSingle() with data = null
        toast({
          title: "Error fetching sections",
          description: "Could not load the list of available sections.",
          variant: "destructive",
        });
        return [];
      }
      if (!data) return [];
      return data.section || [];
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
      attendance_taker: false,
      capabilities: [],
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
      const existingCapabilities = (Array.isArray((selectedTeacher as unknown as { capabilities?: unknown }).capabilities)
        ? ((selectedTeacher as unknown as { capabilities: string[] }).capabilities)
        : [])
        .slice();

      form.reset({
        name: selectedTeacher.name || "",
        email: selectedTeacher.email || null,
        phone: selectedTeacher.phone || null,
        subject: selectedTeacher.subject || "",
        section: selectedTeacher.section || "",
        grade: selectedTeacher.grade || null,
        bio: selectedTeacher.bio || null,
        attendance_taker: false,
        capabilities: existingCapabilities,
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
        attendance_taker: false,
        capabilities: [],
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

  const handleCopyPassword = async () => {
    if (!newPwd) return;
    try {
      await navigator.clipboard.writeText(newPwd);
      setCopied(true);
      toast({ title: "Copied", description: "Password copied to clipboard." });
      setTimeout(() => setCopied(false), 1500);
    } catch (_err) {
      toast({ title: "Copy failed", description: "Couldn't copy to clipboard.", variant: "destructive" });
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedTeacher || !newPwd || newPwd.length < 6) return;
    setChangingPwd(true);
    try {
      const { error } = await supabase.functions.invoke("admin-update-password", {
        body: { userId: selectedTeacher.id, newPassword: newPwd },
      });
      if (error) throw new Error(error.message || "Failed to update password");
      toast({ title: "Password updated", description: `Password changed for ${selectedTeacher.name}` });
      setNewPwd("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Password update failed", description: message, variant: "destructive" });
    } finally {
      setChangingPwd(false);
    }
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
            capabilities: values.capabilities,
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

        // CRITICAL VALIDATION: Ensure we have a valid Dār Al-Ulūm Montréal UUID before proceeding.
        if (!isValidUUID(madrassahId)) {
          toast({
            title: "Cannot Create Teacher",
            description:
              "A valid Dār Al-Ulūm Montréal ID is required. Please ensure a Dār Al-Ulūm Montréal is selected.",
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
                capabilities: values.capabilities,
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
            capabilities: values.capabilities,
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

      // Invalidate queries so the new/updated teacher appears immediately
      queryClient.invalidateQueries({ queryKey: ["profiles", madrassahId, "role", "teacher"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] }); // safety net for any profiles lists
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

              {/* Attendance access is managed via capabilities (attendance_access) */}

              <FormField
                control={form.control}
                name="capabilities"
                render={({ field }) => (
                  <FormItem className="rounded-md border p-4">
                    <FormLabel>Capabilities</FormLabel>
                    <FormDescription>
                      Enable specific features for this teacher
                    </FormDescription>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "attendance_access", label: "Attendance access" },
                        { key: "progress_access", label: "Access Progress Book" },
                        { key: "assignments_access", label: "Access Assignments" },
                        { key: "daily_progress_email", label: "Send Daily Progress Emails" },
                      ].map((cap) => {
                        const checked = Array.isArray(field.value) && field.value.includes(cap.key);
                        return (
                          <label key={cap.key} className="flex items-center space-x-2">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(val) => {
                                const current = Array.isArray(field.value) ? field.value : [];
                                const next = val
                                  ? [...current.filter((c: string) => c !== cap.key), cap.key]
                                  : current.filter((c: string) => c !== cap.key);
                                field.onChange(next);
                              }}
                            />
                            <span className="text-sm">{cap.label}</span>
                          </label>
                        );
                      })}
                    </div>
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

              {/* Password Reset - Only show when editing an existing teacher */}
              {selectedTeacher && (
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    <span className="font-medium">Reset Password</span>
                  </div>
                  <div>
                    <Input
                      id="admin-new-password"
                      type={showPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
                        onClick={() => {
                          const pwd = generateRandomPassword();
                          setNewPwd(pwd);
                          setShowPwd(true);
                        }}
                      >
                        Generate
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
                        onClick={handleCopyPassword}
                        disabled={!newPwd}
                      >
                        <Copy className="mr-1 h-4 w-4" /> {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
                        onClick={() => setShowPwd((s) => !s)}
                      >
                        {showPwd ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />} {showPwd ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
                      onClick={handlePasswordChange}
                      disabled={changingPwd || !newPwd || newPwd.length < 6}
                    >
                      {changingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save New Password
                    </button>
                  </div>
                </div>
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
