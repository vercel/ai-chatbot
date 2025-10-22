import {
  ArrowRight,
  Database,
  MessageSquare,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import VideoLoop from "@/components/VideoLoop";
import { copy } from "@/lib/copy";

export default function LandingPage() {
  const iconMap = {
    database: Database,
    message: MessageSquare,
    shield: Shield,
  } as const;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="-z-10 absolute inset-0">
          <VideoLoop blur={16} mask="rounded" src="/videos/placeholder.mp4" />
        </div>

        {/* Gradient Overlay */}
        <div className="-z-10 absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl px-6 text-center">
          <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text font-bold text-5xl text-transparent tracking-tight md:text-7xl">
            {copy.landing.heroH1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {copy.landing.heroSub}
          </p>
          <Link href="/chat">
            <Button className="mt-8 text-base" size="lg" type="button">
              {copy.landing.cta}
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Three-Up Feature Cards */}
      <section className="container mx-auto px-6 py-24">
        <h2 className="mb-4 text-center font-semibold text-3xl md:text-4xl">
          {copy.landing.threeUpTitle}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.landing.threeUp.map((feature) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <Card
                className="border-border transition-all duration-200 hover:border-primary/50"
                key={feature.title}
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Platform Section */}
      <section className="container mx-auto border-border border-t px-6 py-24">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-medium text-primary text-sm">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Platform Architecture
          </div>
          <h2 className="font-semibold text-3xl md:text-4xl">
            {copy.landing.platformTitle}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {copy.landing.platformSub}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.landing.platformCards.map((card) => (
            <Link href={card.href} key={card.href}>
              <Card className="group h-full cursor-pointer border-border transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg transition-colors group-hover:text-primary">
                    {card.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-2 inline-block h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Extend the Model Section (Optional Teaser) */}
      <section className="container mx-auto border-border border-t px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-semibold text-2xl md:text-3xl">
            Extend the model
          </h2>
          <p className="mt-4 text-muted-foreground">
            Glen AI demonstrates what's possible. Create twins for executives,
            advisors, or domain experts — each with tailored knowledge, voice,
            and access controls.
          </p>
          <Link href="/twins">
            <Button className="mt-8" size="lg" type="button" variant="outline">
              Explore Twins
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          {copy.landing.footerText}
        </div>
      </footer>
    </div>
  );
}
