
import { UserFormData } from "@/types/adminUser";

export const validateUserForm = (formData: UserFormData, isEdit: boolean): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  if (!formData.username.trim()) {
    errors.username = "Username is required";
  }
  
  if (!isEdit && !formData.password.trim()) {
    errors.password = "Password is required for new users";
  } else if (!isEdit && formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  
  return errors;
};
