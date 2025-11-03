# Customization Checklist

Use this checklist to personalize the website for your business.

## 🎨 Branding & Identity

### Company Information
- [ ] Update company name in `app/(landing)/layout.tsx` (line 21, 65, 77)
- [ ] Update company name in `app/(landing)/page.tsx` (hero section)
- [ ] Update metadata title in `app/layout.tsx` (line 10-13)
- [ ] Replace "WebBuilder Pro" with your business name throughout

### Contact Information
- [ ] Update email address in `app/(landing)/layout.tsx` footer (line 79)
- [ ] Update phone number in `app/(landing)/layout.tsx` footer (line 80)
- [ ] Update your actual contact details for customer inquiries

### Logo
- [ ] Add your logo file to `/public/images/`
- [ ] Update header in `app/(landing)/layout.tsx` to use logo image
- [ ] Update favicon in `app/favicon.ico`

## 🎨 Visual Customization

### Colors
Edit `app/globals.css` to match your brand:
- [ ] Primary color (buttons, links, accents)
- [ ] Background colors
- [ ] Text colors
- [ ] Border colors

Example:
```css
:root {
  --primary: YOUR_COLOR_HERE;
  --primary-foreground: YOUR_TEXT_COLOR_HERE;
}
```

### Fonts
- [ ] Update font choices in `app/layout.tsx` if desired
- [ ] Currently using Geist and Geist Mono (clean, modern)

## 📝 Content Updates

### Landing Page (`app/(landing)/page.tsx`)

#### Hero Section (lines 10-30)
- [ ] Customize headline to match your value proposition
- [ ] Update subheading to describe your services
- [ ] Adjust CTA button text if needed

#### Benefits Section (lines 35-77)
- [ ] Review 6 benefits - modify to match your focus
- [ ] Update descriptions to reflect your services
- [ ] Change icons/emojis if desired

#### How It Works (lines 80-111)
- [ ] Customize the 3-step process
- [ ] Update descriptions to match your workflow
- [ ] Adjust step numbers/process if needed

#### Features Section (lines 114-139)
- [ ] Update the 8 features list
- [ ] Add/remove features based on what you offer
- [ ] Emphasize your unique selling points

#### CTA Section (lines 142-170)
- [ ] Customize final call-to-action messaging
- [ ] Update encouragement text

### Contact Page (`app/(landing)/contact/page.tsx`)

#### Form Fields (lines 110-217)
- [ ] Review form fields - add/remove as needed
- [ ] Update business type dropdown options (lines 174-182)
- [ ] Adjust preferred time slots (lines 193-197)
- [ ] Customize placeholder text

#### Success Message (lines 44-66)
- [ ] Update thank you message
- [ ] Adjust response time promise (currently "24 hours")
- [ ] Customize next steps messaging

#### Info Cards (lines 251-273)
- [ ] Update quick info cards at bottom
- [ ] Adjust promises (response time, free consultation, etc.)

## 🤖 AI Chatbot Customization

### System Prompt (`lib/ai/prompts.ts`, lines 40-68)

- [ ] Review and adjust the educational focus
- [ ] Add your specific service offerings
- [ ] Include your unique value propositions
- [ ] Add any industry-specific expertise you have
- [ ] Adjust tone to match your brand voice
- [ ] Add information about your pricing approach (if transparent)
- [ ] Include any guarantees or warranties you offer

### Suggested Customizations:
```typescript
// Add your specific services:
- Custom designs tailored to your industry
- E-commerce integration
- SEO optimization packages
- Monthly maintenance plans

// Add your experience:
- "I've been building websites for [X] years"
- "I specialize in [your niche]"
- "I've helped [number] businesses like yours"

// Add your pricing approach:
- "Packages starting at $XXX"
- "Custom quotes based on your needs"
- "Payment plans available"
```

## 📧 Form Submission Setup

### Connect to Email Service

Choose one option:

#### Option 1: API Route + Email Service (Recommended)
1. [ ] Create `app/api/contact/route.ts`
2. [ ] Install email package: `pnpm add resend` or `pnpm add @sendgrid/mail`
3. [ ] Add email API key to `.env.local`
4. [ ] Update form submission in `app/(landing)/contact/page.tsx`

Example with Resend:
```typescript
// app/api/contact/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const data = await request.json();
  
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'your-email@example.com',
    subject: 'New Website Consultation Request',
    html: `<h2>New Lead: ${data.name}</h2>
           <p><strong>Email:</strong> ${data.email}</p>
           <p><strong>Phone:</strong> ${data.phone}</p>
           <p><strong>Business:</strong> ${data.businessName}</p>
           <p><strong>Type:</strong> ${data.businessType}</p>
           <p><strong>Message:</strong> ${data.message}</p>`
  });
  
  return Response.json({ success: true });
}
```

#### Option 2: Form Service (Easier)
1. [ ] Sign up for Formspree, Tally, or TypeForm
2. [ ] Replace form submission with service endpoint
3. [ ] Update form action URL

#### Option 3: Database Storage
1. [ ] Add `consultations` table to database schema
2. [ ] Create mutation to save form data
3. [ ] Add admin view to see submissions

## 🔧 Technical Setup

### Environment Variables (`.env.local`)
- [ ] `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `POSTGRES_URL` - Your database connection string
- [ ] `AI_GATEWAY_API_KEY` - For non-Vercel deployments
- [ ] Email service API key (if using email integration)
- [ ] Any other third-party API keys

### Database
- [ ] Run migrations: `pnpm db:migrate`
- [ ] Verify database connection
- [ ] Test chat functionality

### AI Models
- [ ] Configure AI model preferences in `lib/ai/models.ts`
- [ ] Test chatbot responses
- [ ] Adjust temperature/parameters if needed

## 📱 Mobile Testing
- [ ] Test landing page on mobile devices
- [ ] Test contact form on mobile
- [ ] Test chatbot interface on mobile
- [ ] Verify responsive design works correctly
- [ ] Check navigation menu on mobile

## 🚀 Pre-Launch Checklist

### Content Review
- [ ] Proofread all text for typos
- [ ] Verify all links work
- [ ] Test form submission
- [ ] Test chatbot conversations
- [ ] Review SEO meta descriptions

### Technical Review
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify mobile responsiveness
- [ ] Check page load speeds
- [ ] Test authentication flow
- [ ] Verify all environment variables are set

### Legal & Compliance
- [ ] Add privacy policy page (if collecting personal data)
- [ ] Add terms of service (if needed)
- [ ] Ensure form consent language is present
- [ ] Review GDPR/privacy compliance if needed

### Analytics & Tracking (Optional)
- [ ] Add Google Analytics
- [ ] Set up conversion tracking
- [ ] Add Facebook Pixel (if using FB ads)
- [ ] Configure goal tracking

## 📊 Post-Launch

### Monitor & Optimize
- [ ] Track contact form submissions
- [ ] Review chatbot conversations
- [ ] Analyze traffic sources
- [ ] A/B test headlines and CTAs
- [ ] Gather user feedback

### Marketing
- [ ] Share website on social media
- [ ] Add website to business listings
- [ ] Update email signature with website link
- [ ] Create Google Business Profile
- [ ] Request reviews from clients

---

## Quick Start Order

1. ✅ Update company name and contact info
2. ✅ Customize landing page content
3. ✅ Personalize chatbot system prompt
4. ✅ Set up form submission (email/database)
5. ✅ Update colors and branding
6. ✅ Test everything on mobile
7. ✅ Deploy to production

**Estimated Setup Time: 2-4 hours** ⏰

Need help? Refer to `WEBBUILDER_SETUP.md` for detailed instructions!
