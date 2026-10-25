import "server-only";

// Delivery channels. Each is optional: with no credentials set it logs instead,
// so development and a half-configured launch never break a booking.

const env = (k: string) => process.env[k]?.trim() || undefined;

export const notifyConfig = {
  email: {
    apiKey: env("RESEND_API_KEY"),
    from: env("EMAIL_FROM") ?? "Clinex Pro <bookings@clinexpro.net>",
    teamTo: env("TEAM_EMAIL") ?? "info@clinexpro.net",
    // Overridable for tests.
    apiUrl: env("RESEND_API_URL") ?? "https://api.resend.com/emails",
  },
  whatsapp: {
    token: env("WHATSAPP_TOKEN"),
    phoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"),
    teamTo: env("TEAM_WHATSAPP") ?? "23055047906",
    apiVersion: env("WHATSAPP_API_VERSION") ?? "v21.0",
    apiBase: env("WHATSAPP_API_URL") ?? "https://graph.facebook.com",
    teamTemplate: env("WHATSAPP_TEMPLATE_TEAM") ?? "new_request_alert",
    customerTemplate: env("WHATSAPP_TEMPLATE_CUSTOMER") ?? "booking_received",
  },
};

export const emailEnabled = () => Boolean(notifyConfig.email.apiKey);
export const whatsappEnabled = () => Boolean(notifyConfig.whatsapp.token && notifyConfig.whatsapp.phoneNumberId);

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(mail: Email) {
  if (!emailEnabled()) {
    console.info(`[notify:email:not-configured] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  const res = await fetch(notifyConfig.email.apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${notifyConfig.email.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: notifyConfig.email.from,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(mail.replyTo && { reply_to: mail.replyTo }),
    }),
  });
  if (!res.ok) throw new Error(`Email to ${mail.to} failed: ${res.status} ${await res.text()}`);
}

export type WhatsAppTemplate = { to: string; template: string; lang: "en" | "fr"; params: string[] };

export async function sendWhatsApp(msg: WhatsAppTemplate) {
  const to = toE164Digits(msg.to);
  if (!to) throw new Error(`Not a valid phone number for WhatsApp: ${msg.to}`);
  if (!whatsappEnabled()) {
    console.info(`[notify:whatsapp:not-configured] to=${to} template=${msg.template}/${msg.lang} params=${JSON.stringify(msg.params)}`);
    return;
  }
  const { apiBase, apiVersion, phoneNumberId, token } = notifyConfig.whatsapp;
  const res = await fetch(`${apiBase}/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: msg.template,
        language: { code: msg.lang },
        components: [
          {
            type: "body",
            // WhatsApp rejects empty parameters and newlines inside them.
            parameters: msg.params.map((p) => ({ type: "text", text: p.replace(/\s+/g, " ").trim() || "-" })),
          },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp to ${to} failed: ${res.status} ${await res.text()}`);
}

/**
 * Mauritian numbers to the digits-only international form WhatsApp expects.
 * "5504 7906" → "23055047906"; "+230 5504 7906" → "23055047906". Other
 * international numbers (with + or 00) are kept as given.
 */
export function toE164Digits(phone: string): string | null {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 7 || digits.length === 8) digits = `230${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}
