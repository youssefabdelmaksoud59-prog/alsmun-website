# ALSMUN V conference portal

The conference-day website for ALSMUN V: an open portal for delegates and a signed-in workspace for chairs and the secretariat.

## What it does

**Delegates (no account, no registration)**
- Submit **resolutions** clause by clause, with a live THIMUN-format preview, automatic format checks and the full THIMUN guide beside the form.
- Submit **amendments** (add / modify / strike) against an approved resolution, with the THIMUN amendment guide beside the form.
- Every submission asks for the committee and delegation, and returns a **tracking code** to check its status and read the chair's note.
- View **approved** amendments and resolutions only. Pending and rejected submissions stay private.
- View the **schedule** (filtered by committee, with "Now" highlighting) and download **chair reports**.

**Chairs (email + password)**
- Review queues for amendments and resolutions: approve, reject with a note, move back to review.
- **Choose for debate**: approves the submission and awards its points (amendment 3, resolution 3). Removing it from debate takes the points back. Points are never awarded on submission.
- **Points tally**: one-tap +1 POI and +2 speech per delegation, search, sort, and undo. POI follow-ups are not scored.
- **Attendance**: roll calls per session with Present / Present and voting / Absent, bulk marking and a majority count.
- **Score sheet** with running totals and ranks, exportable to **Excel** and **PDF**, and printable.
- Upload **chair reports** (PDF, Word, PowerPoint, Excel, text or image, up to 4 MB).
- Manage the committee's delegation roster and agenda topics.

**Secretariat**
- Everything a chair can do, for every committee.
- Create chair and secretariat accounts, assign committees, reset passwords, disable or delete accounts.
- Manage committees, the schedule, and conference settings (name, dates, venue, home-page announcement).

## Tech stack

Next.js 15 (App Router, server actions) · TypeScript · PostgreSQL with Prisma · Tailwind CSS · ExcelJS and pdf-lib for exports. Sessions are signed, http-only cookies (HS256 JWT) with bcrypt-hashed passwords. Changing a password signs the account out everywhere else.

## Deploy (about 15 minutes, free tiers)

1. **Database.** Create a free PostgreSQL database at [Neon](https://neon.tech) (or Supabase, Railway, etc.) and copy its connection string (on Neon, turn **Connection pooling off** so database migrations work).
2. **Code.** Push this folder to a GitHub repository.
3. **Hosting.** Import the repository at [Vercel](https://vercel.com/new). Add two environment variables:
   - `DATABASE_URL`: the connection string from step 1
   - `SESSION_SECRET`: a long random string (`openssl rand -base64 48`)
   - optional `CONFERENCE_TIMEZONE` (defaults to `Africa/Cairo`)
   
   Set the **Build Command** to `npx prisma migrate deploy && npm run build`, then deploy.
4. **Committees.** From your computer, with `DATABASE_URL` set to the same database, run `npm install` then `npm run db:seed`. This creates the 11 committees (GA, SC, HRC, ICJ, UNODC, SPECPOL, ECOSOC, HSC, SCMA, JA A, JA B). It is safe to run more than once.
5. **First login.** Open `https://your-site/setup` and create the first secretariat account. The page locks itself once an account exists.
6. **Set up.** In *Secretariat*: fix committee full names and topics, add chair accounts, and enter the schedule. Chairs then paste their delegation roster under *Delegations & topics*.

**Self-hosting instead:** `docker build -t alsmun .` then run it with the same environment variables. The container applies migrations on start.

## Local development

```bash
npm install
cp .env.example .env          # point DATABASE_URL at a local Postgres
npx prisma migrate dev
npm run db:seed -- --demo     # committees + demo delegations, schedule and logins
npm run dev
```

Demo logins (only created with `--demo`): `secretariat@alsmun.test` and `chair.ga@alsmun.test`, password `demo-password-123`. Never use `--demo` on the live database.

## Tests

```bash
npm run typecheck && npm run lint
npm test                       # unit tests: scoring, THIMUN checks, time zones, tracking codes
npm run build && npm run test:e2e   # end-to-end, needs a seeded --demo database
```

The end-to-end suite drives the full conference flow in a browser (submit, review, choose, points, attendance, exports, permissions, reports, secretariat tools) and checks every page for horizontal scrolling on a phone.

## Notes

- Uploaded chair reports are stored in the database, so no extra file storage service is needed.
- Public submissions are rate limited per device and have a spam honeypot. Failed sign-ins are rate limited per account and per device.
- Scores are kept as individual events, so every point can be audited and undone.
