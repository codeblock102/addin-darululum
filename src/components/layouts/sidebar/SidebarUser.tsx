import { useAuth } from "@/hooks/use-auth.ts";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "@/components/ui/use-toast.ts";
import { getInitials } from "@/utils/stringUtils.ts";
import { cn } from "@/lib/utils.ts";

interface SidebarUserProps {
  isAdmin: boolean;
  isOpen?: boolean;
}

export const SidebarUser = ({ isAdmin, isOpen }: SidebarUserProps) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const user = session?.user;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not sign out. Please try again.",
      });
    }
  };

  return (
    <div
      className={cn(
        "mt-auto",
        isAdmin ? "border-t border-white/5" : "border-t",
        isOpen === false ? "px-1 py-2 sm:px-2 sm:py-4" : "px-4 py-4",
      )}
    >
      <div
        className={cn(
          "flex items-center rounded-lg",
          isOpen === false
            ? "justify-center gap-1 sm:gap-2"
            : "gap-3 px-2 py-2",
        )}
      >
        <Avatar
          className={cn(
            "h-9 w-9 sm:h-10 sm:w-10",
            isAdmin ? "ring-1 sm:ring-2 ring-amber-500/50" : "",
          )}
        >
          <AvatarImage alt="User avatar" />
          <AvatarFallback
            className={isAdmin
              ? "bg-amber-500 text-[#121827] font-semibold"
              : "bg-primary text-primary-foreground"}
          >
            {getInitials(user?.email)}
          </AvatarFallback>
        </Avatar>
        {isOpen !== false && (
          <div className="transition-opacity duration-300">
            <div
              className={`text-sm font-medium ${isAdmin ? "text-white" : ""}`}
            >
              {user?.email?.split("@")[0] || "User"}
            </div>
            <div
              className={`text-xs ${
                isAdmin ? "text-amber-400" : "text-muted-foreground"
              }`}
            >
              {isAdmin ? "Administrator" : "Teacher"}
            </div>
          </div>
        )}
        <Button
          variant={isAdmin ? "ghost" : "ghost"}
          size="icon"
          className={cn(
            "transition-all duration-300",
            isAdmin ? "hover:bg-white/10 text-white" : "hover:bg-gray-100",
            isOpen === false ? "" : "ml-auto",
          )}
          onClick={handleSignOut}
          title="Log out"
        >
          <LogOut className={cn("h-5 w-5", isAdmin ? "text-amber-400" : "")} />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </div>
  );
};
