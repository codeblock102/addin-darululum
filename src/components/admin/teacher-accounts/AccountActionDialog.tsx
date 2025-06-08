import { useState } from "react";
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
import { TeacherAccount } from "@/types/teacher.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, Trash } from "lucide-react";

interface AccountActionDialogProps {
  teacher: TeacherAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: "suspend" | "reactivate" | "delete";
}

export function AccountActionDialog({
  teacher,
  open,
  onOpenChange,
  actionType,
}: AccountActionDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!teacher) return null;

  const handleAction = async () => {
    if (!teacher) return;

    setLoading(true);
    try {
      switch (actionType) {
        case "suspend": {
          // In a real app, this would update the user's status in the auth system
          // For this demo, we'll just simulate it
          toast({
            title: "Account suspended",
            description: `${teacher.name}'s account has been suspended.`,
            variant: "default",
          });
          break;
        }

        case "reactivate": {
          // In a real app, this would reactivate the user in the auth system
          toast({
            title: "Account reactivated",
            description: `${teacher.name}'s account has been reactivated.`,
            variant: "default",
          });
          break;
        }

        case "delete": {
          // Delete the teacher record
          const { error } = await supabase
            .from("teachers")
            .delete()
            .eq("id", teacher.id);

          if (error) throw error;

          toast({
            title: "Account deleted",
            description:
              `${teacher.name}'s account has been permanently deleted.`,
            variant: "default",
          });
          break;
        }
      }

      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["teacher-accounts"] });

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error(`Error during ${actionType} operation:`, error);
      toast({
        title: "Operation failed",
        description: `Failed to ${actionType} the account. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Dialog content based on action type
  const dialogContent = {
    suspend: {
      title: "Suspend Teacher Account",
      description:
        `Are you sure you want to suspend ${teacher?.name}'s account? They will be unable to log in until the account is reactivated.`,
      icon: <Shield className="h-6 w-6 text-amber-500" />,
      confirmText: "Suspend Account",
      confirmVariant: "default" as const,
    },
    reactivate: {
      title: "Reactivate Teacher Account",
      description:
        `Are you sure you want to reactivate ${teacher?.name}'s account? They will regain access to the system.`,
      icon: <Shield className="h-6 w-6 text-green-500" />,
      confirmText: "Reactivate Account",
      confirmVariant: "default" as const,
    },
    delete: {
      title: "Delete Teacher Account",
      description:
        `Are you sure you want to delete ${teacher?.name}'s account? This action cannot be undone, and all associated data will be permanently removed.`,
      icon: <Trash className="h-6 w-6 text-red-500" />,
      confirmText: "Delete Account",
      confirmVariant: "destructive" as const,
    },
  };

  const content = dialogContent[actionType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {content.icon}
            <AlertDialogTitle>{content.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={loading}
            className={actionType === "delete"
              ? "bg-red-600 hover:bg-red-700"
              : ""}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {content.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
