"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    message: "",
    preferredTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Form submitted:", formData);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center bg-card border rounded-3xl p-12">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            We've received your information and will be in touch within 24 hours to schedule your consultation call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue Learning with AI
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-6 py-3 font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Schedule Your Consultation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fill out the form below and we'll contact you within 24 hours to discuss your project and provide a personalized quote.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="John Smith"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium mb-2">
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="Smith's Bakery"
              />
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium mb-2">
                Type of Business *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              >
                <option value="">Select a category</option>
                <option value="retail">Retail / Store</option>
                <option value="restaurant">Restaurant / Cafe</option>
                <option value="services">Professional Services</option>
                <option value="healthcare">Healthcare</option>
                <option value="construction">Construction / Trades</option>
                <option value="beauty">Beauty / Salon</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Preferred Time */}
            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium mb-2">
                Preferred Call Time
              </label>
              <select
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              >
                <option value="">Select a time slot</option>
                <option value="morning">Morning (9am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 5pm)</option>
                <option value="evening">Evening (5pm - 8pm)</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Tell Us About Your Project
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none"
                placeholder="What are your goals for this website? What features are important to you?"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-medium py-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? "Submitting..." : "Schedule My Consultation"}
            </button>

            <p className="text-sm text-muted-foreground text-center">
              By submitting this form, you agree to be contacted about your project.
            </p>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-card border rounded-xl">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Quick Response</h3>
            <p className="text-sm text-muted-foreground">
              We'll contact you within 24 hours
            </p>
          </div>
          <div className="p-6 bg-card border rounded-xl">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold mb-2">Free Consultation</h3>
            <p className="text-sm text-muted-foreground">
              No obligation, just helpful advice
            </p>
          </div>
          <div className="p-6 bg-card border rounded-xl">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">Custom Quote</h3>
            <p className="text-sm text-muted-foreground">
              Pricing tailored to your needs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
