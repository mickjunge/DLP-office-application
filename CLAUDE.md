# DLP-office-application — Office Hub

React + TypeScript + Tailwind + Supabase + Vite. Office hub for booking meeting rooms and the studio at David Lewis Productions.

This is a **separate project** from DLP-Artists-hub (`artists.davidlewis.nl`) — separate repo, separate Supabase project, separate Vercel project. Do not assume shared database, auth users, or deployment with that app. If a task references Artists Hub data or code, that's a different working directory (`DLP-Artists-hub`), not this one.

## Stack

- Vite + React 19 + TypeScript, path alias `@/*` → `src/*`.
- Tailwind v4 via `@tailwindcss/vite`, themed to match davidlewis.nl (see UI conventions below); `preline` is still a dependency (wired in `src/main.tsx` / `src/index.css`).
- Supabase (`src/integrations/supabase/client.ts`) for data only — **no auth for now**. The app is a public page for the whole office; anyone can view/create/edit/cancel a booking. `bookings` has a free-text `booked_by` name column instead of a `user_id`, and RLS grants full access to the `anon` role. If real auth is reintroduced later, that RLS model (migration `20260930130000_public_no_auth.sql`) needs to be revisited first — don't add a login page without also locking the policies back down.
- `@tanstack/react-query` for data fetching, `react-router-dom` for routing, Radix UI for interactive primitives (tooltip/dialog/dropdown), `sonner` for toasts.
- Local dev runs on port **8081** (Artists Hub uses 8080) so both can run side by side.

## Preline

`preline` is a real dependency, but **no component here uses Preline's own JS or `data-hs-*` attributes** — everything interactive (modals, dropdowns, tooltips) is hand-built with Radix UI. Visual styling follows the davidlewis.nl look below, not Preline's class conventions.

## UI conventions — davidlewis.nl look

The app is styled after the marketing site (davidlewis.nl) and the Artists Hub login page, **dark** and monochrome. This supersedes the earlier light, Preline-class-based styling and the "keep theme.css in sync with Artists Hub" rule: this app's `src/themes/theme.css` is now intentionally its own (near-black `#000204`, white text, Helvetica Neue). No accent hue — status red/green on the floor plan is the only color.

All shared styles live in `src/index.css`; reuse them, don't re-inline:
- `GlassButton` (`src/components/GlassButton.tsx`) — pill with translucent fill and a glowing 1px ring. `tone="primary"` is the solid-white main action (as on the Artists Hub login), `tone="danger"` for destructive, `size="sm"`, `icon`.
- `.glass-card` + `.glass-card-inner` — frosted panel (`bg-black/35`, heavy blur, 1px white/12 border, inner top highlight), same as the login form.
- `.glass-input` — pill input. `.eyebrow` — small uppercase tracked-out labels/section titles.
- Small controls (chips, round icon buttons): `rounded-full border border-white/20 bg-white/[0.04] hover:bg-white/15`.
- Toasts are styled globally in `index.css` (dark glass).
- Logo/background assets (`logo-transparent.png`, `login-bg.avif`) are copied from Artists Hub `public/`.

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
<div className="absolute inset-0 z-10 bg-[#0a0d0f] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 rounded-2xl">
  <svg viewBox="0 0 32 32" className="size-12">
    <circle cx="16" cy="16" r="15" fill="none" stroke="#10b981" strokeWidth="2" className="success-check-circle" />
    <path d="M9 16.5 L14 21.5 L23 11" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="success-check-mark" />
  </svg>
  <p className="text-sm font-medium text-white animate-in fade-in duration-300">Saved</p>
</div>
```

## Booking domain notes

Room/studio double-booking must be prevented at the database level, not just in application code — use a Postgres `EXCLUDE` constraint over a `tstzrange` column so overlapping bookings for the same room are rejected atomically under concurrent requests, rather than racing a "check then insert" in JS.

## Deploy

Vercel project not yet created — hold off on `vercel` commands until that's set up.
