
import { UserFormData, FormErrors } from "@/types/adminUser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFormFieldsProps {
  formData: UserFormData;
  errors: FormErrors;
  isEdit: boolean;
  teachers: { id: string; name: string }[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTeacherChange: (value: string) => void;
}

export const UserFormFields = ({
  formData,
  errors,
  isEdit,
  teachers,
  handleInputChange,
  handleTeacherChange
}: UserFormFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleInputChange}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
        <Input
          id="username"
          name="username"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleInputChange}
          className={errors.username ? "border-red-500" : ""}
        />
        {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">
          Password {!isEdit && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
          value={formData.password}
          onChange={handleInputChange}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        {isEdit && (
          <p className="text-xs text-gray-500">Leave blank to keep the current password.</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="teacherId">Assign to Teacher</Label>
        <Select
          value={formData.teacherId || "none"}
          onValueChange={handleTeacherChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a teacher (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Linking a user to a teacher allows them to access the teacher portal with that teacher's data.
        </p>
      </div>
    </>
  );
};
