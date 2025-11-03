# WebBuilder Pro - Small Business Website Consultation Platform

A professional website that combines a landing page with an AI-powered chatbot to help small business owners learn about the benefits of having an online presence, and schedule consultation calls for website development services.

## 🎯 Features

### Landing Page (`/`)
- **Hero Section**: Compelling headline and clear call-to-action buttons
- **Benefits Section**: 6 key benefits of having a website for small businesses
- **How It Works**: 3-step process (Learn → Schedule → Launch)
- **Features Section**: List of what clients get with your service
- **Professional Navigation**: Clean header with links to Chat and Contact
- **Footer**: Company info and quick links

### Contact Page (`/contact`)
- **Consultation Request Form**: Captures:
  - Name, Email, Phone
  - Business Name and Type
  - Preferred Call Time
  - Project Description
- **Form Validation**: All required fields validated
- **Success State**: Thank you message with next steps
- **Quick Info Cards**: Response time, free consultation, custom quote info

### AI Chatbot (`/chat`)
- **Specialized Education**: Custom system prompt focused on:
  - Benefits of website ownership for small businesses
  - Common questions and concerns
  - Industry-specific examples
  - Guidance toward scheduling consultations
- **Real-time Chat**: Powered by AI SDK with multiple model support
- **User-Friendly**: Non-technical language, empathetic responses
- **Lead Generation**: Encourages users to book consultation when ready

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- A database (Neon Postgres recommended)
- AI API keys (xAI/OpenAI/other providers)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd ai-chatbot
   pnpm install
   ```

2. **Set Up Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Authentication
   AUTH_SECRET="your-secret-key-here"
   
   # Database (Neon Postgres)
   POSTGRES_URL="your-postgres-connection-string"
   
   # AI Models (using Vercel AI Gateway)
   # For Vercel deployments, authentication is automatic via OIDC
   # For non-Vercel deployments:
   AI_GATEWAY_API_KEY="your-gateway-api-key"
   ```

3. **Set Up Database**
   ```bash
   pnpm db:migrate
   ```

4. **Run Development Server**
   ```bash
   pnpm dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
app/
├── (landing)/              # Public marketing pages
│   ├── layout.tsx         # Navigation header + footer
│   ├── page.tsx           # Main landing page
│   └── contact/
│       └── page.tsx       # Contact/consultation form
├── (chat)/                # Protected chat interface
│   ├── page.tsx           # New chat page
│   ├── layout.tsx         # Chat layout with sidebar
│   └── chat/[id]/
│       └── page.tsx       # Individual chat page
└── (auth)/                # Authentication pages
    ├── login/
    └── register/

lib/
├── ai/
│   └── prompts.ts         # Custom system prompt for business consultation
├── db/                    # Database queries and schema
└── utils.ts              # Utility functions

components/                # Reusable UI components
```

## 🎨 Customization

### Update Branding
1. **Company Name**: Change "WebBuilder Pro" in:
   - `app/(landing)/layout.tsx` (header)
   - `app/(landing)/page.tsx` (hero section)
   - `app/layout.tsx` (metadata)

2. **Contact Information**: Update in:
   - `app/(landing)/layout.tsx` (footer)
   - Form submission handling in `app/(landing)/contact/page.tsx`

3. **Colors & Styling**: 
   - Uses Tailwind CSS with shadcn/ui components
   - Customize theme in `app/globals.css`
   - Primary color variables can be adjusted for brand colors

### Customize AI Chatbot
Edit `lib/ai/prompts.ts` to adjust the system prompt:
- Add industry-specific knowledge
- Include your unique service offerings
- Adjust tone and personality
- Add specific pricing ranges or packages

### Form Submission
Currently, the contact form logs data to console. To connect to a real backend:

1. **Option 1: Email Service** (e.g., SendGrid, Resend)
   ```typescript
   // In app/(landing)/contact/page.tsx
   const response = await fetch('/api/contact', {
     method: 'POST',
     body: JSON.stringify(formData),
   });
   ```

2. **Option 2: CRM Integration** (e.g., HubSpot, Salesforce)

3. **Option 3: Database Storage**
   - Add a `consultations` table to your database
   - Store form submissions for follow-up

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy!

Vercel automatically handles:
- AI Gateway authentication (OIDC)
- Database connections
- Edge functions for optimal performance

### Deploy to Other Platforms

For non-Vercel deployments, you'll need:
- `AI_GATEWAY_API_KEY` environment variable
- PostgreSQL database
- Node.js hosting environment

## 📊 Key Pages Flow

```
Landing Page (/) 
    ↓
    ├─→ Chat with AI (/chat) → Learn about websites → Return to contact
    └─→ Schedule Call (/contact) → Fill form → Success → Chat or Home
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **AI**: Vercel AI SDK with multiple model support
- **Database**: Neon Serverless Postgres + Drizzle ORM
- **Auth**: NextAuth.js with guest mode
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (recommended)

## 📈 Next Steps

1. **Add Analytics**: Track visitor behavior and conversions
2. **Email Automation**: Send confirmation emails after form submission
3. **Calendar Integration**: Connect to Calendly or similar for direct booking
4. **Testimonials**: Add client testimonials to landing page
5. **Portfolio Section**: Showcase previous website projects
6. **Pricing Page**: Add transparent pricing information
7. **Blog**: Create content marketing pages for SEO

## 🤝 Support

For questions or issues:
- Check the [Vercel AI SDK docs](https://ai-sdk.dev)
- Review [Next.js documentation](https://nextjs.org/docs)
- Open an issue in the repository

## 📝 License

This project is based on the Vercel AI Chatbot template and customized for small business web development consultation.

---

**Ready to help small businesses grow online!** 🚀
