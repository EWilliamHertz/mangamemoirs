# 🚀 Ouriye v2.1 — Complete Setup Checklist

Follow these steps in order. Each step is critical.

---

## 📋 Step 1: Update Supabase Database Schema

**Time: 5 minutes**

1. Open **Supabase Dashboard** → Select your project (`inmscdjhwoojbmlerxbb`)
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. **Copy entire content** from `/SETUP_DATABASE.sql` in the repo
5. **Paste into SQL Editor**
6. Click **Run** (or Ctrl+Enter)
7. **Wait for success** (should complete in 5-10 seconds)

### Verify Success:
- [ ] No errors in the output
- [ ] New tables appear in **Database** → **Tables**:
  - `teams`
  - `team_members`
  - `user_gallery`
  - `community_posts`
  - `vouchers`
  - `admin_users`

---

## 📦 Step 2: Verify Storage Buckets

**Time: 2 minutes**

1. In Supabase, go to **Storage** (left sidebar)
2. Verify two buckets exist:
   - [ ] `references` (public)
   - [ ] `media` (public)
3. If missing, create them manually:
   - Click **Create Bucket** → name: `references` → public → create
   - Click **Create Bucket** → name: `media` → public → create

---

## ⚙️ Step 3: Update Environment Variables

### Local `.env.local`:

```bash
# Copy from /project/root/.env.local.example
cp .env.local.example .env.local

# Edit .env.local and add/verify (use values from your previous setup):
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://inmscdjhwoojbmlerxbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
REPLICATE_API_TOKEN=r8_...
GEMINI_API_KEY=AQ.Ab8RN6Lu-...
```

**Note:** See your previous setup messages for actual values. Copy them from:
- Clerk Dashboard → API Keys
- Supabase Dashboard → Settings → API
- OpenAI → API Keys
- Replicate → API Tokens
- Google AI Studio → API Keys

**Important:** `.env.local` is in `.gitignore` — never commit it!

### Vercel Environment Variables:

1. Go to **Vercel Dashboard** → Select `mangamemoirs` project
2. Go to **Settings** → **Environment Variables**
3. Add/Update these 13 variables (same values as `.env.local`):
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - ✅ `CLERK_SECRET_KEY`
   - ✅ `CLERK_WEBHOOK_SECRET`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `OPENAI_API_KEY`
   - ✅ `REPLICATE_API_TOKEN`
   - ✅ `GEMINI_API_KEY`
   - ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - ✅ `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - ✅ `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
   - ✅ `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

4. **Redeploy** from Vercel dashboard

---

## 🧪 Step 4: Test Locally

**Time: 10 minutes**

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Test Each Feature:

#### A. Reference Image Upload
- [ ] Go to `/dashboard/references`
- [ ] Upload a test image (JPG/PNG)
- [ ] Should appear in list
- [ ] Should have category tag

#### B. Manga Panel Generation
- [ ] Go to `/dashboard`
- [ ] Type a prompt: "anime girl with blue hair"
- [ ] Click "Generate" (should use Replicate, cost 3 cr)
- [ ] Should see image after 30-60 seconds
- [ ] Should appear in `/dashboard/library`

#### C. Settings Page
- [ ] Go to `/dashboard/settings`
- [ ] Should show username field
- [ ] Should show credit balance
- [ ] Should have notification toggles
- [ ] Download data button should work

#### D. PDF to Manga Workflow
- [ ] Go to `/dashboard/pdf-to-manga`
- [ ] Upload a PDF
- [ ] Set scene count (slider)
- [ ] See estimated manga panels needed
- [ ] (Rest is placeholder for now)

#### E. Teams Page
- [ ] Go to `/dashboard/teams`
- [ ] Click "Create Team"
- [ ] Create a team with name + description
- [ ] Team should appear in list

---

## 🌐 Step 5: Deploy to Vercel

**Time: 5 minutes**

```bash
# Commit local changes (if any)
git add .
git commit -m "local setup"

# Push to GitHub (auto-deploys to Vercel)
git push origin main
```

Monitor deployment:
1. Go to **Vercel Dashboard** → `mangamemoirs` project
2. Should show "Deployment in progress"
3. Wait for ✅ "Ready"
4. Visit **https://mangamemoirs.vercel.app**

### Test in Production:
- [ ] Sign up with new email
- [ ] Get 8 free credits
- [ ] Upload reference image
- [ ] Generate manga panel (should work)
- [ ] Check library

---

## 🔐 Step 6: Make Yourself Admin (Optional)

**Time: 2 minutes**

To access `/admin` panel:

1. Open Supabase → SQL Editor
2. Run this SQL:

```sql
-- Get your Clerk user ID from dashboard after signing in
-- Go to http://mangamemoirs.vercel.app/dashboard
-- Open browser dev tools → Application → Cookies → __clerk_db_jwt
-- Decode the JWT at jwt.io to see your user_id

INSERT INTO admin_users (id, role)
VALUES ('your_clerk_user_id_here', 'admin')
ON CONFLICT (id) DO NOTHING;
```

After that, you'll see **Admin** link in sidebar.

---

## 📋 Feature Checklist

After completing all steps above, verify:

| Feature | Status | Location |
|---------|--------|----------|
| ✅ Replicate manga generation | [✓] | `/dashboard` |
| ✅ Reference image upload | [✓] | `/dashboard/references` |
| ✅ Library (user gallery) | [✓] | `/dashboard/library` |
| ✅ Settings page | [✓] | `/dashboard/settings` |
| ✅ PDF to Manga workflow | [✓] | `/dashboard/pdf-to-manga` |
| ✅ Team creation | [✓] | `/dashboard/teams` |
| ✅ Credit tracking | [✓] | `/dashboard/credits` |
| ✅ Voucher redemption | [✓] | `/dashboard/credits` |
| ⏳ Video editor (.mp4) | [TODO] | `/dashboard/video-editor` |
| ⏳ Direct Gemini generation | [TODO] | GenerationStudio UI |
| ⏳ Team invitations | [TODO] | Teams page |

---

## 🆘 Troubleshooting

### "Replicate 401 Unauthorized"
- [ ] Check `REPLICATE_API_TOKEN` in `.env.local`
- [ ] Check it's also in Vercel env vars
- [ ] Make sure you set the right token (not OpenAI)
- [ ] Clear browser cache and restart dev server

### "Reference upload fails"
- [ ] Check Supabase storage buckets exist
- [ ] Check RLS policies are applied (`SETUP_DATABASE.sql`)
- [ ] Check service role key is correct in `.env.local`
- [ ] Check browser console for detailed error

### "Can't sign up"
- [ ] Check Clerk keys in `.env.local` are correct
- [ ] Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test`
- [ ] Check Clerk webhook is set up in Clerk Dashboard

### "Credit generation fails"
- [ ] Check user has >= 3 credits
- [ ] Check `REPLICATE_API_TOKEN` in Vercel env vars
- [ ] Check Replicate API is working (visit replicate.com/status)

### "Settings page shows 'Loading...'"
- [ ] Check user is authenticated
- [ ] Check users table exists in Supabase
- [ ] Check RLS policies allow SELECT

---

## 🎯 Next: Premium Features (Backlog)

Once all above is working, here are the remaining features to build:

### 1. **Video Editor** (High Priority)
- [ ] Upload .mp4 files to canvas
- [ ] Timeline scrubber (Canva-style)
- [ ] Cut/trim/arrange clips
- [ ] Add text overlays
- [ ] Export as MP4
- [ ] Est. effort: 8-12 hours

### 2. **Direct Gemini Generation** (High Priority)
- [ ] Button: "Generate Manga From Storyboard"
- [ ] Upload memoir PDF
- [ ] Gemini extracts scenes
- [ ] Auto-generate manga for each scene
- [ ] Option to batch-generate anime
- [ ] Est. effort: 4-6 hours

### 3. **Team Invitations** (Medium Priority)
- [ ] Email invite system
- [ ] Accept/reject workflow
- [ ] Shared project dashboard
- [ ] Role-based access control
- [ ] Est. effort: 6-8 hours

### 4. **Anime Editor UI** (Medium Priority)
- [ ] Frame-by-frame scrubber
- [ ] Speed/FPS adjustment
- [ ] Transition effects
- [ ] Export settings
- [ ] Est. effort: 4-6 hours

---

## 📞 Support

If you get stuck:

1. Check **FIXES_APPLIED.md** for what changed
2. Check browser **Dev Tools** → **Console** for errors
3. Check Vercel **Deployments** → Logs
4. Check Supabase **Logs** → SQL failures
5. Email: ewilliamhe@gmail.com

---

**Version:** 2.1  
**Last Updated:** December 2024  
**Status:** Ready for production setup
