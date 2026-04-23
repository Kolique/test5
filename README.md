# TourVista

SaaS for real estate agencies — turn regular smartphone photos of a property
into interactive **360° virtual tours** with multi-room navigation, shareable
links, and iframe embeds for SeLoger / Leboncoin / agency websites.

## Highlights

- Agent accounts (email + password, JWT sessions)
- Multi-property dashboard with per-room management
- Drag-and-drop photo upload (auto-rotate + resize via Sharp)
- Automatic panorama stitching (equirectangular 4096×2048) with
  AI-style procedural inpainting of missing vertical/horizontal zones
- 360° viewer (Pannellum) — mouse + touch, fullscreen, mobile-first
- Hotspots: click a point in one room to teleport to another
- Public share URL + `<iframe>` embed snippet ready to paste

## Stack

- **Next.js 14** (App Router, Server Components) + TypeScript
- **Tailwind CSS** + custom design system
- **Prisma** + SQLite (swap `DATABASE_URL` for Postgres in prod)
- **Sharp** for image processing & stitching
- **Pannellum** for the WebGL panorama viewer (loaded from CDN)
- **jose + bcryptjs** for JWT cookie sessions
- **lucide-react** icons

## Run locally

```bash
npm install
npx prisma db push
npm run dev
```

Open <http://localhost:3000>.

## How an agent uses it

1. Sign up → create a property.
2. Add rooms (Salon, Cuisine…) then drag 4–6 photos per room taken from
   the **same central point**, covering all directions.
3. Click *Générer le panorama 360°* — Sharp assembles the photos with
   horizontal feathering and fills missing arcs with a neighbor-sampled
   gradient blur (swappable for a true inpainting model via
   `src/lib/stitching.ts`).
4. Once at least two rooms are ready, open the **Hotspots** editor and
   click a point in the 360° view to create a navigation link to another
   room.
5. Copy the public link or the iframe embed → paste into the listing.

## Architecture notes

| Concern | Location |
| --- | --- |
| Auth (JWT cookies) | `src/lib/auth.ts` |
| Panorama stitching | `src/lib/stitching.ts` |
| File storage | `src/lib/storage.ts` (local `public/uploads/`) |
| DB | `prisma/schema.prisma` |
| Viewer | `src/components/PanoramaViewer.tsx` |
| Public tour | `src/app/tour/[slug]` |
| Embed iframe | `src/app/embed/[slug]` |

For production, replace local storage with S3 / R2 and swap the simple
feathering stitch for OpenCV-based feature matching (or call a hosted
model like Replicate's panorama/inpaint endpoints from the process route).
