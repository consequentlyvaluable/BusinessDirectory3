# BusinessDirectory

A web-based business directory that allows users to search, filter, and manage listings for local businesses.

## Getting started

1. Open `index.html` in your browser to explore the Bidness Directory prototype.
2. Use the "Add a Business" button to reveal the submission form and add new listings.
3. Search by name, category, or location to quickly filter the displayed businesses once entries have been added.

## Supabase setup

1. [Create a Supabase project](https://supabase.com/dashboard/projects) if you have not already and copy the project URL and anon (public) API key from **Project Settings → API**.
2. Run the following SQL in the Supabase SQL editor to create the `businesses` table (adjust naming or constraints as needed):

   ```sql
   create table if not exists public.businesses (
     id bigint generated always as identity primary key,
     name text not null,
     category text not null,
     location text not null,
     description text,
     created_at timestamptz not null default now()
   );
   ```

3. Ensure Row Level Security (RLS) is enabled on the table, then add a policy that allows unauthenticated inserts from the anon key used by the client. A simple policy that accepts all inserts from the `anon` role looks like:

   ```sql
   create policy "Allow anon inserts"
     on public.businesses
     for insert
     to anon
     with check (true);
   ```

   You can tighten this policy later to add rate limits or validation logic that matches your requirements.
4. Update the `window.supabaseConfig` snippet in `index.html` with your project URL and anon key so the client can connect.

## Troubleshooting

- **"new row violates row-level security policy" when submitting the form** – The insert policy is missing or too restrictive. Ensure RLS is enabled and apply the sample policy above (or an equivalent one) that grants the `anon` role permission to insert into `public.businesses`. After updating policies, reload the page and try again.

=======
This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

You’re free to use, modify, and distribute this code —
as long as any changes or derivatives you share or host publicly are also released under the same open-source license.

If you deploy this project as a web service, you must make your modified source code available to your users.

👉 In short: You can use it freely, but you must keep it open.

![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/consequentlyvaluable/BusinessDirectory)
