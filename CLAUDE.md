# DLP-office-application — Office Hub

React + TypeScript + Tailwind + Supabase + Vite. Office hub for reserving meeting rooms and the studio at David Lewis Productions.

This is a **separate project** from DLP-Artists-hub (`artists.davidlewis.nl`) — separate repo, separate Supabase project, separate Vercel project. Do not assume shared database, auth users, or deployment with that app. If a task references Artists Hub data or code, that's a different working directory (`DLP-Artists-hub`), not this one.

## Stack

- Vite + React 19 + TypeScript, path alias `@/*` → `src/*`.
- Tailwind v4 via `@tailwindcss/vite` (no Preline dependency here — this app builds its own visual language from scratch, styled loosely after Artists Hub's conventions below but not required to match pixel-for-pixel).
- Supabase (`src/integrations/supabase/client.ts`) for data only — **no auth for now**. The app is a public page for the whole office; anyone can view/create/edit/cancel a booking. `bookings` has a free-text `booked_by` name column instead of a `user_id`, and RLS grants full access to the `anon` role. If real auth is reintroduced later, that RLS model (migration `20260930130000_public_no_auth.sql`) needs to be revisited first — don't add a login page without also locking the policies back down.
- `@tanstack/react-query` for data fetching, `react-router-dom` for routing, Radix UI for interactive primitives (tooltip/dialog/dropdown), `sonner` for toasts.
- Local dev runs on port **8081** (Artists Hub uses 8080) so both can run side by side.

## UI conventions (carried over from Artists Hub, adjust as this app finds its own identity)

### Buttons
```
// Primary (dark)
"h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-white/10 bg-neutral-700 text-white shadow-sm hover:bg-neutral-600 focus:outline-hidden transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"

// Secondary (white/outline)
"h-8 inline-flex items-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"

// Icon-only (square)
"size-8 inline-flex justify-center items-center rounded-lg bg-gray-100 border border-transparent text-gray-800 hover:bg-gray-200 focus:outline-hidden cursor-pointer"
```

### Inputs
```
const inputCls = "h-9 w-full px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-500 focus:outline-hidden focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-800 disabled:pointer-events-none";
```

### Cards
```
"bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] px-5 py-4"
```
Card title: `"text-base font-semibold text-gray-800"`, description: `"text-sm text-gray-500 mt-0.5"`.

### Tooltips
Always Radix, always instant, always above:
```tsx
<Tooltip.Root delayDuration={0}>
  <Tooltip.Trigger asChild>{/* trigger */}</Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content side="top" sideOffset={6} className="px-2 py-1 text-[12px] font-medium rounded bg-foreground text-background z-50 animate-in fade-in-0 zoom-in-95">
      {label}
      <Tooltip.Arrow className="fill-foreground" />
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
```

### Success confirmation
Animated checkmark overlay (classes defined once in `src/index.css`, never redefine locally):
```tsx
<div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 rounded-xl">
  <svg viewBox="0 0 32 32" className="size-12">
    <circle cx="16" cy="16" r="15" fill="none" stroke="#10b981" strokeWidth="2" className="success-check-circle" />
    <path d="M9 16.5 L14 21.5 L23 11" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="success-check-mark" />
  </svg>
  <p className="text-sm font-medium text-gray-800 animate-in fade-in duration-300">Saved</p>
</div>
```

## Booking domain notes

Room/studio double-booking must be prevented at the database level, not just in application code — use a Postgres `EXCLUDE` constraint over a `tstzrange` column so overlapping bookings for the same room are rejected atomically under concurrent requests, rather than racing a "check then insert" in JS.

## Deploy

Vercel project not yet created — hold off on `vercel` commands until that's set up.
