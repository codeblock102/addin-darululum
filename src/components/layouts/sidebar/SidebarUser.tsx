
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface SidebarUserProps {
  isAdmin: boolean;
  isOpen?: boolean;
}

export const SidebarUser = ({ isAdmin, isOpen }: SidebarUserProps) => {
  const { currentUser, signOut } = useAuth();
  const isMobile = useIsMobile();

  if (!currentUser) return null;

  const userEmail = currentUser.email || "user@example.com";
  const userName = currentUser.user_metadata?.full_name || userEmail.split("@")[0];
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Collapsed state
  if (!isMobile && isOpen === false) {
    return (
      <div className="p-2 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full h-12 p-2 hover:bg-white/5 transition-all duration-200 group",
                "justify-center rounded-lg"
              )}
              title={userName}
            >
              <Avatar className="h-8 w-8 border-2 border-white/20 group-hover:border-white/40 transition-all duration-200">
                <AvatarFallback 
                  className={cn(
                    "text-xs font-semibold",
                    isAdmin ? "bg-amber-400 text-gray-900" : "bg-primary text-white"
                  )}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="end" 
            className="w-56 ml-2"
            sideOffset={8}
          >
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={cn(
                  "text-xs font-semibold",
                  isAdmin ? "bg-amber-400 text-gray-900" : "bg-primary text-white"
                )}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Expanded state
  return (
    <div className={cn(
      "p-3 sm:p-4",
      isAdmin ? "border-t border-white/10" : "border-t border-gray-100"
    )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-auto p-3 transition-all duration-200",
              isAdmin
                ? "hover:bg-white/5 text-white"
                : "hover:bg-gray-100/60 text-gray-700",
              "hover:shadow-sm rounded-lg"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className={cn(
                "h-10 w-10 border-2 transition-all duration-200",
                isAdmin ? "border-white/20" : "border-gray-200"
              )}>
                <AvatarFallback 
                  className={cn(
                    "text-sm font-semibold",
                    isAdmin ? "bg-amber-400 text-gray-900" : "bg-primary text-white"
                  )}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start space-y-1 flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate w-full">
                  {userName}
                </p>
                <p className={cn(
                  "text-xs leading-none truncate w-full",
                  isAdmin ? "text-gray-300" : "text-muted-foreground"
                )}>
                  {userEmail}
                </p>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-56">
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
