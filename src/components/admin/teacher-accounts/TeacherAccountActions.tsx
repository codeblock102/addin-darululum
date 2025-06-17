import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Edit, Eye, MoreHorizontal, ShieldCheck, Trash2, UserMinus } from "lucide-react";
import { TeacherAccount } from "@/types/teacher.ts";
import { promoteToAdmin } from "@/utils/promoteToAdmin.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";

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
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePromote = async () => {
    const { success, error } = await promoteToAdmin(teacher.id);

    if (success) {
      toast({
        title: "Success",
        description: `${teacher.name} has been promoted to Admin.`,
      });
      // Invalidate queries to refresh the user list and reflect the new role
      await queryClient.invalidateQueries({ queryKey: ["teacher-accounts"] });
    } else {
      toast({
        title: "Error",
        description: error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
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
          
          {teacher.role !== 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsPromoteDialogOpen(true)} className="text-blue-600">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Promote to Admin
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onSuspend(teacher)}
            className={teacher.status === "active"
              ? "text-amber-600"
              : "text-green-600"}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            {teacher.status === "active"
              ? "Suspend Account"
              : "Reactivate Account"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(teacher)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Promote to Admin Confirmation Dialog */}
      <AlertDialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {teacher.name} to an admin? 
              They will have full access to all data and settings for your madrassah. 
              This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} className="bg-blue-600 hover:bg-blue-700">
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
