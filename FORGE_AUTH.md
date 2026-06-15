# Forge Session: Auth + User Profiles

> **Priority:** Foundation — blocks voting, forum, portfolio
> **Estimated:** 1 session

## Context

Mix Techniques site (`mix-techniques-site/`) is a Next.js 16 app with Supabase. Landing page and `/submit` are live. We need user accounts before we can build voting, forum, or portfolio features.

**Supabase project:** `wsaasqrcojnenwevfabo.supabase.co`
**Existing anon key:** in `.env.local`
**You need:** Service role key from Don (for admin API routes)

## What to Build

### 1. Supabase Database Schema

Run these SQL statements in the Supabase SQL editor:

```sql
-- User profiles (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  bio text,
  location text,
  genre text,
  website text,
  social_links jsonb default '{}',
  role text default 'user' check (role in ('user', 'admin', 'judge')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS policies
alter table public.profiles enable row level security;

-- Anyone can read profiles (for forum, portfolio pages later)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();
```

### 2. Supabase Auth Configuration

In Supabase Dashboard → Authentication → Settings:
- Enable Email provider (email + password)
- Disable email confirmation for now (we'll enable later with SMTP)
- Set Site URL to `http://localhost:3000` (dev) — update for production later

### 3. Server-Side Supabase Client

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

Create `src/middleware.ts` (Next.js middleware):

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 4. Auth Pages

**`src/app/register/page.tsx`** — Registration page:
- Fields: display name, email, password, confirm password
- Same Studio Gold styling as submit page
- Card-float container, noise texture, warm glow inputs
- Client-side validation (password match, min length)
- Calls `supabase.auth.signUp()` with `display_name` in metadata
- On success: redirect to `/vote` with a "Check your email" toast (or straight in if email confirmation is off)
- Link to `/login` at bottom

**`src/app/login/page.tsx`** — Login page:
- Fields: email, password
- Same styling
- Calls `supabase.auth.signInWithPassword()`
- On success: redirect to `/` (or `/vote` if they came from there)
- Link to `/register` at bottom
- Optional: "Forgot password" link (can implement later)

### 5. Auth Context / Hook

Create `src/lib/auth.tsx` — client-side auth context:

```typescript
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

Wrap the root layout in `AuthProvider`.

### 6. Update Navbar

Update `src/components/Navbar.tsx`:
- Show "Login" / "Register" links when not authenticated
- Show user display name + "Vote" link + "Logout" button when authenticated
- Use the `useAuth()` hook
- Style: auth links use same nav-link style, logout is a subtle text button

### 7. Middleware + Route Protection

The middleware above handles session refresh. No routes need hard protection yet (voting requires auth but we'll check client-side). Future: protect `/profile`, `/forum` posting.

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/lib/supabase/server.ts` |
| Create | `src/lib/supabase/middleware.ts` |
| Create | `src/middleware.ts` |
| Create | `src/lib/auth.tsx` |
| Create | `src/app/register/page.tsx` |
| Create | `src/app/login/page.tsx` |
| Modify | `src/app/layout.tsx` (add AuthProvider) |
| Modify | `src/components/Navbar.tsx` (auth-aware links) |
| Modify | `.env.local` (add `SUPABASE_SERVICE_ROLE_KEY` if needed for API routes) |

## Design Reference

- Use the same `card-float noise carbon-fiber-walnut` container pattern from submit page
- Same input styling: `bg-[#0F0A07] border border-[#3A2818]` with warm glow focus
- Same `btn-3d` for submit buttons
- `heading-wave` for page titles
- `tagline-glow` for subtitles
- Loading state: use the same spinner pattern from SubmissionForm

## After Building

1. Test: `npm run dev` → `/register` → create account → redirected to home
2. Test: `/login` → sign in → Navbar shows user name
3. Test: refresh page → session persists
4. Test: sign out → Navbar shows Login/Register
5. Verify profile row created in Supabase `profiles` table
6. List all files created/modified
