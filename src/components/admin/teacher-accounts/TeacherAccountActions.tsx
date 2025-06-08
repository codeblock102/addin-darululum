import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.tsx";
import { MoreHorizontal, Eye, Edit, UserMinus, Trash2 } from "lucide-react";
import { TeacherAccount } from "@/types/teacher.ts";

interface TeacherAccountActionsProps {
  teacher: TeacherAccount;
  onView: (teacher: TeacherAccount) => void;
  onEdit: (teacher: TeacherAccount) => void;
  onSuspend: (teacher: TeacherAccount) => void;
  onDelete: (teacher: TeacherAccount) => void;
}

export function TeacherAccountActions({
  teacher,
  onView,
  onEdit,
  onSuspend,
  onDelete,
}: TeacherAccountActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(teacher)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(teacher)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onSuspend(teacher)}
          className={teacher.status === "active" ? "text-amber-600" : "text-green-600"}
        >
          <UserMinus className="mr-2 h-4 w-4" />
          {teacher.status === "active" ? "Suspend Account" : "Reactivate Account"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(teacher)} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
