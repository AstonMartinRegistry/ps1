## Repository Index

High-level map of the codebase with routes, components, libs, configs, and data flows.

### Stack
- **Next.js**: 15.x (App Router)
- **React**: 19.x
- **TypeScript**: 5.x
- **Linting**: ESLint 9 with `next/core-web-vitals`, `next/typescript`
- **Styling**: Custom CSS in `app/globals.css` (Tailwind plugin present but not used in classnames)
- **Auth/DB**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Embeddings**: DeepInfra Qwen3-Embedding-4B

### Scripts (package.json)
- `dev`: next dev --turbopack
- `build`: next build --turbopack
- `start`: next start
- `lint`: eslint

---

### App Routing Structure (`app/`)
- `app/layout.tsx`
  - Global HTML/`<body>` wrapper; loads `JetBrains_Mono` via `next/font/google`; imports `globals.css`.

- `app/(app)/layout.tsx`
  - Authenticated application shell: sidebar nav, `UserBadge`, `NotificationsBell`, `ProfileEditor` section, and conditional `SetPasswordModal` if `user_metadata.password_set` is false. Fetches user via server Supabase.

- `app/(app)/page.tsx`
  - Landing hero with title and `SearchResults` component.

- `app/(public)/login/page.tsx`
  - Public login page (client). Supports email OTP and password login using browser Supabase client.

- `app/(public)/auth/callback/route.ts` (GET)
  - Exchanges Supabase auth code for a session, then redirects to `next` or `/`.

- `app/(public)/auth/signout/route.ts` (POST)
  - Signs out via Supabase and redirects to `/login`.

#### Middleware
- `middleware.ts`
  - Protects routes: only `/login` and `/auth/*` are public. Redirects unauthenticated users to `/login`. Redirects authenticated users away from `/login` to `/`.

---

### API Routes (`app/api/*`)
- `notifications/route.ts` (GET)
  - Returns last 100 notifications for the authenticated user and `unread_count` based on `profiles.notifications_read_at`.

- `notifications/read/route.ts` (POST)
  - Sets `profiles.notifications_read_at = now()` for the current user.

- `profile/route.ts` (GET, POST)
  - GET: Returns basic profile fields plus two core text fields (mapped from `user_vectors`: "some_of_my_hobies", "what_i_want_to_do_when_i_grow_up"). Auto-creates blank profile row if missing.
  - POST: Upserts profile, updates vectors for structured profile + core texts, embedding via DeepInfra.

- `search/route.ts` (POST)
  - Inputs: `{ query, limit }`. Embeds query via DeepInfra, calls `rank_profiles` RPC in Supabase, returns ranked results. Inserts notification rows for matched users (excluding self) and calls `increment_search_counts` RPC.

- `top/route.ts` (GET)
  - Returns top profiles by `search_count`.

- `user-vectors/route.ts` (GET, POST, DELETE)
  - GET: Returns non-core `user_vectors` for the authenticated user.
  - POST: Upserts up to 15 user vector items, embedding changed texts via DeepInfra.
  - DELETE: Deletes by `id` or `content` for the current user.

---

### Components (`components/`)
- `NotificationsBell.tsx` (client)
  - Shows a bell with unread badge; toggles a dropdown that marks notifications as read and lists recent items. Subscribes to Supabase Realtime inserts on `notifications` for the current user.

- `NotificationsList.tsx` (client)
  - Polling-based list of recent notifications (used for simpler display contexts).

- `ProfileEditor.tsx` (client)
  - Loads profile + vector items; allows editing basic fields and extra vector-backed fields; saves via `/api/profile` and `/api/user-vectors`.

- `SearchResults.tsx` (client)
  - Simple search box and results grid, calling `/api/search`.

- `SetPasswordModal.tsx` (client)
  - Prompts the user to set a password and sets `user_metadata.password_set` upon success.

- `UserBadge.tsx` (client)
  - Displays user email and a small popover with a sign-out button.

---

### Libraries (`lib/`)
- `lib/supabase/server.ts`
  - `getServerSupabase()`: server-side Supabase client wired to Next.js cookies API (getAll/setAll).

- `lib/supabase/browser.ts`
  - `getBrowserSupabase()`: browser client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- `lib/embeddings/deepinfra.ts`
  - `getDeepinfraEmbedding(text)`: POSTs to DeepInfra Qwen3-Embedding-4B; returns a numeric vector. Throws on missing key or invalid response.

---

### Styling
- `app/globals.css`
  - Defines CSS variables and styles for the app shell, sidebar, hero, inputs, buttons, modal, notifications popover, manifesto and profile views. Uses `:has()` for section visibility based on hash targets.

---

### Public Assets (`public/`)
- SVGs: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`

---

### Configuration
- `next.config.ts`: default export with no custom options
- `eslint.config.mjs`: Flat config extending Next rules; ignores build artifacts and `next-env.d.ts`
- `postcss.config.mjs`: loads `@tailwindcss/postcss` plugin
- `tsconfig.json`: strict TS settings, `paths` alias `@/*` -> project root

---

### Environment Variables
Defined in `README.md` and used in code:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional; not referenced directly in code here)
- `NEXT_PUBLIC_SITE_URL` (docs mention; not referenced in code)
- `DEEPINFRA_API_KEY` (required by embedding lib)

---

### Data Model (referenced by code)
- Tables: `profiles`, `notifications`, `user_vectors`
- RPC functions: `rank_profiles`, `increment_search_counts`
- Notes:
  - Notifications: inserted on search for matched users; unread count derived from `profiles.notifications_read_at`.
  - Vectors: two core keys are used for profile text — `some_of_my_hobies` and `what_i_want_to_do_when_i_grow_up`.

---

### Request Flow Highlights
- Login: `/login` (OTP or password) → `/auth/callback` sets session → middleware grants access.
- Authenticated shell: `/(app)` layouts & components fetch via server or client Supabase as appropriate.
- Search: `/api/search` → DeepInfra embed → Supabase RPC rank → notifications + search count updates.
- Profile: `/api/profile` + `/api/user-vectors` to save human-readable fields and vectorized extras.
- Notifications: client subscribes to Realtime inserts; marking read updates `profiles.notifications_read_at`.

---

### File Tree (selected)
```
my-app/
  app/
    (app)/
      layout.tsx
      page.tsx
    (public)/
      auth/
        callback/route.ts
        signout/route.ts
      login/page.tsx
      set-password/
    api/
      notifications/route.ts
      notifications/read/route.ts
      profile/route.ts
      search/route.ts
      top/route.ts
      user-vectors/route.ts
    globals.css
    layout.tsx
  components/
    NotificationsBell.tsx
    NotificationsList.tsx
    ProfileEditor.tsx
    SearchResults.tsx
    SetPasswordModal.tsx
    UserBadge.tsx
  lib/
    embeddings/deepinfra.ts
    supabase/browser.ts
    supabase/server.ts
  public/*.svg
  middleware.ts
  next.config.ts
  eslint.config.mjs
  postcss.config.mjs
  tsconfig.json
  package.json
```

---

### Notes / Caveats
- Middleware uses public path detection for `/login` and `/auth/*`; everything else requires a session.
- The code assumes Supabase RLS policies that allow inserts to `notifications` where `triggered_by_user_id = auth.uid()` and visibility for `recipient_user_id`.
- Watch for the hardcoded vector keys (spelling: "some_of_my_hobies").


