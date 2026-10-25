import "server-only";

// Notification hook for new bookings and leads. Phase 1 will wire this to
// WhatsApp Business and an email service; until then it only logs.
export async function notifyTeam(subject: string, lines: string[]) {
  console.info(`[notify] ${subject}\n  ${lines.join("\n  ")}`);
}
