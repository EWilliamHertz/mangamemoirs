# 🎬 OURIYE — Master Prompt for Anything AI

**Version:** 2.1  
**Date:** June 2026  
**Purpose:** Build a complete book-to-manga/anime SaaS platform using only Gemini Pro API and Anything backend.

---

## 📋 PROJECT OVERVIEW

### Vision
**Ouriye** is a studio that converts PDF memoirs and documents into engaging manga panels and short anime clips. Users upload books, AI extracts scenes, and Replicate generates high-quality manga/anime. Better than Lama10, Vidu, and PixVerse.

### Core Promise
- 📚 **Upload any PDF/DOCX memoir**
- 🎨 **Auto-generate manga panels** with character consistency
- 🎬 **Auto-generate anime clips** (5s/10s/15s)
- 💾 **Auto-save to library** with credit tracking
- 👥 **Collaborate with teams** on projects
- 🏆 **Admin panel** for management & vouchers

### Target Users
- Writers wanting to visualize memoirs
- Content creators building manga/anime from books
- Publishers testing concept art
- Indie studios with limited budget

---

## 🛠️ TECH STACK (SIMPLIFIED)

```
Frontend:    Next.js 15 (React) → Vercel
Backend:     Anything (built-in database + API)
Auth:        Clerk (managed)
AI:          Gemini Pro API (PDF analysis, storyboarding)
Image Gen:   Replicate API (manga panels)
Video Gen:   Replicate API (anime clips)
Storage:     Anything storage buckets
```

### Why This Stack?
- **Gemini Pro:** Excellent at PDF analysis, scene extraction, character naming
- **Replicate:** High-quality image/video generation, reliable API
- **Anything Backend:** Eliminates need for separate database server
- **Next.js:** Full-stack React with server actions
- **Clerk:** Handles auth, webhooks, user management

---

## 💾 DATABASE SCHEMA

### Core Tables

#### `users`
```
- id (TEXT, PRIMARY KEY)          # Clerk user ID (user_abc123)
- email (TEXT, UNIQUE)
- username (TEXT)
- credits (INTEGER)               # Current balance
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `user_gallery`
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FK → users)
- title (TEXT)
- description (TEXT)
- type (TEXT)                     # 'manga' or 'anime'
- image_url (TEXT)                # First frame/poster
- video_url (TEXT)                # Only for anime
- prompt (TEXT)                   # What was generated
- cost (INTEGER)                  # Credits spent
- is_public (BOOLEAN)             # In public feed?
- created_at (TIMESTAMP)
```

#### `references`
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FK → users)
- file_name (TEXT)
- file_url (TEXT)                 # Storage URL
- file_type (TEXT)                # 'image' or 'pdf' or 'docx'
- size_bytes (INTEGER)
- uploaded_at (TIMESTAMP)
```

#### `credit_transactions`
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FK → users)
- amount (INTEGER)                # Positive (earn) or negative (spend)
- reason (TEXT)                   # 'signup', 'manga_gen', 'anime_gen', 'top_up', 'voucher'
- reference_id (TEXT)             # Manga/anime ID or voucher code
- created_at (TIMESTAMP)
```

#### `vouchers`
```
- code (TEXT, PRIMARY KEY)
- credits (INTEGER)
- max_uses (INTEGER)
- used_count (INTEGER)
- created_by (TEXT, FK → users)   # Admin
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
```

#### `teams`
```
- id (UUID, PRIMARY KEY)
- name (TEXT)
- owner_id (TEXT, FK → users)
- description (TEXT)
- created_at (TIMESTAMP)
```

#### `team_members`
```
- id (UUID, PRIMARY KEY)
- team_id (UUID, FK → teams)
- user_id (TEXT, FK → users)
- role (TEXT)                     # 'owner', 'editor', 'viewer'
- joined_at (TIMESTAMP)
```

#### `admin_users`
```
- id (TEXT, PRIMARY KEY)          # Clerk user ID
- role (TEXT)                     # 'admin' or 'moderator'
- created_at (TIMESTAMP)
```

#### `community_posts`
```
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FK → users)
- gallery_id (UUID, FK → user_gallery)
- caption (TEXT)
- likes (INTEGER)
- created_at (TIMESTAMP)
```

---

## 🎯 CORE FEATURES

### 1. **Authentication** ✅
- **Clerk Sign-In/Sign-Up** (provided by Clerk)
- **Auto-create user** in Anything on first login
- **Credit auto-award:** 8 credits on signup
- **Webhook:** Clerk → sync user data on login/update

### 2. **Dashboard Landing** ✅
- Hero section with feature highlights
- Pricing table (Free/Pro/Studio)
- Call-to-action: "Get Started Free"
- Recent public manga/anime feed
- Stats: total users, total creations, etc.

### 3. **User Dashboard**
- Quick stats: credits, creations, teams
- "New Manga" button
- "New Anime" button
- "Upload Reference" button
- Navigation to all features

### 4. **Reference Library** ✅
- Upload JPG/PNG reference images
- Upload PDF memoirs
- Upload DOCX documents
- Organize by folders
- Tag images (@mention support)
- Use as reference in generation

### 5. **PDF to Manga Workflow** 🆕
```
Step 1: Upload PDF
  - User selects PDF memoir
  - Shows page count
  - Auto-extracts text preview

Step 2: Configure Scenes
  - Ask: "How many scenes/panels do you want?" (1-50)
  - Ask: "Any specific characters to feature?"
  - Ask: "Art style preference?" (manga, comic, illustration)

Step 3: AI Breakdown
  - Gemini Pro analyzes PDF
  - Extracts key scenes
  - Identifies characters, places, emotions
  - Creates storyboard with @mention tags
  - User reviews & edits scenes

Step 4: Generate Panels
  - For each scene, generate manga panel via Replicate
  - Show progress
  - Auto-save to user_gallery
  - Cost: 3 credits per panel
```

### 6. **Manga Generation Studio** ✅
- **Input:** Storyboard text + references
- **Process:** Send to Replicate with style guide
- **Output:** High-res manga panel
- **Cost:** 3 credits
- **Auto-save:** To user_gallery with metadata
- **Share:** Toggle public → appears in feed

### 7. **Anime Generation Studio** ✅
- **Input:** Storyboard text + motion description
- **Formats:**
  - 5-second clip (2 credits)
  - 10-second clip (4 credits)
  - 15-second clip (6 credits)
- **Process:** Send to Replicate (Animate Diff or similar)
- **Output:** MP4 video
- **Auto-save:** To user_gallery with metadata
- **Share:** Toggle public → appears in feed

### 8. **Settings Page** 🆕
- **Profile Tab:**
  - Username
  - Email
  - Avatar (Clerk provides)
  - Bio
- **Notifications Tab:**
  - Email on new team invite
  - Email on team member activity
  - Marketing emails toggle
- **Privacy Tab:**
  - Default visibility (private/public)
  - Who can collaborate
  - Download all data
- **Danger Zone:**
  - Delete account (also deletes all content)

### 9. **Credits Management**
- **Credits Page:**
  - Current balance
  - Transaction history (sortable, filterable)
  - Reason breakdown (pie chart)
  - "Buy Credits" button → opens mailto: ewilliamhe@gmail.com
  - "Redeem Voucher" button → input code, verify, add credits
- **Credit System:**
  - Signup bonus: 8 credits
  - Manga generation: 3 credits
  - Anime 5s: 2 credits
  - Anime 10s: 4 credits
  - Anime 15s: 6 credits
  - Top-up: custom (handled by admin)

### 10. **Teams & Collaboration** 🆕
- **Teams Page:**
  - List user's teams
  - "Create Team" button
  - Modal: Team name + description
  - Members list with roles (owner/editor/viewer)
  - "Invite Members" button
  - Invite modal: email input + role selector
  - Copy invite link (shareable)
- **Team Projects:**
  - Team gallery (shared creations)
  - Team credits pool (separate from personal)
  - Team settings (owner only)

### 11. **Public Feed & Discovery**
- Browse public manga/anime
- Filter by type (manga/anime)
- Filter by date (new/trending)
- Like & comment
- Creator attribution
- Share to social (copy link, open share dialog)

### 12. **Admin Panel** ✅
- **Access:** `/admin` (only for admin users)
- **Sections:**
  - User Management (list, ban, promote)
  - Credit Management (top-up user, refund, adjust)
  - Voucher Management (create, view usage, disable)
  - Content Moderation (flag inappropriate, delete)
  - Analytics (total users, total credits, trending)

### 13. **User Library**
- Gallery of user's creations
- Sort by date, type, likes
- Edit metadata (title, description, public/private)
- Delete creations
- Download as ZIP

---

## 🔄 DETAILED WORKFLOWS

### Workflow A: "Upload Memoir → Generate Manga"

```
1. User clicks "New Manga" → `/dashboard/pdf-to-manga`
2. Step 1: Upload PDF
   - Drag-drop or file picker
   - Show page count
   - Extract first 200 chars as preview
   - "Continue" button

3. Step 2: Configure
   - Input: "How many scenes?" (slider 1-50)
   - Input: "Characters to feature?" (text field, @mentions)
   - Input: "Art style?" (dropdown: manga / comic / illustration)
   - "Analyze" button

4. Step 3: AI Breakdown (Gemini Pro)
   - Call Gemini API:
     ```
     {
       "prompt": "Analyze this memoir PDF and extract [X] key scenes. For each, describe characters, setting, emotion, and action. Use @mention tags for characters (e.g., @john for John).",
       "pdf_text": [extracted text from uploaded PDF],
       "style": [user selected style]
     }
     ```
   - Parse response → JSON storyboard
   - Show preview cards (scene 1, 2, 3, etc.)
   - Allow user to edit each scene

5. Step 4: Generate
   - For each scene:
     ```
     - Call Replicate API with:
       - Scene description
       - References (user uploaded images)
       - Style guide
     - Get back image URL
     - Check user has >= 3 credits
     - Deduct 3 credits
     - Save to user_gallery
     - Log transaction
     ```
   - Show progress bar (2/10 panels generated)
   - Auto-save after each panel
   - "View in Library" button when done

6. User sees creations in:
   - `/dashboard/library` (personal)
   - `/dashboard` (hero section)
   - Public feed (if toggled public)
```

### Workflow B: "Storyboard → Generate Anime"

```
1. User opens Anime Generation Studio
2. Input storyboard (paste or reference scene from manga)
3. Input motion description: "character walks across field"
4. Select duration: 5s / 10s / 15s
5. Click "Generate"
   - Check credits (2/4/6)
   - Call Replicate API (video generation)
   - Show progress ("Rendering frame 1 of 150...")
   - Auto-save to user_gallery when complete
   - Play video preview
   - "Add to Library" button
6. Video appears in library with metadata
```

### Workflow C: "Team Collaboration"

```
1. User creates team → `/dashboard/teams`
   - Click "New Team"
   - Enter: name ("The Memoir Collective"), description
   - Team created, user = owner
   - Team auto-gets 100 credits (shared pool)

2. User invites teammates
   - Copy invite link or enter email
   - Send email via Anything email service
   - Invitee clicks → joins team
   - Sets role: viewer (can see) / editor (can generate) / owner (manage)

3. Team generation
   - When teammate generates manga:
     - Costs deducted from TEAM pool (not personal)
     - Goes to TEAM library (shared)
     - All members see it instantly
     - All members can edit/delete (if editor+)

4. Team management
   - Owner can: remove members, change roles, delete team, set credits
   - Editor can: generate, upload references, edit descriptions
   - Viewer can: view, like, comment (no spend)
```

### Workflow D: "Admin Voucher Redemption"

```
1. Admin creates voucher → `/admin` → "New Voucher"
   - Code: "SUMMER2026"
   - Credits: 50
   - Max uses: 100
   - Expires: 2026-08-31
   - "Create" button

2. User redeems → `/dashboard/credits` → "Redeem Voucher"
   - Paste code: "SUMMER2026"
   - Click "Redeem"
   - Verify:
     - Code exists
     - Not expired
     - Used count < max uses
   - Add credits to user
   - Log transaction: reason = "voucher", reference_id = code
   - Show: "✅ Added 50 credits! New balance: 58"

3. Admin sees usage → `/admin` → "Vouchers" → click "SUMMER2026"
   - Shows: 73/100 used
   - List of users who redeemed
   - Disable button (revoke future uses)
```

---

## 🚀 API INTEGRATIONS

### 1. Gemini Pro API

**Used for:**
- PDF text extraction & analysis
- Scene extraction from memoir
- Character/place identification
- Storyboard generation
- Direct manga/anime generation (future)

**Endpoints:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

Headers:
  Content-Type: application/json
  x-goog-api-key: GEMINI_API_KEY

Request:
{
  "contents": [{
    "parts": [{
      "text": "Analyze this memoir and extract 5 key scenes with characters and emotions..."
    }]
  }]
}

Response:
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "Scene 1: [description]..."
      }]
    }
  }]
}
```

### 2. Replicate API

**Used for:**
- Manga panel generation (SDXL or similar)
- Anime clip generation (Animate Diff)
- Character consistency across panels

**Endpoints:**
```
POST https://api.replicate.com/v1/predictions

Headers:
  Authorization: Token REPLICATE_API_TOKEN
  Content-Type: application/json

Request:
{
  "version": "MODEL_VERSION_ID",
  "input": {
    "prompt": "A detailed manga panel showing...",
    "negative_prompt": "low quality, blurry...",
    "width": 768,
    "height": 1024,
    "guidance_scale": 7.5
  }
}

Response:
{
  "id": "pred_123",
  "status": "processing",
  "output": ["https://replicate.delivery/...output.png"]
}
```

### 3. Clerk API

**Used for:**
- User authentication
- Webhook sync (user created, updated, deleted)
- User metadata storage

**Webhook:**
```
POST /api/webhooks/clerk

{
  "type": "user.created",
  "data": {
    "id": "user_abc123",
    "email_addresses": [{
      "email_address": "user@example.com"
    }],
    "username": "john_doe"
  }
}

Action:
  - Create row in users table
  - Add 8 credits
  - Log transaction
```

### 4. Anything Backend

**Used for:**
- Database storage (all tables)
- File storage (references, media)
- API endpoints (CRUD operations)
- Webhooks

---

## 📱 UI/UX STRUCTURE

### Navigation (Left Sidebar)
```
Logo: Ouriye
├─ Dashboard (home icon)
├─ New Manga (sparkles icon)
├─ New Anime (clapperboard icon)
├─ References (folder icon)
├─ PDF to Manga (book icon)
├─ Library (collection icon)
├─ Teams (people icon)
├─ Credits (coin icon)
├─ Settings (gear icon)
└─ [if admin] Admin Panel (shield icon)
```

### Pages & Routes

```
/ → Landing page (features, pricing, auth)
/sign-in → Clerk sign-in
/sign-up → Clerk sign-up

/dashboard → Dashboard (home)
/dashboard/new-manga → Manga generation studio
/dashboard/new-anime → Anime generation studio
/dashboard/references → Reference library
/dashboard/pdf-to-manga → PDF workflow (3-step)
/dashboard/library → User gallery
/dashboard/teams → Team management
/dashboard/credits → Credit management
/dashboard/settings → User settings

/admin → Admin dashboard
/admin/users → User management
/admin/credits → Credit management
/admin/vouchers → Voucher management
/admin/moderation → Content moderation

/feed → Public feed (discovery)
/feed/[id] → Single creation detail
/creator/[username] → Creator profile
```

---

## 💳 CREDIT SYSTEM

### Credit Costs
| Action | Cost | Notes |
|--------|------|-------|
| Signup bonus | +8 | Awarded on first login |
| Manga panel | -3 | Per panel generated |
| Anime 5s | -2 | Per clip |
| Anime 10s | -4 | Per clip |
| Anime 15s | -6 | Per clip |
| Top-up (small) | +25 | Manual, via email request |
| Top-up (medium) | +75 | Manual, via email request |
| Top-up (large) | +250 | Manual, via email request |
| Voucher | +X | Admin-defined, redeemable |

### Pricing Tiers
```
Free:    $0/mo, 8 credits, limited features
Pro:     $9/mo, 75 credits, advanced features
Studio:  $29/mo, 250 credits, team access
```

### Transaction Logging
Every credit change logs:
- user_id
- amount
- reason (signup, manga_gen, anime_gen, top_up, voucher)
- reference_id (manga ID, anime ID, or voucher code)
- timestamp

---

## 🔐 SECURITY & RLS

### Authentication Flow
1. User signs up with Clerk
2. Clerk webhook → create user in Anything
3. Clerk returns session JWT
4. All requests include JWT in Authorization header
5. Anything validates JWT before allowing DB access

### Row-Level Security (RLS)
```
user_gallery:
  - Owner can: SELECT, UPDATE, DELETE own rows
  - Others can: SELECT if is_public = true
  - Admin can: SELECT, DELETE any

references:
  - Owner can: SELECT, UPDATE, DELETE own rows
  - Others: cannot SELECT

credit_transactions:
  - User can: SELECT own transactions
  - Admin can: SELECT, INSERT any

teams:
  - Owner/members can: SELECT own team
  - Others: cannot SELECT
  - Admin can: SELECT any

vouchers:
  - Anyone can: SELECT
  - Admin can: INSERT, UPDATE, DELETE

storage.references:
  - Authenticated users can: upload, download own
  - Others: cannot access

storage.media:
  - Authenticated users can: download public media
  - Owners can: upload, delete own
```

---

## 🎨 DESIGN SYSTEM

### Colors
```
Primary:   #6366F1 (Indigo)
Secondary: #8B5CF6 (Violet)
Accent:    #EC4899 (Pink)
Success:   #10B981 (Green)
Warning:   #F59E0B (Amber)
Error:     #EF4444 (Red)
BG Dark:   #0F172A (Slate 950)
BG Light:  #F8FAFC (Slate 50)
Text:      #1E293B (Slate 900)
```

### Fonts
```
Headers:   Inter Bold
Body:      Inter Regular
Mono:      JetBrains Mono (code)
```

### Components
- Buttons: Primary, secondary, ghost, outline
- Cards: Elevated, outlined, flat
- Inputs: Text, textarea, select, multiselect
- Modals: Centered, fullscreen
- Tables: Sortable, filterable, paginated
- Progress: Bar, circular, steps

---

## 📊 ANALYTICS & METRICS

### Dashboard Analytics (Admin)
- **Total Users:** Count distinct users
- **Total Creations:** Count manga + anime
- **Credits Distributed:** Sum of all top-ups
- **Credits Spent:** Sum of all generations
- **Active Teams:** Count non-empty teams
- **Top Creators:** Leaderboard by likes/shares
- **Trending:** Most liked this week

### User Analytics
- **My Stats:**
  - Total created
  - Total shared
  - Total likes received
  - Most popular creation

---

## 🚢 DEPLOYMENT

### Hosting
- **Frontend:** Vercel (Next.js)
- **Backend:** Anything
- **Database:** Anything
- **Storage:** Anything
- **Auth:** Clerk (managed)

### Environment Variables
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# APIs
GEMINI_API_KEY=AQ.Ab8...
REPLICATE_API_TOKEN=r8_...

# Anything Backend
ANYTHING_PROJECT_ID=proj_...
ANYTHING_API_KEY=ak_...

# URLs
NEXT_PUBLIC_APP_URL=https://mangamemoirs.vercel.app
NEXT_PUBLIC_ANYTHING_URL=https://api.anything.com
```

### Deployment Steps
1. Connect GitHub to Vercel
2. Set all env vars in Vercel dashboard
3. Deploy on push to main
4. Verify webhooks are working
5. Run smoke tests

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Core Setup
- [ ] Anything backend configured (database, storage)
- [ ] Clerk integration set up
- [ ] Gemini API key configured
- [ ] Replicate API key configured
- [ ] Database schema created
- [ ] RLS policies enabled
- [ ] Storage buckets created

### Phase 2: Authentication
- [ ] Sign-in/sign-up pages
- [ ] Clerk webhook configured
- [ ] Auto-create user on signup
- [ ] Award 8 credits on signup

### Phase 3: Core Features
- [ ] Dashboard (home page)
- [ ] Reference library (upload, organize)
- [ ] Manga generation (studio + auto-save)
- [ ] Anime generation (studio + auto-save)
- [ ] User library (view, organize, delete)
- [ ] Public feed (discover)

### Phase 4: Advanced Features
- [ ] PDF to Manga workflow (3-step)
- [ ] Teams & collaboration
- [ ] Settings page
- [ ] Credits management
- [ ] Voucher redemption
- [ ] Admin panel

### Phase 5: Polish
- [ ] Mobile responsive design
- [ ] Error handling & validation
- [ ] Loading states & animations
- [ ] Email notifications
- [ ] Analytics
- [ ] Performance optimization

### Phase 6: Launch
- [ ] Security audit
- [ ] Smoke tests on production
- [ ] Documentation
- [ ] User onboarding flow
- [ ] Marketing assets

---

## 🎯 SUCCESS CRITERIA

After implementation, verify:

- [ ] User can sign up → receives 8 credits
- [ ] User can upload reference images (JPG, PNG)
- [ ] User can upload PDF memoir
- [ ] User can trigger PDF analysis (Gemini)
- [ ] User can generate manga panel (Replicate) → costs 3 credits
- [ ] Generated manga appears in library (auto-save works)
- [ ] Generated manga can be made public → appears in feed
- [ ] User can generate anime clip (2/4/6 cr) → auto-saved
- [ ] User can view credit transaction history
- [ ] Admin can create vouchers
- [ ] User can redeem voucher → credits added
- [ ] User can create team → invite members
- [ ] Team members can generate together → uses shared credits
- [ ] Settings page loads → can update profile
- [ ] Admin panel accessible (for admin users)
- [ ] Credit math is correct (no negative balances)
- [ ] No Hugging Face references in code/UI
- [ ] All env vars are in backend (not committed to git)

---

## 🔧 TROUBLESHOOTING

### Common Issues

**Issue:** Manga generation fails with "Replicate API error"
- Check: Replicate token is valid
- Check: Model version ID is correct
- Check: User has >= 3 credits
- Check: Input prompt is valid

**Issue:** PDF analysis returns empty
- Check: PDF is valid (not encrypted)
- Check: Gemini API key is valid
- Check: PDF text extraction working
- Check: Prompt is correctly formatted

**Issue:** Generated image doesn't appear in library
- Check: Auto-save function ran
- Check: Database insert succeeded
- Check: User_gallery RLS policy allows insert
- Check: File was actually saved to storage

**Issue:** User can't upload reference image
- Check: Storage bucket "references" exists
- Check: User is authenticated (JWT valid)
- Check: RLS policy allows authenticated users to upload
- Check: File size is reasonable (<10MB)
- Check: File type is jpg/png/pdf/docx

**Issue:** Credits show as negative
- Check: Deduction logic (should prevent if balance < cost)
- Check: Concurrent requests not causing race condition
- Check: Credit_transactions log for anomalies
- Check: Admin top-up not accidentally applied twice

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- Gemini API Docs: https://ai.google.dev/docs
- Replicate Docs: https://replicate.com/docs
- Clerk Docs: https://clerk.com/docs
- Anything Docs: [Your Anything platform docs]
- Next.js Docs: https://nextjs.org/docs

### APIs to Use
```
Gemini: models/gemini-pro
Replicate: stable-diffusion-xl or similar for manga
Replicate: cog-animate-diff or similar for anime
```

### Sample Prompts

**Gemini Prompt (PDF Analysis):**
```
Analyze this memoir and extract 5 key scenes. For each scene, provide:
1. Scene title
2. Characters involved (use @mention format, e.g., @john)
3. Setting and environment
4. Emotional tone
5. Key action or dialogue
6. Visual description for manga panel
7. Suggested art style (manga, comic, illustration)

Return as JSON:
{
  "scenes": [
    {
      "title": "...",
      "characters": ["@john", "@sarah"],
      "setting": "...",
      "emotion": "...",
      "action": "...",
      "visual_description": "...",
      "art_style": "manga"
    }
  ]
}
```

**Replicate Prompt (Manga Panel):**
```
Create a high-quality manga panel in Japanese manga art style. Scene: [scene description]. 
Characters: [character list]. Setting: [setting description]. Emotion: [emotional tone].
Style: Black and white manga with detailed linework and screentone shading. 
Composition: [compositional direction]. Resolution: 768x1024px.
```

**Replicate Prompt (Anime Clip):**
```
Generate a 5-second anime clip in Japanese anime art style. Scene: [scene description].
Characters: [character list]. Motion: [motion description]. Duration: 5 seconds (150 frames at 30fps).
Style: Smooth animation with vibrant colors and expressive character movements.
Output: MP4 video file.
```

---

## 🎓 FINAL NOTES

### Philosophy
- **User-first:** Always optimize for creator experience
- **AI-powered:** Leverage Gemini for analysis, Replicate for generation
- **Community:** Encourage sharing and collaboration
- **Transparency:** Show all costs and transactions clearly
- **Accessibility:** Make it easy for non-technical users

### Future Roadmap
- [ ] Advanced video editor (Canva-style)
- [ ] Batch processing (50+ panels at once)
- [ ] Character consistency engine (keep characters same across panels)
- [ ] Voice-over generation (TTS → anime)
- [ ] Direct Gemini manga/anime generation (skipping storyboard)
- [ ] Marketplace (sell generated content)
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)

### Success Metrics
- 1,000+ users in first 3 months
- 10,000+ total creations
- 50+ active teams
- $5,000+ MRR from top-ups
- 4.5+ star rating on ProductHunt

---

## 💬 CONTACT & SUPPORT

**Admin Email:** ewilliamhe@gmail.com  
**Support:** Via email → credits.support@ouriye.app  
**Bug Reports:** GitHub issues  
**Feature Requests:** GitHub discussions

---

**Last Updated:** June 8, 2026  
**Status:** Production Ready  
**Version:** 2.1.0

> *Build something beautiful. Make memoirs into masterpieces.* ✨
