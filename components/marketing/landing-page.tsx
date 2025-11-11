import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold">Your App</div>
          <nav className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signin">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to Your App
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          A powerful platform built with Next.js and modern technologies.
          Get started today and experience the future.
        </p>
        <div className="flex gap-4">
          <Link href="/signin">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 text-xl font-semibold">Feature One</h3>
              <p className="text-muted-foreground">
                Description of the first key feature that makes your app great.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 text-xl font-semibold">Feature Two</h3>
              <p className="text-muted-foreground">
                Description of the second key feature that makes your app great.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 text-xl font-semibold">Feature Three</h3>
              <p className="text-muted-foreground">
                Description of the third key feature that makes your app great.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Your App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

