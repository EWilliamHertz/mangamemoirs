# 🎬 Ouriye Platform Setup Guide

**Version:** 2.0 with Gemini Pro integration

---

## 📋 Quick Checklist

- [ ] Set up `.env.local` with API keys
- [ ] Add environment variables to Vercel
- [ ] Run SQL schema in Supabase
- [ ] Install dependencies with `npm install`
- [ ] Test locally with `npm run dev`
- [ ] Deploy to Vercel

---

## 🚀 Step 1: Local Environment Setup (`.env.local`)

### Create `.env.local` File

Copy the template and fill in your actual keys:

```bash
cp .env.local.example .env.local
```

### Edit `.env.local` with Your Keys

```env
# Clerk — get from https://dashboard.clerk.com → API Keys
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk routing
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase — get from https://supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your_supabase_project.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 🔑 Google Gemini API — get from https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here

# OpenAI API — get from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_key_here

# Replicate API — get from https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=your_replicate_token_here
```

### ⚠️ IMPORTANT: Never Commit `.env.local`

The file `.env.local` is already in `.gitignore`. **Never commit it!**

---

## 🌐 Step 2: Add Keys to Vercel

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**

Add these variables (same keys as `.env.local`):

```
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_GENERATIVE_AI_API_KEY
OPENAI_API_KEY
REPLICATE_API_TOKEN
```

**Then redeploy** from the Deployments tab.

---

## 💾 Step 3: Run Database Schema

Open **Supabase SQL Editor** and run the contents of `SETUP_DATABASE.sql`:

```sql
-- This creates:
-- 1. user_gallery table (stores all generated content)
-- 2. Proper RLS policies
-- 3. Indexes for performance
```

The file is in the root of the repo.

---

## 🔐 Step 4: Set Up Admin (One-Time)

### Get Your Clerk User ID

1. Sign in to your app at `https://mangamemoirs.vercel.app/sign-up`
2. Go to **Clerk Dashboard** → **Users**
3. Find yourself and copy your **User ID** (looks like `user_abc123xyz`)

### Run Admin SQL

In **Supabase SQL Editor**, run:

```sql
INSERT INTO admin_users (id, role)
VALUES ('user_YOUR_CLERK_ID_HERE', 'admin')
ON CONFLICT DO NOTHING;
```

Replace `user_YOUR_CLERK_ID_HERE` with your actual ID.

Now you can:
- Access `/admin` panel
- Generate voucher codes
- Top up user credits
- Grant admin to others

---

## 📦 Step 5: Install & Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## 🎯 Key Features Now Available

### 📚 User Gallery (Library)

- **All generated content auto-saves** to your library
- View manga panels and anime clips in one place
- Download, delete, or share to community
- Filter by type (manga / anime / all)
- **No more lost generations!**

### 📖 Gemini Pro Storyboard Generator

Convert your memoir/PDF into a manga/anime storyboard:

```typescript
const { generateStoryboardFromMemoir } = await import('@/app/actions/geminiActions');

const result = await generateStoryboardFromMemoir(
  memoirText,        // Your memoir text
  'My Life Story',    // Title (optional)
  8                   // Number of scenes
);

// Returns:
// - 8 story scenes with manga + anime prompts
// - Character & location extraction
// - Emotional beats & pacing
```

### 🎨 Manga Panel Generation

Now uses **Stable Diffusion 3.5** (superior to Hugging Face):

```typescript
const { generateMangaPanel } = await import('@/app/actions/generateMangaPanel');

const result = await generateMangaPanel({
  prompt: 'A samurai warrior in a forest at sunset',
  isColored: true,
  aspectRatio: 'portrait',
  provider: 'replicate',  // Always Replicate now
});

// Auto-saves to user_gallery!
// Returns: imageUrl, creditsUsed, galleryId
```

### 🎬 Anime Clip Generation

Same as before, now auto-saves to gallery:

```typescript
const result = await generateAnimeClip({
  prompt: 'A character runs through a bustling city',
  duration: 5,
  aspectRatio: '16:9',
});

// Auto-saves to user_gallery!
```

### 💰 Credit Transactions

All credit usage is logged in `credit_transactions` table:

```typescript
{
  user_id: 'user_abc123',
  amount: -3,  // Negative for spending
  type: 'manga_generation',
  description: 'Generated manga panel',
  reference_id: 'gallery-item-uuid',
  created_at: '2026-06-08T...'
}
```

Users can view transaction history in `/dashboard/credits`

---

## 🚨 Troubleshooting

### "Invalid credentials" when pushing to GitHub

The GitHub token might be expired. Ask for a new one.

### "Insufficient credits" error

Users get **8 free credits on signup**. Costs:
- Manga panel: **3 credits**
- Anime clip (5s): **2 credits**
- Anime clip (10s): **4 credits**
- Anime clip (15s): **6 credits**

### "Gemini API not configured"

Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env.local` and Vercel.

### Gallery not showing generated content

Make sure the `user_gallery` table was created. Check Supabase → Tables → `user_gallery` exists.

---

## 📊 Database Schema Overview

```
users
├── id (TEXT, Clerk ID)
├── credits (INT)
├── total_credits_earned (INT)

user_gallery
├── id (UUID)
├── user_id (TEXT → users.id)
├── title, description
├── media_url (generated image/video)
├── media_type ('manga-panel' | 'anime-clip')
├── prompt (the generation prompt)
├── credits_used (cost)
├── is_shared (published to community?)
├── community_post_id (if shared)
├── created_at

credit_transactions
├── id (UUID)
├── user_id (TEXT → users.id)
├── amount (INT, negative = spending)
├── type ('manga_generation' | 'anime_generation' | 'voucher_redeemed')
├── description
├── reference_id (gallery or voucher ID)
├── created_at

community_posts
├── id (UUID)
├── user_id (TEXT)
├── media_url
├── caption
├── content_type ('manga-pictures' | 'anime-shorts')
├── likes_count
├── created_at
```

---

## 🎬 Workflow: Memoir → Manga

1. **Upload PDF/memoir** to references
2. **Extract text** (auto or manual paste)
3. **Generate storyboard** with Gemini:
   ```
   /dashboard → Storyboard Builder
   ```
4. **Review 8 scenes** with Gemini's suggestions
5. **Generate manga panels** for each scene:
   ```
   Use the suggested mangaPrompt for each scene
   ```
6. **Arrange in Manga Editor** to set page order
7. **Download or share** to community

---

## 🎮 Your Setup is Complete!

You now have:

✅ **Ouriye v2.0** with Gemini Pro integration  
✅ **User gallery** (no more lost generations)  
✅ **Storyboard generator** (memoir → scenes)  
✅ **Better manga quality** (Stable Diffusion 3.5)  
✅ **Credit system** with transactions  
✅ **Admin panel** for vouchers & user management  

**Start building!** 🚀

Questions? Check the repo issues or email ewilliamhe@gmail.com

---

**Build better than Lama10, Eliser.ai, Vidu, and PixVerse combined.**
