import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import Link from "next/link"

export default function Component() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground bg-zinc-900" >
          <Bot className="h-6 w-6" />
        </div>
      </div>
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-lg text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="bg-zinc-900 hover:bg-zinc-950">
        <Link href="/">Return to chat</Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        Error 404
      </p>
    </div>
  )
}