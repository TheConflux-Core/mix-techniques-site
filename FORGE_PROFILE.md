# Forge Session: User Profile Page + Homepage Nav

> **Priority:** Core feature — user identity, profile customization, submission history
> **Estimated:** 1 session

## Context

Auth is built and working. The site has:
- Login/Register pages (`/login`, `/register`)
- Auth-aware Navbar (shows Vote, display name, Logout when logged in)
- Homepage (`/`) with hero section — **does NOT use the Navbar component yet**
- Submission form (`/submit`) with Supabase storage upload
- `profiles` table in Supabase (id, display_name, avatar_url, bio, location, genre, website, social_links, role)

## What to Build

### 1. Add Navbar to Homepage

The homepage (`src/app/page.tsx`) has its own standalone layout. Add the `<Navbar />` component at the top, inside the `custom-cursor` div, before the `<main>` hero section.

The Navbar already matches the Studio Gold palette. It should sit on top of the hero with `z-50` (already has that). The sticky + backdrop-blur will work with the particles behind it.

### 2. Profile Page — `src/app/[username]/page.tsx`

A public profile page for each user at `mixtechniques.com/<username>`.

**Route:** Dynamic segment using `username` = the user's `display_name` (lowercased, slugified)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────┐                                           │
│  │ AVATAR│  Display Name                             │
│  │ 120px │  @username · Los Angeles · Producer       │
│  └──────┘  "Bio text goes here..."                   │
│                                                      │
│  ┌─── SUBMISSIONS ─────────────────────────────────┐ │
│  │ 🎵 Track Title — Submitted Jun 2026             │ │
│  │    Genre: Producer · Status: Under Review        │ │
│  │    [waveform preview if available]               │ │
│  │                                                  │ │
│  │ 🎵 Another Track — Submitted May 2026           │ │
│  │    Genre: Mix Engineer · Status: Selected        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─── SCHEDULE ────────────────────────────────────┐ │
│  │ 📅 Episode 12 — Airs Jun 20, 2026              │ │
│  │    Status: Selected for airing                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─── SOCIAL ──────────────────────────────────────┐ │
│  │ Instagram · SoundCloud · YouTube                 │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Data fetching:**
- Look up profile by `display_name` (case-insensitive match)
- Fetch user's submissions from `submissions` table where `email` matches
- Fetch any episode assignments (if `episode_id` is set on submissions)
- 404 if no profile found

**Components to create:**
- `src/components/profile/ProfileHeader.tsx` — avatar, name, bio, social links
- `src/components/profile/SubmissionList.tsx` — list of submissions with status badges
- `src/components/profile/ScheduleSection.tsx` — upcoming episodes
- `src/components/profile/SocialLinks.tsx` — clickable social link icons

### 3. Profile Edit — `src/app/[username]/edit/page.tsx`

Only accessible by the profile owner (check `auth.uid() === profile.id`).

**Edit form fields:**
- Display name (text)
- Bio (textarea, max 500 chars)
- Location (text)
- Genre (select, same options as submission form)
- Website (text)
- Social links (instagram, twitter, tiktok, youtube, soundcloud)
- **Profile picture upload** (see below)

**Save:** Updates the `profiles` table via Supabase client.

### 4. Profile Picture Upload

- Use Supabase Storage bucket `avatars` (create if needed)
- Client-side: file input with preview
- Upload to `avatars/{user_id}.{ext}`
- Get public URL and update `profiles.avatar_url`
- Show current avatar in edit page
- Default avatar: a gold gradient circle with first letter of display name

### 5. Update Navbar — Profile Link

Update `src/components/Navbar.tsx`:
- When logged in: replace the display name text with a link to `/<username>`
- Add a small avatar circle (24px) next to the name link
- If no avatar, show the letter fallback

### 6. Update Supabase Schema

Add to the `profiles` table (run in SQL editor):

```sql
-- Add avatar_url column if not exists
alter table public.profiles add column if not exists avatar_url text;

-- Create avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public read access to avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 7. Helper: Slugify Display Name

Create `src/lib/slugify.ts`:
```typescript
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

Used for profile URLs: `/<slugified-display-name>`

### 8. Type Updates

Update `src/lib/types.ts` — add Profile interface:
```typescript
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  genre: string | null;
  website: string | null;
  social_links: SocialLinks;
  role: string;
  created_at: string;
  updated_at: string;
}
```

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/lib/slugify.ts` |
| Create | `src/app/[username]/page.tsx` |
| Create | `src/app/[username]/edit/page.tsx` |
| Create | `src/components/profile/ProfileHeader.tsx` |
| Create | `src/components/profile/SubmissionList.tsx` |
| Create | `src/components/profile/ScheduleSection.tsx` |
| Create | `src/components/profile/SocialLinks.tsx` |
| Modify | `src/app/page.tsx` (add Navbar) |
| Modify | `src/components/Navbar.tsx` (avatar + profile link) |
| Modify | `src/lib/types.ts` (add Profile interface) |
| SQL | Run schema updates above in Supabase SQL editor |

## Design Reference

- Profile page uses `card-float noise carbon-fiber-walnut` containers
- Same heading styles: `heading-wave`, `tagline-glow`
- Status badges: use the existing `STATUS_COLORS` from types.ts
- Waveform preview: reuse `WaveformPreview` component from submission form
- Avatar: 120px circle with `border-2 border-[#3A2818]` and warm glow on hover
- Social links: subtle icons with gold hover effect
- Edit page: same form styling as login/register (warm glow inputs, btn-3d submit)

## After Building

1. Run SQL schema updates in Supabase
2. `npm run dev` → homepage shows Navbar with Login/Register
3. Register → redirected to home → Navbar shows avatar + profile link
4. Click profile link → goes to `/<username>` profile page
5. Click "Edit Profile" → can update bio, avatar, social links
6. Upload avatar → appears on profile and in Navbar
7. Submit a mix → submission appears on profile page
8. List all files created/modified
