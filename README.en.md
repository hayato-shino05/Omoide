# Omoide

> **Omoide Bako**
> An interactive celebration and keepsake space for birthdays, cherished memories, and friends.

<p align="center">
  <img src="./public/images/banners/banner_option_2_minimal.jpg" alt="Omoide Bako Banner" width="100%">
</p>

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/lang-%E6%97%A5%E6%9C%AC%E8%AA%9E-red" alt="Japanese"></a>
  <img src="https://img.shields.io/badge/version-0.1.0-4f46e5" alt="Version 0.1.0">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow" alt="License MIT"></a>
  <img src="https://img.shields.io/badge/Next.js-16.0.7-black?logo=nextdotjs" alt="Next.js 16.0.7">
  <img src="https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react&logoColor=111111" alt="React 19.2.1">
  <img src="https://img.shields.io/badge/Three.js-0.185.1-black?logo=threedotjs" alt="Three.js 0.185.1">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=ffffff" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=ffffff" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Supabase-2.86.2-3FCF8E?logo=supabase&logoColor=ffffff" alt="Supabase 2.86.2">
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel" alt="Deploy on Vercel">
</p>

## INDEX

1. [ABOUT](#about)
2. [FEATURES](#features)
3. [VALUE](#value)
4. [TECH STACK](#tech-stack)
5. [ENVIRONMENT](#environment)
6. [HOW TO USE](#how-to-use)
7. [DEPLOY](#deploy)
8. [SECURITY](#security)
9. [PROJECT STRUCTURE](#project-structure)
10. [NPM SCRIPTS](#npm-scripts)
11. [DOCUMENTS](#documents)
12. [CONTRIBUTING](#contributing)
13. [LICENSE](#license)

## ABOUT

`Omoide` (Slogan: **Omoide Bako**) is an interactive Web application for remembering, celebrating, documenting, and sharing birthdays and anniversaries.

<p align="center">
  <img src="./public/images/banners/banner_option_1_ghibli.jpg" alt="Omoide Bako Concept Illustration" width="100%">
</p>

Beyond birthday countdowns and 2D/3D cake candle-blowing, it brings together a Three.js interactive 3D Omikuji fortune cylinder, photo & video albums, real-time group chat, a message bulletin board, photo booth, digital time capsule, mini-games, and 13 dynamic seasonal & festival themes into a single warm and inviting space. It is designed to serve as a shared celebration sanctuary for families, friends, teams, or communities.

> [!NOTE]
> This README avoids decorative emoji and represents feature groups with `lucide-react` icon names.

## FEATURES

### CELEBRATION & CORE

| Icon | Feature | Description |
|------|---------|-------------|
| `Timer` | Real-time countdown | Shows the remaining time until the next birthday or milestone using Supabase data. |
| `Cake` | Interactive cake | 2D/3D cake with microphone-enabled candle blowing interaction. |
| `Scroll` | 3D Omikuji Fortune (Three.js) | Interactive 3D Japanese Omikuji cylinder with 360-degree orbit, haptic shake physics, bamboo stick reveal, Waka/Haiku poems, 4 life categories (Bond, Health, Wish, Blessing), and lucky items. |
| `Music` | Music player, live lyrics, and song picker | Stream curated high-quality celebration music hosted on Cloudflare R2 + Supabase, or search across SoundCloud and Jamendo (`/api/music/search`, `/api/music/resolve`). Features a live synchronized LRC lyrics drawer (`LyricsDrawer`), playback controls (Shuffle 🔀, Repeat modes 🔁 all/one/off, custom progress-fill seekbar, volume control), and state persistence across page reloads (Zustand + `localStorage`). |
| `PartyPopper` | Visual effects | Displays confetti, fireworks, balloons, and seasonal particle effects. |

### MEDIA & KEEPSAKES

| Icon | Feature | Description |
|------|---------|-------------|
| `Image` | Photo & video album | Organizes memories with Supabase Storage. |
| `Camera` | Photo booth / frame | Applies seasonal frames to WebRTC camera captures or library images and downloads the result as an image. |
| `Clock` | On This Day Flashback | Revisit memories and photos from past milestones on the same calendar day. |
| `Mail` | Time Capsule | Seal a letter with an optional photo for a future milestone date, share it with an access code, and print an unlocked capsule as a keepsake card. |
| `Tags` | Tag management | Adds searchable tags to media files. |
| `Upload` | Media upload | Supports image and video uploads through `react-dropzone`. |
| `Search` | Search | Helps users find media by tags or text. |

### GAMES AND ENTERTAINMENT

| Icon | Feature | Description |
|------|---------|-------------|
| `Brain` | Memory game | Card matching mini-game for entertainment. |
| `Puzzle` | Jigsaw puzzle | Creates customizable jigsaw puzzles from memory photos. |
| `HelpCircle` | Birthday quiz | Interactive trivia quiz for the celebrant. |
| `Calendar` | Birthday calendar | Monthly overview of birthdays and anniversaries. |

### COMMUNITY

| Icon | Feature | Description |
|------|---------|-------------|
| `MessageCircle` | Real-time chat | Real-time group messaging powered by Supabase Realtime. |
| `ClipboardList` | Message board (Yosegaki) | Digital guestbook for wishes, likes, and replies. |
| `Mic` | Voice messages | Browser voice recording and audio message sharing. |
| `Video` | Video messages | Record and save video greetings directly from the webcam. |
| `Gift` | Virtual gifts | Select and send digital celebration gifts. |
| `Share2` | Sharing links | Share the celebration page through social platforms, the Web Share API, or a copied link. |

### THEMES & MOBILE OPTIMIZATION

| Icon | Feature | Description |
|------|---------|-------------|
| `Palette` | Four seasons | Dynamic visual themes for Spring, Summer, Autumn, and Winter. |
| `CalendarDays` | 13 Festival themes | Dynamic themes for Hanami, Tanabata, Obon, Tsukimi, Shogatsu, Halloween, Christmas, etc. |
| `Compass` | Mobile Bottom Dock & Drawer | Mobile-first bottom dock and expandable Japanese memory drawer. |
| `Type` | Japanese Typography System | High-contrast font stack: Windows (Yu Gothic / Meiryo), macOS / iOS (Hiragino Sans), and Mincho Serif (Yu Mincho / Noto Serif JP). |
| `Languages` | Multi-language (i18n) | Seamless switching between Japanese (JA) and English (EN). |

## VALUE

1. **Never miss a milestone**
   - Live countdowns to upcoming birthdays and special dates.
   - Centralized anniversary registry for friends and family.

2. **A digital keepsake box (Omoide Bako)**
   - Consolidate photos, videos, voice recordings, guestbook wishes, photobooth strips, and time capsules in one place.
   - Relive cherished moments anytime in a nostalgic, cozy atmosphere.

3. **Joyful online celebrations**
   - Interactive 3D Omikuji, mini-games, and animated effects bring energy and delight.
   - Dynamic 13-festival theme engine keeps the site fresh and lively all year round.

4. **Private community sanctuary**
   - Ideal for friend circles, school clubs, teams, and families.
   - Open source and highly extensible for your own events.

## TECH STACK

### FRONTEND

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | App Router & API Routes (Turbopack) |
| React | 19.2.1 | UI Components |
| Three.js | 0.185.1 | 3D Omikuji cylinder & WebGL rendering |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.23.25 | Animation |
| lucide-react | 0.556.0 | UI Icons |
| Zustand | 5.0.9 | Global state |
| TanStack Query | 5.90.12 | Server state & caching |
| react-dropzone | 14.3.8 | Drag-and-drop file upload |
| date-fns | 4.1.0 | Date utilities |

### BACKEND & SERVICES

| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL-based BaaS |
| Supabase Storage | Media asset storage |
| Supabase Realtime | Real-time messaging subscription |
| Next.js API Routes | Serverless backend endpoints |
| Jamendo API / SoundCloud API | Music search and stream resolution (`lib/music/server.ts`) |
| Vercel Analytics | Web analytics |
| Vercel | Hosting platform |

> Music playback runs on the browser's native Audio API. The curated preset catalog and any provider stream resolved by `/api/music/resolve` are loaded directly as audio sources.

## ENVIRONMENT

### PREREQUISITES

| Item | Version or requirement |
|------|------------------------|
| Node.js | 20.9.0 or later |
| npm | Bundled with Node.js |
| Supabase | Project URL and anonymous key required |
| Browser | Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+ |

### ENVIRONMENT VARIABLES

Copy `.env.example` to `.env.local` to get started.

```bash
cp .env.example .env.local
```

Among the variables in `.env.example`, `NEXT_PUBLIC_*` variables are public and get inlined into the client bundle. Everything else is server-only. See `.env.example` for the full list of variable names.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Supabase anonymous (public) key, used together with RLS |
| `NEXT_PUBLIC_BASE_URL` | Optional | Site base URL used for sitemap canonical URLs and as the scheduler target URL in GitHub Actions |

| Variable | Purpose |
|----------|---------|
| `BIRTHDAY_SCHEDULER_SECRET` | Shared secret for the daily birthday-thread scheduler. `POST /api/internal/birthday-scheduler` compares the request header `x-birthday-scheduler-secret` against this value. Set the same value in the deployment environment and GitHub Actions. |
| `JAMENDO_CLIENT_ID` | Jamendo API client ID used for music search. When unset, only Jamendo search is disabled; the curated presets still play. |
| `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET` | SoundCloud OAuth client credentials used to search and resolve SoundCloud streams. |

> Do not put server-only variables into the client bundle. `.env.example` only contains placeholder values; store real values in Vercel environment variables or GitHub Actions secrets.

> The i18n language preference is stored in a cookie named `birthday-locale` (defined as `LANGUAGE_COOKIE_NAME` in `lib/i18n/cookie.ts`). SSR language detection and the UI switch both read this cookie.

## HOW TO USE

### 1. Clone the repository

```bash
git clone https://github.com/hayato-shino05/Omoide.git
cd Omoide
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Prepare Supabase

See [DATABASE.md](./DATABASE.md) for the required tables, Storage buckets, and RLS policies.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Verify locally

```bash
npm run lint
npm run test
npm run build
```

### 7. Add and sync music & lyrics

To manage or upload custom music tracks and synchronized lyrics, use the automated sync script powered by Cloudflare R2 and Supabase. See [DATABASE.md](./DATABASE.md#音楽と歌詞の追加管理手順) for full details.

```bash
# Convert local audio (FLAC/MP3), covers, and .lrc lyrics, then upload to R2 and Supabase
node scripts/sync-local-music-to-r2-and-supabase.mjs

# Reorder tracks by sort order
node scripts/reorder-music-tracks.mjs
```

## DEPLOY

### Deploying to Vercel

[Open this repository in Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhayato-shino05%2FOmoide&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_BASE_URL&envDescription=Supabase%20configuration%20and%20public%20base%20URL&envLink=https%3A%2F%2Fsupabase.com%2Fdocs)

To deploy manually, import the repository into Vercel and configure the required environment variables.

### Daily birthday-thread generation

Every day at 09:05 (JST), the schedule in `.github/workflows/supabase-healthcheck.yml` (`cron: '5 0 * * *'` / `Asia/Tokyo`) calls `POST /api/internal/birthday-scheduler`, which generates threads for members whose birthday is today.

- The endpoint only processes requests whose `x-birthday-scheduler-secret` header matches the `BIRTHDAY_SCHEDULER_SECRET` environment variable (compared with `timingSafeEqual`).
- Register the shared `BIRTHDAY_SCHEDULER_SECRET` and the target URL `NEXT_PUBLIC_BASE_URL` as GitHub Actions secrets, and set the same `BIRTHDAY_SCHEDULER_SECRET` on the deployment (Vercel) side.
- To run it outside the schedule, trigger the workflow manually with `workflow_dispatch`.

## SECURITY

| Item | Handling |
|------|----------|
| Supabase anonymous key | A public key used from the frontend. It is combined with RLS to scope access. |
| Supabase service role key | Never expose it. Do not put it in `.env.local`, this README, or the client bundle. |
| Server-only secrets | Variables outside `NEXT_PUBLIC_*` (for example `BIRTHDAY_SCHEDULER_SECRET`, `SOUNDCLOUD_CLIENT_SECRET`) must not be exposed to clients. Reference them only in server execution contexts such as API Routes. |
| RLS | Enable RLS on the Supabase side. |
| Uploads | Manage file size, type, and visibility through Supabase settings and app-side validation. |

## PROJECT STRUCTURE

See [STRUCTURE.md](./STRUCTURE.md) for architecture details.

```text
omoide/
├── app/                      # Next.js App Router and API Routes
├── components/               # UI, feature, community, game, and effect components
├── config/                   # Theme and music configuration
├── data/                     # i18n and festival data packs
├── lib/                      # hooks, stores, Supabase, i18n, music, providers
├── public/                   # Static assets
├── types/                    # TypeScript type definitions
├── __tests__/                # Vitest tests
├── e2e/                      # Playwright E2E tests
├── scripts/                  # Data generation and maintenance scripts
├── DATABASE.md               # Supabase schema
├── STRUCTURE.md              # Architecture overview
└── package.json              # Scripts and dependencies
```

## NPM SCRIPTS

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`). |
| `npm run test` | Run Vitest once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:coverage` | Run tests with coverage. |
| `npm run test:e2e` | Run E2E tests with Playwright. |
| `npm run generate:data` | Regenerate the manifests under `data/generated/`. |

## DOCUMENTS

| Document | Contents |
|----------|----------|
| [README.md](./README.md) | Japanese README |
| [STRUCTURE.md](./STRUCTURE.md) | Directory layout and architecture |
| [DATABASE.md](./DATABASE.md) | Supabase schema and policies |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guide |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Code of conduct |

## CONTRIBUTING

Contributions are welcome. For large spec or design changes, open an Issue first to discuss the direction.

1. Fork and clone the repository.
2. Create a working branch.
3. Update the implementation or documentation.
4. Run `npm run lint`, `npm run test`, and `npm run build` when relevant.
5. Open a Pull Request.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## AUTHOR

- GitHub: [@hayato-shino05](https://github.com/hayato-shino05)

## LICENSE

This project is licensed under the [MIT License](./LICENSE).

<p align="center">
  <strong>Crafted for cherishing memories and sharing joy with loved ones.</strong>
</p>
