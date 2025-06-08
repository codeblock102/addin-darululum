import { UserFormData, FormErrors } from "@/types/adminUser.ts";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
interface UserFormFieldsProps {
  formData: UserFormData;
  errors: FormErrors;
  isEdit: boolean;
  teachers: { id: string; name: string }[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTeacherChange: (value: string) => void;
  handleRoleChange: (value: string) => void;
}

export const UserFormFields = ({
  formData,
  errors,
  isEdit,
  teachers,
  handleInputChange,
  handleTeacherChange,
  handleRoleChange
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
        <Label htmlFor="role">User Role <span className="text-red-500">*</span></Label>
        <Select
          value={formData.role || "teacher"}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select user role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Teachers can manage students and classes. Administrators have access to all system features.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="teacherId">Assign to Teacher Profile</Label>
        <Select
          value={formData.teacherId || "none"}
          onValueChange={handleTeacherChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a teacher profile (optional)" />
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
          Linking a user to a teacher profile allows them to access the teacher portal with that teacher's data.
        </p>
      </div>
    </>
  );
};
