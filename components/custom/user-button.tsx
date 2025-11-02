import { Loader2Icon } from "lucide-react";
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
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const UserButton = () => {
  const { data, isPending } = authclient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <Button
        data-testid="user-nav-button"
        disabled
        size="icon"
        variant="ghost"
      >
        <Loader2Icon className="size-4 animate-spin" />
      </Button>
    );
  }

  const isGuest = guestRegex.test(data?.user?.email ?? "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-testid="user-nav-button" size="icon" variant="ghost">
          <Avatar>
            <AvatarImage src={data?.user?.image ?? ""} />
            <AvatarFallback>
              {data?.user?.email?.slice(0, 2) ?? "??"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-popper-anchor-width)"
        data-testid="user-nav-menu"
        side="top"
      >
        <DropdownMenuItem asChild data-testid="user-nav-item-auth">
          <button
            className="w-full cursor-pointer"
            onClick={async () => {
              if (isPending) {
                toast({
                  type: "error",
                  description:
                    "checking authentication status, please try again",
                });

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
            type="button"
          >
            {isGuest ? "Login" : "Sign out"}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
