import Link from "next/link";
import { getTranslations } from 'next-intl/server';

import { auth, signOut } from "@/app/[locale]/(auth)/auth";

import { History } from "./history";
import { LocaleDropdown } from "./locale-dropdown";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = async () => {
  let session = await auth();
  const globals = await getTranslations('globals');
  const content = await getTranslations('content');

  return (
    <>
      <div className="bg-background absolute top-0 left-0 w-dvw py-2 px-3 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-3 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-2 items-center">
            <div className="text-sm dark:text-zinc-300">
              <Link href="/">
                { globals('site_title') }
              </Link>
            </div>
          </div>
        </div>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="py-1.5 px-2 h-fit font-normal"
                variant="secondary"
              >
                {session.user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuItem className="p-1 z-50">
                <form
                  className="w-full"
                  action={async () => {
                    "use server";

                    await signOut({
                      redirectTo: "/",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full text-left px-1 py-0.5 text-red-500"
                  >
                    { content('log_out') }
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div>
            <LocaleDropdown/>
            <Button className="py-1.5 px-2 h-fit font-normal" asChild>
              <Link href="/login">{ content('log_in') }</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};