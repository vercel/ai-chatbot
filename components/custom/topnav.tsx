"use client"

import * as React from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const buildOptions: { title: string; href: string; description: string }[] = [
  {
    title: "New Project",
    href: "/build/new",
    description: "Start a new project from scratch",
  },
  {
    title: "Templates",
    href: "/build/templates",
    description: "Browse project templates",
  },
  {
    title: "Import",
    href: "/build/import",
    description: "Import an existing project",
  },
  {
    title: "Settings",
    href: "/build/settings",
    description: "Configure build settings",
  },
]

export function NavigationMenuDemo() {
  const isMobile = useIsMobile()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Home</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[250px] gap-1 p-2">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/"
                    className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/preferences"
                    className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Preferences...
                  </Link>
                </NavigationMenuLink>
              </li>
              <li className="my-1 h-px bg-border" />
              {session?.user ? (
                <>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/profile"
                        className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        {session.user.email || "Profile"}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        Log Out
                      </button>
                    </NavigationMenuLink>
                  </li>
                </>
              ) : (
                <li>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/login"
                      className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      Log In...
                    </Link>
                  </NavigationMenuLink>
                </li>
              )}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Build</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-2 p-4">
              {buildOptions.map((option) => (
                <ListItem
                  key={option.title}
                  title={option.title}
                  href={option.href}
                >
                  {option.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export default NavigationMenuDemo
