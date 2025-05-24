"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Pin,
  Repeat2,
  Quote,
  Server,
  Settings2,
  History,
  LogOut,
  MessageCircle,
  PlusIcon,
  User,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function AppCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const navItems = [
    {
      title: "Chat",
      url: "/",
      icon: MessageCircle,
      shortcut: "⌘1",
    },
    {
      title: "Tasks", 
      url: "/tasks",
      icon: Repeat2,
      shortcut: "⌘2",
    },
    {
      title: "Prompt",
      url: "/prompt", 
      icon: Quote,
      shortcut: "⌘3",
      beta: true,
    },
    {
      title: "MCP Client",
      url: "/mcp-client",
      icon: Server,
      shortcut: "⌘4",
    },
  ]

  const quickActions = [
    {
      title: "New Chat",
      action: () => {
        router.push("/")
        router.refresh()
      },
      icon: PlusIcon,
      shortcut: "⌘N",
    },
  ]

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem
                key={item.url}
                onSelect={() => runCommand(() => router.push(item.url))}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.beta && (
                  <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900 px-1 rounded">
                    β
                  </span>
                )}
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.title}
                onSelect={() => runCommand(action.action)}
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.title}</span>
                <CommandShortcut>{action.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </CommandItem>
          </CommandGroup>

          {session && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/settings"))}
                  className="flex items-center gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  <span>Settings</span>
                  <CommandShortcut>⌘,</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/reporting"))}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                  <CommandShortcut>⌘H</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => signOut())}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                  <CommandShortcut>⌘Q</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
