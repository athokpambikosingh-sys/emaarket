# Emaarket

Emaarket is a Next.js marketplace backed by Supabase Auth, Postgres, Realtime, and Storage.

## Local setup

1. Install Node.js 20.9 or newer and pnpm 12.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project API settings. A publishable key can be used for the anon key variable. Never put a `service_role` key in a `NEXT_PUBLIC_` variable.
3. Apply the database migrations to the existing Supabase project:

   ```sh
   pnpm dlx supabase login
   pnpm dlx supabase link --project-ref YOUR_PROJECT_REF
   pnpm dlx supabase db push
   ```

   The migrations under `supabase/migrations` create the schema, RLS policies, checkout and artisan RPCs, storage bucket policies, and realtime configuration. Review them before applying to a production database.
4. In Supabase Authentication URL Configuration, set the production site URL and add redirect URLs for the deployed site, `/auth/callback`, and `/auth/update-password`. Keep the local redirect `http://localhost:3000/**` for development.
5. Run `pnpm install`, `pnpm dev` for local development, or `pnpm build` followed by `pnpm start` for a production build.

## Deployment

Deploy as a Node.js application on Vercel or another Next.js hosting provider. Set the two public Supabase variables in the hosting provider's environment configuration for Preview and Production, run the build, and apply migrations separately with the Supabase CLI. Do not run database migrations from the public application process. Confirm the Supabase Auth redirect allowlist includes the final deployment domain. Realtime requires the project to have the listed tables enabled for Postgres Changes; the migration enables the app's required tables.

Create the first admin only from a trusted SQL session after signing up the account:

```sql
update public.profiles set role = 'admin' where id = '<auth user UUID>';
```

## End-to-end test walkthrough

Before testing, set the environment variables, apply all migrations with `pnpm dlx supabase db push`, and add `http://localhost:3000/**` to Supabase Auth's redirect allowlist. Run `pnpm dev` and use separate email addresses or a private browser session for each role. If email confirmation is enabled, confirm each signup before signing in.

### Artisan

1. Create an account at `/auth/signup` with the Artisan / Seller role, confirm it, and sign in. The artisan profile is created on first authenticated load.
2. Open `/dashboard/artisan` → **Products** → **Add product**. Enter a name, category, price, stock, details, and optionally select a JPG, PNG, or WebP image under 10 MB. Publish it.
3. Confirm the listing appears in the dashboard and `/shop`. Open it and confirm the artisan profile link works. Product images should load from the `product-images` bucket.
4. Keep this session available to receive a customer message and update order fulfillment status.

### Customer

1. Create and confirm a separate Customer account, then sign in.
2. Open `/shop`, find the artisan's published listing, save it to the wishlist, add it to the cart, and place an order. Use a valid phone number (7–15 digits) and a six-digit PIN.
3. Confirm the order appears under `/dashboard/customer`. From the product page, open **Chat with artisan**, send a message, and confirm the artisan receives it without refreshing.
4. After the artisan moves the order through Processing → Shipped → Delivered, submit a review on the product page. Confirm the review appears there.

### Artisan follow-up

1. Return to the artisan session and open the dashboard's **Messages** tab. Reply to the customer and confirm the reply appears in the customer session.
2. In **Orders**, advance the order status through the valid steps. Confirm the customer order history updates and delivered stock is deducted.

### Admin

1. Sign up and confirm an account. Promote it to admin from the Supabase SQL editor using its Auth user UUID and the SQL above; then sign out and back in.
2. Open `/dashboard/admin`. Verify that user roles, artisan verification/active controls, product moderation, order counts, and bulk request counts load.
3. Verify the test artisan. Confirm the verified badge appears on the public artisan profile. Archive the test product and confirm it disappears from the public shop; publish it again to restore it.

Finally, test access boundaries with separate browser sessions: a customer must not see another customer's order, an artisan must not see another artisan's order lines or edit their product, and a non-admin must not access `/dashboard/admin` or change user roles. Run `pnpm build` for the production compile check.

Public storefront reads and guest cart/wishlist behavior can be previewed without configuration. Authentication, database writes, uploads, and private dashboards require the real Supabase project and applied migrations.
