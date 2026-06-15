# Forge Session: Live Vote Page

> **Priority:** Core feature — viewer voting during live shows
> **Depends on:** FORGE_AUTH.md (user accounts must be working)
> **Estimated:** 1 session

## Context

The site already has auth (see FORGE_AUTH.md). We need a `/vote` page where authenticated users score mixes in real-time using SSL-style faders. The standalone `vote.html` in `mix-techniques-overlays/` is the reference — port its UI into a Next.js page that connects to the WS server.

**WS server:** Runs on port 8765 locally, will be deployed publicly later
**Reference file:** `mix-techniques-overlays/vote.html` (standalone version — read this first)
**Existing styling:** All CSS is in `globals.css` — Studio Gold palette, carbon fiber, etc.

## What to Build

### 1. Vote Page — `src/app/vote/page.tsx`

A `"use client"` page that:
- Requires authentication (redirect to `/login` if not signed in)
- Shows a "Connect to Live Show" state when no WS connection
- Once connected: 5 SSL faders, real-time scoring, leaderboard

**Layout (match the standalone vote.html structure):**
```
┌─────────────────────────────────────────────────────────┐
│  MIX TECHNIQUES — LIVE SCORING                          │
│  "Score the mix in real-time"                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ♪ NOW PLAYING                                      │ │
│  │   Midnight Frequency by Alex Rivera                │ │
│  │   Los Angeles · Producer                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ LOW END  │ │ CLARITY  │ │ BALANCE  │ │DYNAMICS  │  │
│  │  ┌──┐    │ │  ┌──┐    │ │  ┌──┐    │ │  ┌──┐    │  │
│  │  │▓▓│    │ │  │▓▓│    │ │  │▓▓│    │ │  │▓▓│    │  │
│  │  └──┘    │ │  └──┘    │ │  └──┘    │ │  └──┘    │  │
│  │  7.5     │ │  8.0     │ │  7.0     │ │  8.5     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                     ┌──────────┐                        │
│                     │  IMAGE   │                        │
│                     │  ┌──┐    │                        │
│                     │  │▓▓│    │                        │
│                     │  └──┘    │                        │
│                     │  7.0     │                        │
│                     └──────────┘                        │
│                                                         │
│  YOUR AVERAGE: 7.6              [SUBMIT SCORES]         │
│                                                         │
│  ┌─── LEADERBOARD ──────────────────────────────────┐  │
│  │ 1. mixmaster99    — 8.4 avg (12 votes)           │  │
│  │ 2. beatqueen      — 8.1 avg (8 votes)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Fader Component — `src/components/vote/Fader.tsx`

A reusable vertical fader component:
- Props: `metricKey`, `label`, `value`, `onChange`, `min`, `max`
- Vertical slider with SSL-style aesthetics
- Fader cap: cream/brass gradient, subtle highlight line
- Track: dark with repeating tick marks (CSS `repeating-linear-gradient`)
- Fill: gold gradient from bottom to cap position
- Scale labels (1-10) on the left side
- Current value displayed below
- **Interaction:**
  - Mouse: mousedown on cap → mousemove → mouseup
  - Touch: touchstart → touchmove → touchend
  - Click on track to jump
- Snap to 0.5 steps
- Responsive: smaller on mobile, still draggable
- Use the same CSS patterns from `globals.css` (no external libs)

### 3. Fader Console — `src/components/vote/FaderConsole.tsx`

Container for all 5 faders:
- Props: `onScoresChange`, `disabled`
- Renders 5 `Fader` components in a flex row
- Computes and displays the average
- "Submit Scores" button (btn-3d style)
- Submitted state: overlay with checkmark (same as submission form success)
- Disabled state when not connected to WS or no active contestant
- Uses the same `console` section styling from vote.html (carbon fiber bg, subtle border)

### 4. Now Playing — `src/components/vote/NowPlaying.tsx`

- Props: `contestant` (name, city, genre, handle)
- Shows current contestant info
- Animated music note icon when playing
- "Waiting for contestant..." empty state
- Gold accent bar on left side

### 5. Leaderboard — `src/components/vote/Leaderboard.tsx`

- Props: `entries` (array of {name, avg, votes})
- Shows top 5 with rank, name, average score, vote count
- Gold rank numbers (1st = brightest)
- Empty state: "No votes yet this episode"

### 6. WebSocket Hook — `src/lib/useVoteSocket.ts`

Custom hook for WS connection:

```typescript
export function useVoteSocket(serverUrl: string) {
  // Returns: { connected, contestant, leaderboard, sendMessage }
  // - Reconnects automatically on disconnect
  // - Handles: state, contestant-update, leaderboard-update, viewer-vote-ack
  // - sendMessage(type, data) for submitting votes
}
```

- Connect to `ws://localhost:8765` (dev) or `wss://stream.mixtechniques.com` (prod)
- Use env var `NEXT_PUBLIC_WS_URL` for the server URL
- Auto-reconnect on disconnect (2s delay)
- Parse incoming messages, update state
- On connect: receive full state dump
- Handle `viewer-vote-ack` to show confirmation

### 7. Vote Submission

When user clicks "Submit Scores":
- Get user ID from auth context (`useAuth()`)
- Send `viewer-vote` message via WS:
  ```json
  {
    "type": "viewer-vote",
    "data": {
      "viewer": "user_<supabase-uuid>",
      "displayName": "user's display name",
      "contestant": "current contestant name",
      "metrics": { "lowEnd": 7.5, "clarity": 8.0, ... },
      "total": 7.6
    }
  }
  ```
- Show submitted overlay on success
- Disable re-voting for same contestant (track locally)

### 8. Add Vote Link to Navbar

Add "Vote" link to Navbar (already auth-aware from FORGE_AUTH.md):
- Only show when authenticated
- Use same nav-link style

## Environment Variable

Add to `.env.local`:
```
NEXT_PUBLIC_WS_URL=ws://localhost:8765
```

(Update to `wss://stream.mixtechniques.com` when deployed)

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/app/vote/page.tsx` |
| Create | `src/components/vote/Fader.tsx` |
| Create | `src/components/vote/FaderConsole.tsx` |
| Create | `src/components/vote/NowPlaying.tsx` |
| Create | `src/components/vote/Leaderboard.tsx` |
| Create | `src/lib/useVoteSocket.ts` |
| Modify | `src/components/Navbar.tsx` (add Vote link) |
| Modify | `.env.local` (add `NEXT_PUBLIC_WS_URL`) |

## Design Reference

Read `mix-techniques-overlays/vote.html` for the exact visual reference. Key CSS patterns:

- **Fader track:** `rgba(26,15,10,0.9)` bg, `repeating-linear-gradient` tick marks
- **Fader cap:** `linear-gradient(180deg, #F0E6D3, #D4C4A8)` with `rgba(212,168,67,0.3)` border
- **Console bg:** `linear-gradient(180deg, rgba(42,24,16,0.6), rgba(26,15,10,0.7))`
- **Values:** `var(--amber)` color, `font-mono`, bold
- **Submit button:** Same `btn-3d` from globals.css
- **Leaderboard:** `card-float` variant with gold rank numbers

All colors already defined in `globals.css` theme variables. Use Tailwind classes referencing those vars where possible.

## Mobile

- Faders stack tighter on small screens (clamp widths)
- Touch interaction must work smoothly (no scroll interference)
- Submit row stacks vertically on mobile
- Now Playing card stays full width

## After Building

1. Start WS server: `cd mix-techniques-overlays && node server.js`
2. Start Next.js: `cd mix-techniques-site && npm run dev`
3. Login → navigate to `/vote`
4. Verify WS connection (status indicator)
5. Drag faders → verify values update
6. Submit scores → verify toast appears
7. Open `host-panel.html` → verify viewer meter bridge updates
8. List all files created/modified
