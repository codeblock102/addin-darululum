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
import { Edit, Eye, KeyRound, MoreHorizontal, ShieldCheck, Trash2, UserMinus } from "lucide-react";
import { TeacherAccount } from "@/types/teacher.ts";
import { promoteToAdmin } from "@/utils/promoteToAdmin.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

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
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
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
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 shadow-lg border border-gray-200">
          <DropdownMenuItem onClick={() => onView(teacher)} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-gray-600" />
            <span className="text-gray-700">View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(teacher)} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4 text-gray-600" />
            <span className="text-gray-700">Edit Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsResetOpen(true)} className="cursor-pointer text-amber-700 hover:text-amber-800 hover:bg-amber-50">
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </DropdownMenuItem>
          
          {teacher.role !== 'admin' && (
            <>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={() => setIsPromoteDialogOpen(true)} className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Promote to Admin</span>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem
            onClick={() => onSuspend(teacher)}
            className={`cursor-pointer ${
              teacher.status === "active"
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                : "text-green-600 hover:text-green-700 hover:bg-green-50"
            }`}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            <span>
              {teacher.status === "active"
                ? "Suspend Account"
                : "Reactivate Account"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(teacher)}
            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Account</span>
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

      {/* Change Password Dialog */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new password for {teacher.name}. The user will be able to log in immediately with the new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewPassword("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!newPassword || newPassword.length < 6) return;
                try {
                  const { error } = await supabase.functions.invoke("admin-update-password", {
                    body: { userId: teacher.id, newPassword },
                  });

                  if (error) {
                    toast({ title: "Password update failed", description: (error as Error).message, variant: "destructive" });
                  } else {
                    toast({ title: "Password updated", description: `Password changed for ${teacher.name}` });
                    setIsResetOpen(false);
                    setNewPassword("");
                  }
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "Unknown error";
                  toast({ title: "Password update failed", description: message, variant: "destructive" });
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
