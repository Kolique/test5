# TourVista

SaaS for real estate agencies — turn regular smartphone photos of a property
into interactive **360° virtual tours** with multi-room navigation, shareable
links, and iframe embeds for SeLoger / Leboncoin / agency websites.

## Stack

- **Next.js 14** (App Router, Server Components) + TypeScript
- **Tailwind CSS**
- **Prisma** + **PostgreSQL** (Neon / Vercel Postgres)
- **Sharp** for image processing & panorama stitching
- **Vercel Blob** for photo & panorama storage
- **Pannellum** for the WebGL panorama viewer
- **jose + bcryptjs** for JWT cookie sessions
- **lucide-react** icons

---

## Deploy to Vercel — step-by-step

You need a Vercel account and a GitHub account connected to it. Total time: ~10 minutes.

### 1. Push the repo to GitHub

The code is already on the branch `claude/real-estate-virtual-tours-NttuC`.
Either merge it to `main` and push, or deploy the branch directly.

### 2. Create the Vercel project

1. Go to <https://vercel.com/new>
2. Import your GitHub repo.
3. Framework is auto-detected as **Next.js**. Leave the defaults.
4. Don't click "Deploy" yet — we need to add storage first.

### 3. Add a Postgres database (Neon)

In the new project's **Storage** tab:

1. Click **Create Database → Neon (Postgres)** (official Vercel integration).
2. Pick a region close to your users (e.g. Paris for EU).
3. Click **Create & Continue**.
4. When asked "Connect to project", select your project and tick
   **`DATABASE_URL`** (and `DATABASE_URL_UNPOOLED` if offered — optional).

Vercel auto-injects `DATABASE_URL` into the project's environment variables.

### 4. Add Vercel Blob storage

Still in the **Storage** tab:

1. Click **Create Database → Blob**.
2. Give it a name (e.g. `tourvista-media`).
3. Connect it to your project.

Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into the environment variables.

### 5. Set the remaining env vars

Go to **Settings → Environment Variables** and add:

| Name | Value |
| --- | --- |
| `JWT_SECRET` | Long random string — generate with `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://tourvista.vercel.app` |

### 6. Create the database schema

Before the first deploy, the Postgres DB is empty. Create the tables:

**Option A — from your machine (recommended, one-time):**

```bash
# Install Vercel CLI
npm i -g vercel

# Log in and link the repo to your Vercel project
vercel login
vercel link

# Pull the production env vars into .env.local
vercel env pull .env.local

# Push the Prisma schema to Postgres
npx prisma db push
```

**Option B — via a Vercel shell:** Use the Neon dashboard's SQL editor and
paste the DDL from `prisma/migrations` (only useful once you've run
`prisma migrate dev` at least once locally — for MVP, option A is simpler).

### 7. Deploy

1. Back on Vercel, click **Deploy**.
2. First build takes ~2 min. You'll get a `*.vercel.app` URL.
3. Visit the URL → sign up → create your first property.

### 8. (Optional) Add a custom domain

**Settings → Domains → Add** your domain. Vercel gives you DNS records
to paste into your registrar (OVH, Gandi, Cloudflare…). HTTPS is automatic.

Then update `NEXT_PUBLIC_APP_URL` to the new domain and redeploy.

---

## Local development

```bash
npm install

# 1. Start a local Postgres (Docker one-liner)
docker run -d --name tourvista-pg -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16

# 2. Set env vars
cp .env.example .env
# Edit .env:
#   DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"
#   BLOB_READ_WRITE_TOKEN=<get one from your Vercel project>

# 3. Create schema
npm run db:push

# 4. Run
npm run dev
```

`BLOB_READ_WRITE_TOKEN` is required even locally (the app uploads to Vercel
Blob, not a local disk). Grab one from your Vercel project's Blob store
(*Storage → Blob → `.env.local` tab*).

---

## Cost expectations (hobby scale)

- **Vercel** — free plan covers 100 GB bandwidth. The `/process` route
  uses `maxDuration = 60`, which requires the **Pro plan ($20/mo)**. You
  can lower it to 10 and keep Hobby, at the risk of timeouts on 6-photo
  rooms with slow Blob I/O.
- **Neon Postgres** — free tier (0.5 GB, 1 project).
- **Vercel Blob** — 1 GB free, then $0.15/GB. A single panorama is ~250 KB,
  so 1 GB ≈ 4 000 panoramas. Plenty for an MVP.

Total: **free to ~$20/month** until you cross Vercel's bandwidth/usage limits.

---

## Architecture

| Concern | Location |
| --- | --- |
| Auth (JWT cookies) | `src/lib/auth.ts` |
| Panorama stitching | `src/lib/stitching.ts` |
| Blob storage | `src/lib/storage.ts` |
| DB schema | `prisma/schema.prisma` |
| 360° viewer | `src/components/PanoramaViewer.tsx` |
| Public tour | `src/app/tour/[slug]` |
| Embed iframe | `src/app/embed/[slug]` |

### Swapping the stitching engine

The current stitcher is a deterministic Sharp pipeline that feathers
adjacent photos into an equirectangular canvas and procedurally fills
missing ceiling/floor arcs. To plug in a real inpainting / feature-matching
model:

- Replace `buildVerticalFill` in `src/lib/stitching.ts` with a call to
  Replicate / Fal.ai / OpenAI edits.
- Or replace the whole `buildPanorama` function with a call to an
  OpenCV-based worker (Hugin, PTGui server-side equivalent).

The API route `src/app/api/rooms/[id]/process/route.ts` only cares that
`buildPanorama` returns a panorama buffer + thumbnail buffer.

---

## Security / production checklist

- [ ] Set `JWT_SECRET` to a real 48-byte random value.
- [ ] Add rate limiting on `/api/auth/login` and `/api/rooms/[id]/process`
      (e.g. Upstash Ratelimit — ~10 lines).
- [ ] Add Stripe subscriptions if you want to monetise.
- [ ] Add mentions légales / CGU (mandatory for a French SaaS).
- [ ] Backup strategy for Postgres (Neon has PITR on paid plans).
