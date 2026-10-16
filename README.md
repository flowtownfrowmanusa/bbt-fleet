# BBT Fleet — free starter app

This is a custom-coded, mobile-friendly web app starter for tracking vehicles and equipment. It supports mileage, engine hours, calendar-based schedules, service history, parts/labor costs, and a due/overdue dashboard.

## What works in this starter
- Crew accounts through Supabase Auth
- Shared asset list and service records for signed-in crew
- Meter-reading updates with a basic rollback check
- Service schedules by miles, engine hours, or days
- Dashboard due/overdue status and service history
- Installable web app shell on supported phones
- Browser notification prompt/check while the app is open

## Important notification limitation
This version does **not** send guaranteed background push notifications while the app is closed. A normal website cannot reliably run scheduled code on a phone in the background. Reliable push needs a server-side scheduled job plus push subscription handling. This can sometimes be assembled with free tiers, but free quotas/terms may change and setup is more advanced. Until that is added, use the dashboard and open the app periodically. The notification check is a prototype, not a substitute for critical maintenance reminders.

## Free setup overview
1. Create a Supabase account/project at https://supabase.com (choose the free plan).
2. In Supabase, open SQL Editor, paste `supabase-schema.sql`, and run it.
3. In Project Settings / API, copy the Project URL and the **publishable/anon public key**. Never use a `service_role` or secret key in the browser.
4. Host the files over HTTPS. A simple route is a GitHub repository plus GitHub Pages. Create a private repository if your plan supports the private Pages configuration you want; verify current GitHub Pages plan rules before publishing. Another free static host can also work.
5. Open the hosted site and paste the Supabase URL and public anon key into the setup panel.
6. In Supabase Authentication settings, decide whether to require email confirmation. Create your first account from the login screen; if email confirmation is on, confirm it before signing in.
7. Create accounts for crew members. All authenticated accounts currently share access to the same fleet data.

## Security notes
- The public/anon key is designed to be used in browser apps when Row Level Security is correctly configured.
- Never put a Supabase service-role key, database password, or other secret in `index.html`, `app.js`, or a public repository.
- This starter policy lets every authenticated user read, edit, and delete every record. Only invite trusted crew. For production use, add company/team membership, role permissions, audit history, and tested backup/restore.
- Keep regular exports/backups. Free service tiers are not a guarantee of permanent free hosting or long-term data retention.

## Service schedule logic
- Mileage: due at last-completed mileage + interval.
- Engine hours: due at last-completed hours + interval.
- Calendar: due at last service date + interval days.
- “Alert threshold” is how early the dashboard calls an item due soon. For date schedules it is days; for mileage/hour schedules it is the same unit as the interval.

## Known starter limitations / next development tasks
- Editing assets and schedules is not yet implemented; delete/re-add to correct a record in this prototype.
- Service log updates schedule baselines only when the service name exactly matches the schedule name (case-insensitive).
- One-time schedule handling is basic.
- No photo attachments, invoices, QR labels, role permissions, CSV export, or full audit log yet.
- No reliable server-sent push/email/SMS reminders yet.
- Test all calculations and access rules with sample data before relying on this for maintenance decisions.
