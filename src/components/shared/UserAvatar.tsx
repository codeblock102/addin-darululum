
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export const UserAvatar = ({ isTeacher }: { isTeacher: boolean }) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const user = session?.user;

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split("@")[0].split(".");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account"
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not sign out. Please try again."
      });
    }
  };

  return (
    <div className="p-2">
      <div className="flex items-center gap-3 rounded-lg p-3 bg-accent/50 backdrop-blur-sm transition-all hover:bg-accent">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 ring-2 ring-border transition-all">
                  <AvatarImage alt="User avatar" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isTeacher ? "Teacher" : "Administrator"}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/account")}>
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/preferences")}>
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
