import {
  ChevronUpIcon,
  Loader2Icon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authclient } from "@/lib/auth-client";
import { guestRegex } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const UserButton = () => {
  const { data, isPending } = authclient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <Button
        className="w-full justify-start gap-2"
        data-testid="user-nav-button"
        disabled
        variant="ghost"
      >
        <Loader2Icon className="size-4 animate-spin" />
        <span>loading...</span>
      </Button>
    );
  }

  const isGuest = guestRegex.test(data?.user?.email ?? "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full justify-between gap-2 focus-visible:ring-0 focus-visible:ring-offset-0"
          data-testid="user-nav-button"
          variant="ghost"
        >
          <div className="flex items-center gap-2">
            {!isGuest && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={data?.user?.image ?? ""} />
                <AvatarFallback className="text-xs">
                  {data?.user?.email?.slice(0, 2) ?? "??"}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="truncate text-sm">
              {isGuest ? "Guest" : data?.user?.email}
            </span>
          </div>
          <ChevronUpIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        data-testid="user-nav-menu"
        side="top"
      >
        <DropdownMenuItem disabled>
          <SettingsIcon className="size-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="user-nav-item-auth"
          onClick={async () => {
            if (isPending) {
              toast.error("checking authentication status, please try again");

              return;
            }

            if (isGuest) {
              router.push("/login");
            } else {
              await authclient.signOut();
              router.push("/");
              router.refresh();
            }
          }}
        >
          <LogOutIcon className="size-4" />
          <span>{isGuest ? "Login" : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
