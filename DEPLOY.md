# Going live

The site is hosted on Vercel. Each service below is optional except the
database: anything left unset is switched off and logs instead of failing.

After every change to environment variables, redeploy (Vercel → Deployments →
⋯ → Redeploy), then open `https://<your-domain>/api/health` to check it:

```json
{ "ok": true, "database": true, "sessionSecret": true, "email": true, "whatsapp": true, "payments": "off" }
```

## 1. Database (required)

1. Vercel → the project → **Storage** → **Create Database** → **Neon (Postgres)**.
   Pick the **Frankfurt (fra1)** or nearest region and connect it to the
   Production and Preview environments. This adds `DATABASE_URL` for you.
2. Under **Settings → Environment Variables**, add:
   - `SESSION_SECRET`: a long random string. Generate one with `openssl rand -base64 48`.
   - `NEXT_PUBLIC_SITE_URL`: `https://clinexpro.net` (or the Vercel URL until the domain moves).
3. Redeploy. The build runs `npm run db:migrate` first (see `vercel.json`), so
   the tables are created and every later schema change ships with its deploy.
4. Create the owner's admin account from your computer, using the production
   connection string (Neon dashboard → Connection string):

   ```bash
   DATABASE_URL="postgres://..." ADMIN_EMAIL="owner@clinexpro.net" ADMIN_PASSWORD="a strong password" ADMIN_NAME="Owner name" npx tsx scripts/seed.ts
   ```

   Don't use `--demo` on production. Sign in at `/admin/login`.

## 2. Email alerts (Resend)

Sends the team an alert for every booking, booking request and business
enquiry, and sends the customer a bilingual confirmation.

1. Create an account at resend.com and add the domain `clinexpro.net`.
   Add the DNS records it shows (SPF, DKIM) at the domain registrar and wait
   until Resend shows **Verified**.
2. Create an API key with **Sending access** only.
3. Add these environment variables:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | the key (`re_...`) |
| `EMAIL_FROM` | `Clinex Pro <bookings@clinexpro.net>` |
| `TEAM_EMAIL` | the inbox for alerts; defaults to `info@clinexpro.net` |

Customer replies go to `TEAM_EMAIL`. Team alerts reply straight to the customer.

## 3. WhatsApp alerts (WhatsApp Cloud API)

Sends the team a WhatsApp message for every new booking, request and deposit,
and sends the customer a confirmation.

1. In Meta Business Suite, create a **WhatsApp Business Account** and an app at
   developers.facebook.com with the **WhatsApp** product.
2. Register the sending number. It must be a number that is **not** already
   used in the WhatsApp app. A new SIM is simplest; the team keeps using
   +230 5504 7906 to receive alerts.
3. Create a **System User** with a permanent token that has the
   `whatsapp_business_messaging` permission.
4. In **WhatsApp Manager → Message templates**, create these two templates in the
   **Utility** category. Use the names exactly as shown, or set the env
   variables below to your own names.

   **`new_request_alert`** (English):
   > New {{1}} on the website.
   > {{2}}
   > Open: {{3}}

   **`booking_received`** (English *and* French):
   > Hi {{1}}, thank you for booking with Clinex Pro. Your reference is {{2}} for {{3}}. Deposit to confirm: {{4}}. We will call you shortly to confirm.

   > Bonjour {{1}}, merci d'avoir réservé avec Clinex Pro. Votre référence est {{2}} pour {{3}}. Acompte de confirmation : {{4}}. Nous vous appelons très vite pour confirmer.

5. Add these environment variables once Meta approves the templates (usually within minutes):

| Variable | Value |
| --- | --- |
| `WHATSAPP_TOKEN` | the System User token |
| `WHATSAPP_PHONE_NUMBER_ID` | from the app's WhatsApp → API Setup page (not the phone number) |
| `TEAM_WHATSAPP` | who receives alerts; defaults to `23055047906` |
| `WHATSAPP_TEMPLATE_TEAM` | optional, defaults to `new_request_alert` |
| `WHATSAPP_TEMPLATE_CUSTOMER` | optional, defaults to `booking_received` |

Local numbers typed by customers ("5712 3456") are converted to
international form automatically.

## 4. Online deposits

Off by default: the confirmation page says the team will send a payment link.
The booking flow, `payments` table, admin view and webhook endpoint are ready
for a gateway.

- **Testing:** `PAYMENT_PROVIDER=test` shows a "Pay deposit" button that opens
  a simulated card page (no money moves). It is refused in production unless
  you also set `PAYMENT_ALLOW_TEST=1`. Only do that on a staging/preview
  environment, never on the live site.
- **Going live:** once Clinex Pro has a merchant account, add the provider in
  `src/lib/payments/providers.ts`. It needs two functions:
  - `createCheckout` opens the gateway's payment page.
  - `parseWebhook` verifies the gateway's signature.

  Then set `PAYMENT_PROVIDER` to the provider's id, plus its keys, and register
  this URL in the gateway dashboard:
  `https://clinexpro.net/api/payments/webhook/<provider-id>`.

  Options in Mauritius include MCB (MIPS / Juice), Peach Payments and Paywise.
  The choice depends on the client's bank and fees.

## 5. Invoices

Invoices work without any setup. These settings add the company's details and
VAT. Ask the client (or their accountant) for them:

| Variable | Value |
| --- | --- |
| `BUSINESS_BRN` | Business Registration Number, printed on invoices |
| `INVOICE_PAYMENT_INSTRUCTIONS` | Bank account and Juice number, printed on unpaid invoices. Use `
` for new lines |
| `INVOICE_DUE_DAYS` | Days to pay, default 7 |
| `VAT_RATE_PERCENT` | Only if VAT-registered: `15`. Prices are treated as VAT-inclusive |
| `VAT_NUMBER` | Only if VAT-registered |

Changing VAT affects new invoices only. Issued invoices keep the rate they were issued with.

**If Clinex Pro is VAT-registered,** the MRA's e-invoicing rules may require
each invoice to be sent to the MRA system for an approval number and QR code.
That needs MRA credentials and is not built yet. Ask the accountant whether it
applies before relying on these invoices for VAT.

## Checklist

- [ ] Neon connected, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` set
- [ ] Owner admin account created; demo data not loaded
- [ ] Resend domain verified, `RESEND_API_KEY` set
- [ ] WhatsApp templates approved, `WHATSAPP_*` set
- [ ] `/api/health` shows `"ok": true`
- [ ] One real test booking: team email + WhatsApp received, customer email received
- [ ] Invoice details set (`BUSINESS_BRN`, payment instructions; VAT if registered)
- [ ] Domain `clinexpro.net` pointed to Vercel (Settings → Domains)
