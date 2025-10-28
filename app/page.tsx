import {
  ArrowRight,
  Database,
  Lightbulb,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
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

  const benefitsIconMap = [TrendingUp, Target, Users];
  const useCasesIconMap = [Lightbulb, Users, Target, TrendingUp];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden py-16 md:py-32">
        {/* Background Video */}
        <div className="-z-10 absolute inset-0">
          <VideoLoop
            blur={6}
            mask="rounded"
            showGlen={false}
            src="/videos/glen-loop.mp4"
          />
        </div>

        {/* Overlay */}
        <div className="-z-10 absolute inset-0 bg-black/60" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl px-6 text-center">
          <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text font-bold text-5xl text-transparent tracking-tight md:text-7xl">
            {copy.landing.heroH1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {copy.landing.heroSub}
          </p>
          <Link href="/login">
            <Button className="mt-8 text-base" size="xl" type="button">
              {copy.landing.cta}
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text font-bold text-4xl text-transparent md:text-5xl">
            {copy.landing.benefitsTitle}
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            {copy.landing.benefitsSub}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
          {copy.landing.benefits.map((benefit, index) => {
            const Icon = benefitsIconMap[index];
            return (
              <div className="group relative flex flex-col rounded-2xl border border-border bg-gradient-to-br from-background to-muted/30 p-8 shadow-lg transition-all hover:border-primary/50 hover:shadow-xl" key={benefit.title}>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Icon aria-hidden="true" className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mb-3 font-bold text-xl">{benefit.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative border-border border-t py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
        <div className="container relative mx-auto px-6">
          <h2 className="mb-16 text-center font-bold text-4xl md:text-5xl">
            {copy.landing.useCasesTitle}
          </h2>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {copy.landing.useCases.map((useCase, index) => {
              const Icon = useCasesIconMap[index];
              return (
                <Card
                  className="group border-border bg-background/80 shadow-md backdrop-blur transition-all hover:border-primary/50 hover:shadow-xl"
                  key={useCase.title}
                >
                  <CardHeader className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
                      <Icon
                        aria-hidden="true"
                        className="h-6 w-6 text-primary"
                      />
                    </div>
                    <CardTitle className="text-xl font-bold">{useCase.title}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-relaxed">
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three-Up Feature Cards */}
      <section className="container mx-auto px-6 py-32">
        <h2 className="mb-6 text-center font-bold text-4xl md:text-5xl">
          {copy.landing.threeUpTitle}
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {copy.landing.threeUp.map((feature) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <Card
                className="group border-border bg-gradient-to-br from-background to-muted/20 shadow-md transition-all duration-200 hover:border-primary/50 hover:shadow-xl"
                key={feature.title}
              >
                <CardHeader className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shadow-sm transition-all group-hover:bg-primary/20 group-hover:shadow-md">
                    <Icon aria-hidden="true" className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                  <CardDescription className="mt-3 text-base leading-relaxed">
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
            <Card key={card.href} className="h-full border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  {card.label}
                </CardTitle>
                <CardDescription className="text-sm">
                  {card.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
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
