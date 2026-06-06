# ⛩️ MangaMemoirs

**Turn your memoir, novel, or story into a stunning manga & anime storyboard — scene by scene, powered by AI.**

> Stack: Next.js 14 · Clerk · Supabase · OpenAI · Replicate · Polar · Vercel

---

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EWilliamHertz/mangamemoirs)

**Or manually:**
1. Push this repo to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Set environment variables (see below)
4. Deploy

---

## ⚙️ Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks (see step 3) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `REPLICATE_API_TOKEN` | replicate.com → Account Settings (optional, for video) |
| `POLAR_ACCESS_TOKEN` | polar.sh → Settings → API |
| `POLAR_WEBHOOK_SECRET` | polar.sh → Webhooks |
| `NEXT_PUBLIC_POLAR_PRODUCT_STARTER` | Your Polar product ID (Starter $4.99) |
| `NEXT_PUBLIC_POLAR_PRODUCT_CREATOR` | Your Polar product ID (Creator $14.99) |
| `NEXT_PUBLIC_POLAR_PRODUCT_STUDIO` | Your Polar product ID (Studio $39.99) |
| `NEXT_PUBLIC_APP_URL` | `https://mangamemoirs.vercel.app` |

---

## 🗄️ Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Go to **Storage** → create a bucket named `references` (set to **public**)
4. Note your `URL` and both API keys from **Project Settings → API**

---

## 🔐 Clerk Setup

1. Create app at [clerk.com](https://clerk.com)
2. Enable email + Google/GitHub social logins
3. Set **Redirect URLs**: `https://mangamemoirs.vercel.app/dashboard`
4. Go to **Webhooks** → Add endpoint:
   - URL: `https://mangamemoirs.vercel.app/api/webhooks/clerk`
   - Events: `user.created`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

---

## 💳 Polar Setup (Payments)

1. Create account at [polar.sh](https://polar.sh)
2. Create 3 products:
   - **Starter** — $4.99 one-time
   - **Creator** — $14.99 one-time  
   - **Studio** — $39.99 one-time
3. Copy each product ID → set as env vars
4. Add webhook: `https://mangamemoirs.vercel.app/api/webhooks/polar`
   - Event: `order.paid`
   - Copy secret → `POLAR_WEBHOOK_SECRET`

---

## 💰 Credit System

| Action | Credits |
|---|---|
| Sign up bonus | **8 credits** (3 panels + 1 clip) |
| Manga panel (DALL-E 3 HD) | **2 credits** |
| Anime clip 5s (Replicate) | **10 credits** |
| Starter pack | $4.99 → **20 credits** |
| Creator pack | $14.99 → **75 credits** |
| Studio pack | $39.99 → **250 credits** |

---

## 🛠️ Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Studio
│   └── api/                  # API routes
├── lib/
│   ├── supabase.ts           # DB client
│   └── credits.ts            # Credit constants
supabase/schema.sql           # Database schema
```

---

Built with ❤️ for storytellers.
