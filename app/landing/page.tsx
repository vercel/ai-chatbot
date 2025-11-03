import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Grow Your Small Business with a Professional Website
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover how an online presence can transform your business. Chat with our AI assistant to learn the benefits, then schedule a call to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Chat with AI Assistant
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-8 py-3 text-lg font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Schedule a Call
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Your Business Needs a Website
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            In today's digital world, a website is essential for business growth and credibility.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard
              title="24/7 Accessibility"
              description="Your customers can learn about your services and contact you any time, even when you're closed."
              icon="🌐"
            />
            <BenefitCard
              title="Build Credibility"
              description="A professional website establishes trust and legitimacy for your business in the eyes of potential customers."
              icon="⭐"
            />
            <BenefitCard
              title="Reach More Customers"
              description="Expand beyond your local area and attract customers who search online for services like yours."
              icon="📈"
            />
            <BenefitCard
              title="Showcase Your Work"
              description="Display your products, services, and portfolio to demonstrate your expertise and quality."
              icon="🎨"
            />
            <BenefitCard
              title="Cost-Effective Marketing"
              description="A website is one of the most affordable marketing tools with the highest ROI for small businesses."
              icon="💰"
            />
            <BenefitCard
              title="Compete with Larger Businesses"
              description="Level the playing field by having a professional online presence that rivals bigger competitors."
              icon="🚀"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/30 rounded-3xl my-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How We Work Together
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Our simple three-step process makes getting your website easy and stress-free.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Learn & Explore"
              description="Chat with our AI assistant to understand how a website can benefit your specific business and get answers to all your questions."
            />
            <StepCard
              number="2"
              title="Schedule a Call"
              description="When you're ready, book a consultation call to discuss your needs, goals, and get a personalized quote."
            />
            <StepCard
              number="3"
              title="Launch Your Site"
              description="We'll design and build your professional website, and guide you through the launch process step by step."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What You Get
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Professional websites built with modern technology and best practices.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureItem text="Mobile-responsive design that looks great on all devices" />
            <FeatureItem text="Fast loading speeds for better user experience" />
            <FeatureItem text="Search engine optimization (SEO) to help customers find you" />
            <FeatureItem text="Contact forms and call-to-action buttons" />
            <FeatureItem text="Easy content management system" />
            <FeatureItem text="Secure hosting and domain setup" />
            <FeatureItem text="Analytics to track your website visitors" />
            <FeatureItem text="Ongoing support and maintenance options" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center bg-primary/5 border-2 border-primary/20 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Grow Your Business Online?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start by chatting with our AI assistant to learn how a website can help your business, or jump straight to scheduling a consultation call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Learning Now
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-8 py-3 text-lg font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function BenefitCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
      <span className="text-lg">{text}</span>
    </div>
  );
}
