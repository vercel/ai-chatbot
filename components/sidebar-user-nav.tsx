"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import type { User } from "@/lib/auth-service-client";
import { logoutClient } from "@/lib/auth-service-client";
import { getApiUrl } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

export function SidebarUserNav({
  user,
  isLoading,
}: {
  user: User;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { mutate } = useSWRConfig();

  const isGuest = user.type === "guest";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Image
                  alt={user.email ?? "Guest User"}
                  className="rounded-full"
                  height={24}
                  src={`https://avatar.vercel.sh/${user.email || "guest"}`}
                  width={24}
                />
                <span className="truncate" data-testid="user-email">
                  {isGuest ? "Guest" : user?.email || "User"}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer"
                onClick={async () => {
                  if (isLoading) {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });

                    return;
                  }

                  if (isGuest) {
                    router.push("/login");
                  } else {
                    try {
                      // Logout via Next.js API route which handles cookie clearing server-side
                      await logoutClient();

                      // Invalidate SWR cache for chat history
                      mutate(unstable_serialize(getChatHistoryPaginationKey));

                      // Verify logout by checking auth status
                      // This ensures cookies are actually cleared before navigation
                      const verifyUrl = getApiUrl("/api/auth/me");
                      const verifyResponse = await fetch(verifyUrl, {
                        credentials: "include",
                      });

                      // If we get 401, we're successfully logged out
                      // If we get 200, cookies might still be present (shouldn't happen)
                      if (verifyResponse.status === 401) {
                        // Successfully logged out - navigate to login
                        router.push("/login");
                      } else {
                        // Unexpected response - still navigate but log warning
                        console.warn("Logout verification returned unexpected status:", verifyResponse.status);
                        router.push("/login");
                      }
                    } catch (error) {
                      toast({
                        type: "error",
                        description: "Failed to sign out. Please try again.",
                      });
                    }
                  }
                }}
                type="button"
              >
                {isGuest ? "Login to your account" : "Sign out"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
