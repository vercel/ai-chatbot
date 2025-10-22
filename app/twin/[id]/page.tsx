"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Phone, Video, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock data - replace with real twin data fetch
const getTwinData = (id: string) => {
  return {
    id,
    name: "Glen Tullman",
    title: "CEO, Transcarent",
    tagline: "Healthcare innovation leader with 40+ years transforming patient experiences",
    image: "/images/glen-avatar.png",
    capabilities: {
      text: true,
      voice: true,
      avatar: true,
      phone: false,
    },
    bio: "Glen has built and scaled multiple healthcare technology companies, pioneering patient-centered digital health solutions. Ask about healthcare strategy, innovation, or leadership.",
  };
};

export default function TwinLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const twin = getTwinData(id);
  const [showAuth, setShowAuth] = useState(false);
  const router = useRouter();

  const handleStartConversation = () => {
    setShowAuth(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and redirect to chat
    router.push("/chat");
  };

  if (showAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <h2 className="mb-2 font-semibold text-2xl">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to continue talking with {twin.name.split(" ")[0]}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Sign in with SSO
          </Button>

          <p className="mt-6 text-center text-muted-foreground text-xs">
            Demo access • Authorized users only
          </p>

          <button
            onClick={() => setShowAuth(false)}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {twin.name.split(" ")[0]}'s page
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-medium text-primary text-sm">
          <Sparkles className="h-4 w-4" />
          Digital Twin Experience
        </div>

        {/* Twin Photo */}
        <div className="relative mb-8 h-40 w-40 overflow-hidden rounded-full border-4 border-primary/20 shadow-2xl">
          <Image
            alt={twin.name}
            className="object-cover"
            fill
            priority
            src={twin.image}
          />
        </div>

        {/* Name & Title */}
        <h1 className="mb-3 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-center font-bold text-5xl text-transparent tracking-tight md:text-6xl">
          {twin.name}
        </h1>
        <p className="mb-2 text-center text-lg text-muted-foreground">
          {twin.title}
        </p>

        {/* Tagline */}
        <p className="mb-10 max-w-2xl text-center text-muted-foreground text-xl">
          {twin.tagline}
        </p>

        {/* CTA */}
        <Button
          className="group mb-12 text-lg shadow-lg shadow-primary/20"
          onClick={handleStartConversation}
          size="xl"
        >
          Start talking to {twin.name.split(" ")[0]} now
          <MessageSquare className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
        </Button>

        {/* Capabilities */}
        <div className="flex flex-wrap justify-center gap-4">
          {twin.capabilities.text && (
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm shadow-sm">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Text Chat</span>
            </div>
          )}
          {twin.capabilities.voice && (
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm shadow-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>Voice Chat</span>
            </div>
          )}
          {twin.capabilities.avatar && (
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm shadow-sm">
              <Video className="h-4 w-4 text-primary" />
              <span>Video Avatar</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {twin.bio && (
          <div className="mt-12 max-w-2xl rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm">
            <p className="text-center text-muted-foreground leading-relaxed">
              {twin.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
