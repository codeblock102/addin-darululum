import * as z from "zod";

export const teacherSchema = z.object({
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

export type TeacherFormValues = z.infer<typeof teacherSchema>;
