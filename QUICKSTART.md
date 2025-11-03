# 🚀 Quick Start Guide

Get your small business web development consultation platform running in 15 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A code editor (VS Code recommended)

## Step 1: Install Dependencies (2 min)

```bash
cd ai-chatbot
pnpm install
```

## Step 2: Set Up Environment (3 min)

Create a `.env.local` file in the root directory:

```env
# Generate this with: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"

# Get free database at neon.tech
POSTGRES_URL="postgresql://user:pass@host/database"

# For local development with xAI (or leave blank for Vercel auto-auth)
AI_GATEWAY_API_KEY=""
```

### Quick Setup Options:

**Option A: Use SQLite for Quick Testing**
```bash
# In drizzle.config.ts, change to SQLite for local testing
# (Not recommended for production)
```

**Option B: Get Free Postgres** (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create new database
4. Copy connection string to `POSTGRES_URL`

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

## Step 3: Set Up Database (2 min)

```bash
pnpm db:migrate
```

## Step 4: Start Development Server (1 min)

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Step 5: Test Your Site (5 min)

### Test Landing Page
1. Visit `http://localhost:3000`
2. You should see the landing page with hero section
3. Click around to verify all sections display correctly

### Test Contact Form
1. Click "Schedule a Call" or visit `/contact`
2. Fill out the form
3. Submit (currently logs to console)
4. Verify success message appears

### Test AI Chatbot
1. Click "Chat with AI Assistant" or visit `/chat`
2. You'll be auto-logged in as a guest
3. Try asking: "Why does my small business need a website?"
4. Test the educational responses

## Step 6: Customize (2 min for basics)

### Quick Customization:

**1. Update Company Name**
Open `app/(landing)/layout.tsx` line 21:
```tsx
<span className="text-xl font-bold">Your Business Name</span>
```

**2. Update Contact Info**
Open `app/(landing)/layout.tsx` lines 79-80:
```tsx
<li>Email: your-email@example.com</li>
<li>Phone: (555) 123-4567</li>
```

**3. Test Again**
Refresh the page to see your changes!

## ✅ You're Ready!

Your site is now running with:
- ✅ Landing page showcasing your services
- ✅ Contact form for consultation requests
- ✅ AI chatbot to educate small business owners
- ✅ Mobile-responsive design
- ✅ Professional navigation and footer

## 🎯 What's Next?

### For Quick Testing (5-10 min):
1. Browse through all pages
2. Test the chatbot with various questions
3. Fill out the contact form
4. Check mobile responsiveness (resize browser)

### For Full Customization (2-4 hours):
See `CUSTOMIZATION_CHECKLIST.md` for complete guide:
1. Update all branding and content
2. Customize colors to match your brand
3. Set up email notifications for form submissions
4. Add your logo
5. Adjust chatbot personality
6. Add pricing information (optional)

### For Deployment (15-30 min):
See `WEBBUILDER_SETUP.md` for deployment guide:
1. Push to GitHub
2. Deploy to Vercel
3. Add environment variables
4. Connect domain (optional)

## 🐛 Troubleshooting

### "Cannot connect to database"
- Verify `POSTGRES_URL` is correct
- Check database is running
- Try using `?sslmode=require` at end of connection string

### "Module not found" errors
```bash
rm -rf node_modules
pnpm install
```

### Port 3000 already in use
```bash
# Use a different port
pnpm dev --port 3001
```

### Auth errors
- Verify `AUTH_SECRET` is set
- Regenerate with `openssl rand -base64 32`

### Chatbot not responding
- Check AI_GATEWAY_API_KEY if not on Vercel
- Verify network connection
- Check browser console for errors

## 📚 Additional Resources

- **Full Setup Guide**: `WEBBUILDER_SETUP.md`
- **Chatbot Guide**: `CHATBOT_GUIDE.md`
- **Customization**: `CUSTOMIZATION_CHECKLIST.md`
- **Project Overview**: `PROJECT_SUMMARY.md`

## 🎉 Success!

If you can see the landing page and interact with the chatbot, you're all set! 

**Next Steps:**
1. Read through `PROJECT_SUMMARY.md` to understand what was built
2. Follow `CUSTOMIZATION_CHECKLIST.md` to personalize
3. Deploy when ready!

---

**Need help?** Check the troubleshooting section above or review the detailed docs.

**Ready to customize?** Open `CUSTOMIZATION_CHECKLIST.md` and follow along!

**Want to deploy?** See the deployment section in `WEBBUILDER_SETUP.md`!
