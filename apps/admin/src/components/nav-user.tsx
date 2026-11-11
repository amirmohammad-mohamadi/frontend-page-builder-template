"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Skeleton,
  useSidebar,
} from "@components";
import { useCurrentUser, useLogout } from "@services";
import { TEXTS } from "@/texts";

/** The operator block at the bottom of the sidebar, with sign-out. */
export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout({
    onSuccess: () => {
      toast.success(TEXTS.auth.signedOut);
      router.replace("/login");
    },
  });

  if (isLoading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-12 w-full" />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{user.getInitials() || "?"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.getDisplayName()}</span>
                <span className="text-muted-foreground truncate text-xs">{user.getEmail()}</span>
              </div>
              <ChevronsUpDownIcon className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-sm font-medium">{user.getDisplayName()}</div>
              <div className="text-muted-foreground truncate text-xs">
                {user.getRoles().join(", ")}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
              <LogOutIcon />
              {TEXTS.nav.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
