
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getInitials } from "@/utils/stringUtils";

interface SidebarUserProps {
  isAdmin: boolean;
}

export const SidebarUser = ({ isAdmin }: SidebarUserProps) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const user = session?.user;

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
    <div className={`mt-auto ${isAdmin ? "border-t border-white/10" : "border-t"} px-2 py-4`}>
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <Avatar className={`h-9 w-9 ${isAdmin ? "ring-2 ring-amber-400" : ""}`}>
          <AvatarImage alt="User avatar" />
          <AvatarFallback className={isAdmin ? "bg-amber-500 text-[#1A1F2C]" : "bg-primary text-primary-foreground"}>
            {getInitials(user?.email)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <div className="text-sm font-medium">
            {user?.email?.split("@")[0] || "User"}
          </div>
          <div className={`text-xs ${isAdmin ? "text-gray-400" : "text-muted-foreground"}`}>
            {isAdmin ? "Administrator" : "Teacher"}
          </div>
        </div>
        <Button 
          variant={isAdmin ? "outline" : "ghost"} 
          size="icon" 
          className={`ml-auto ${isAdmin ? "hover:bg-gray-800 border-gray-700" : ""}`}
          onClick={handleSignOut}
        >
          <LogOut className={`h-5 w-5 ${isAdmin ? "text-amber-400" : ""}`} />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </div>
  );
};
