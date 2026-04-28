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
import { useI18n } from "@/contexts/I18nContext.tsx";
import { useNavigate } from "react-router-dom";

interface SidebarUserProps {
  isAdmin: boolean;
  isOpen?: boolean;
}

export const SidebarUser = ({ isAdmin, isOpen }: SidebarUserProps) => {
  const { session, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const navigate = useNavigate();

  if (!session?.user) return null;

  const userEmail = session.user.email || "user@example.com";
  const userName = session.user.user_metadata?.full_name ||
    userEmail.split("@")[0];
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Collapsed state
  if (!isMobile && isOpen === false) {
    return (
      <div className="pt-2 pb-2 px-2 border-t border-gray-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-12 p-2 hover:bg-green-50/50 transition-colors justify-center rounded-xl"
              title={userName}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold bg-[#052e16] text-white">
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
                <AvatarFallback
                  className={cn(
                    "text-xs font-semibold",
                    isAdmin
                      ? "bg-amber-400 text-gray-900"
                      : "bg-primary text-white",
                  )}
                >
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
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>{t("nav.profile", "Profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(isAdmin ? "/settings" : "/preferences")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("nav.settings", "Settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("auth.logout", "Log out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Expanded state
  return (
    <div className="pt-2 pb-3 px-3 border-t border-gray-100">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-3 hover:bg-green-50/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="text-sm font-semibold bg-[#052e16] text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-none truncate w-full">
                  {userName}
                </p>
                <p className="text-xs text-gray-400 leading-none truncate w-full mt-1">
                  {userEmail}
                </p>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mt-1">
                  {isAdmin ? "Admin" : "Teacher"}
                </span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-56">
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>{t("nav.profile", "Profile")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(isAdmin ? "/settings" : "/preferences")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("nav.settings", "Settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("auth.logout", "Log out")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
