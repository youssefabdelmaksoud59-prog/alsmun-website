# ALSMUN V conference portal

The conference-day website for ALSMUN V: an open portal for delegates and a signed-in workspace for chairs and the secretariat.

## What it does

The home page asks one question: **are you a delegate, a chair or the secretariat?**

**Delegates (no account, no registration)** first pick their committee. Everything after that is for that committee only.
- Submit **resolutions** clause by clause, with a live THIMUN-format preview, automatic format checks and the full THIMUN guide beside the form.
- Submit **amendments** (add / modify / strike) against an approved resolution, with the THIMUN amendment guide beside the form.
- Every submission asks for the committee and delegation, and returns a **tracking code** to check its status and read the chair's note.
- View **approved** amendments and resolutions only. Pending and rejected submissions stay private.
- View the **schedule** (filtered by committee, with "Now" highlighting) and download **chair reports**.
- See **announcements** from the secretariat at the top of every committee page, and the committee's **crisis updates** (live feed that refreshes on its own).
- **Resources** page: rules of procedure, a glossary of points and motions, and the THIMUN guide.

**Chairs (chair code)**: each committee has its own chair code, set by the secretariat.
- Review queues for amendments and resolutions: approve, reject with a note, move back to review.
- **Choose for debate**: approves the submission and awards its points (amendment 3, resolution 3). Removing it from debate takes the points back. Points are never awarded on submission.
- **Points tally**: one-tap +1 POI and +2 speech per delegation, search, sort, and undo. POI follow-ups are not scored.
- **Attendance**: roll calls per session with Present / Present and voting / Absent, bulk marking and a majority count.
- **Score sheet** with running totals and ranks, exportable to **Excel** and **PDF**, and printable.
- Upload **chair reports** (PDF, Word, PowerPoint, Excel, text or image, up to 4 MB).
- Manage the committee's delegation roster and agenda topics.
- **Report problems**: give a delegation a strike (with the reason) or report missing equipment. Both go straight to the secretariat.

**Secretariat (secretariat code)**
- Opens on **Needs attention**: open problems, strikes per delegation (3 or more highlighted), and setup still to finish.
- Everything a chair can do, for every committee.
- Everything except access codes. Chair codes and the secretariat code are owner-only.

**Owner (owner code)**
- Signs in from the faint © line at the bottom of every page (`/owner`). Has full secretariat access, and is the only one who can set chair codes, the secretariat code and the owner code. Changing a code signs out whoever used the old one.
- Manage committees, the schedule, and conference settings (name, dates, venue, home-page announcement).
- **Announcements**: push urgent notices (room changes, delays) to every committee's delegate and chair pages.
- **Crisis updates**: post news to one committee, right away or at a set time. Scheduled updates stay hidden from delegates until then; that committee's chairs see them in advance.

## Tech stack

Next.js 15 (App Router, server actions) · TypeScript · PostgreSQL with Prisma · Tailwind CSS · ExcelJS and pdf-lib for exports. Sessions are signed, http-only cookies (HS256 JWT). The owner and secretariat codes are stored bcrypt-hashed. Chair codes are stored as typed so the secretariat can look them up. Wrong codes are rate limited per device.

## Deploy (about 20 minutes, free tiers)

1. **Code.** Put this folder in a GitHub repository.
2. **Hosting.** Import the repository at [Vercel](https://vercel.com/new) and deploy once (the first build fails without a database; that's expected).
3. **Database.** In the Vercel project, open **Storage → Create Database → Neon** (region: Frankfurt) and connect it to the project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.
4. **Secret.** Under **Settings → Environment Variables** add `SESSION_SECRET`, a random string of at least 32 characters. Optional: `CONFERENCE_TIMEZONE` (defaults to `Africa/Cairo`).
5. **Redeploy.** Every deploy runs `scripts/vercel-build.sh`, which applies database migrations over the unpooled connection, creates the 11 committees the first time (never again, so deleted committees stay deleted), then builds the site. `vercel.json` pins the functions to Frankfurt (`fra1`), next to the database.
6. **Owner and secretariat codes.** Open `https://your-site/setup` and choose both. The page locks itself once the owner code exists.
7. **Set up.** Signed in as owner, in *Secretariat → Access codes*, give each committee a chair code and hand them to the chairs. Fix committee full names and topics under *Committees*, and enter the schedule. Chairs then paste their delegation roster under *Delegations & topics*.

Using a database from somewhere else? Set `DATABASE_URL` to its connection string (and `DATABASE_URL_UNPOOLED` to a direct, non-pooled one if `DATABASE_URL` goes through a pooler).

**Self-hosting instead:** `docker build -t alsmun .` then run it with the same environment variables. The container applies migrations on start.

## Local development

```bash
npm install
cp .env.example .env          # point DATABASE_URL at a local Postgres
npx prisma migrate dev
npm run db:seed -- --demo     # committees + demo delegations, schedule and logins
npm run dev
```

Demo codes (only created with `--demo`): GA chair `ga-demo-code`, SC chair `sc-demo-code`, secretariat `sec-demo-code`. Never use `--demo` on the live database.

## Tests

```bash
npm run typecheck && npm run lint
npm test                       # unit tests: scoring, THIMUN checks, time zones, tracking codes
npm run build && npm run test:e2e   # end-to-end, needs a seeded --demo database
```

The end-to-end suite drives the full conference flow in a browser (role choice, committee picking, submit, review, choose, points, attendance, strikes and equipment reports, exports, code access and permissions, reports, secretariat tools) and checks every page for horizontal scrolling on a phone.

## Notes

- Uploaded chair reports are stored in the database, so no extra file storage service is needed.
- Public submissions are rate limited per device and have a spam honeypot. Wrong chair or secretariat codes are rate limited per device.
- Scores are kept as individual events, so every point can be audited and undone.
